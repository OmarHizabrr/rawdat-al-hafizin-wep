"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    User,
    Phone,
    FileText,
    Camera,
    Save,
    Loader2,
    ArrowRight,
    Lock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        displayName: "",
        phoneNumber: "",
        password: "",
        bio: "",
        photoURL: ""
    });

    useEffect(() => {
        if (user && userData) {
            setFormData({
                displayName: user.displayName || userData.displayName || "",
                phoneNumber: userData.phoneNumber || "",
                password: userData.password || "",
                bio: userData.bio || "",
                photoURL: user.photoURL || userData.photoURL || ""
            });
        }
    }, [user, userData]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;

        const file = e.target.files[0];
        setLoading(true);
        try {
            const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            setFormData(prev => ({ ...prev, photoURL: url }));
            // Update immediately or wait for save? 
            // Better wait for save button, but for image generic ux is immediate or preview.
            // I'll keep it in state for preview, save on submit.
        } catch (error) {
            console.error("Error uploading image:", error);
            setMessage({ type: 'error', text: "فشل رفع الصورة." });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            // Update Firebase Auth
            if (formData.displayName !== user.displayName || formData.photoURL !== user.photoURL) {
                await updateProfile(user, {
                    displayName: formData.displayName,
                    photoURL: formData.photoURL
                });
            }

            // Update Firestore
            await updateDoc(doc(db, "users", user.uid), {
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                bio: formData.bio,
                photoURL: formData.photoURL
            });

            setMessage({ type: 'success', text: "تم تحديث الملف الشخصي بنجاح." });
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', text: "حدث خطأ أثناء التحديث." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowRight className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">تعديل الملف الشخصي</h1>
            </div>

            {message && (
                <GlassCard className={`p-4 border-l-4 ${message.type === 'success' ? 'border-l-green-500 bg-green-500/10' : 'border-l-red-500 bg-red-500/10'}`}>
                    <p className={message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {message.text}
                    </p>
                </GlassCard>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Image Section */}
                <GlassCard className="p-8 flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-gray-100 dark:bg-white/5">
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User className="w-16 h-16" />
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">انقر لتغيير الصورة</p>
                </GlassCard>

                {/* Form Fields */}
                <GlassCard className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            الاسم الكامل
                        </label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => handleChange('displayName', e.target.value)}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="أدخل اسمك الكامل"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            رقم الهاتف
                        </label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleChange('phoneNumber', e.target.value)}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all dir-ltr text-right"
                            placeholder="+963..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            كلمة المرور (للدخول برقم الهاتف)
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="••••••"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            * اختياري: إذا أردت الدخول لاحقاً برقم الهاتف فقط، يجب تعيين كلمة مرور.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            نبذة شخصية
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all h-32 resize-none"
                            placeholder="اكتب نبذة مختصرة عنك..."
                        />
                    </div>
                </GlassCard>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>حفظ التعديلات</span>
                </button>
            </form>
        </div>
    );
}
