"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { User, Phone, FileText, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function RegisterPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        displayName: "",
        phoneNumber: "",
        role: "pending", // Default to pending until access code verification
        bio: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.displayName || !formData.phoneNumber || !formData.password) {
            setError("Please fill in all required fields");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const newUserId = doc(collection(db, "users")).id;

            await setDoc(doc(db, "users", newUserId), {
                uid: newUserId,
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                phoneNumberNormalized: formData.phoneNumber.replace(/[^\d+]/g, ""),
                role: formData.role,
                bio: formData.bio,
                password: formData.password, // Note: Encryption recommended in production
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                email: "",
                photoURL: "",
                accessCodeVerifiedAt: null
            });

            // Redirect to access code page
            router.push("/access-code");

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to register");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold">بوابتك لتعليم وتحفيظ القرآن والسنة</h1>
                    <p className="mt-2 text-muted-foreground">انضم إلينا الآن</p>
                </div>

                <GlassCard className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">الاسم الكامل</label>
                            <div className="relative">
                                <User className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                                <input
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pr-10 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="الاسم الثلاثي"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">رقم الهاتف</label>
                            <div className="relative">
                                <Phone className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                                <input
                                    name="phoneNumber"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pr-10 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="05xxxxxxxx"
                                    dir="ltr"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">كلمة المرور</label>
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">تأكيد كلمة المرور</label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">نبذة تعريفية (اختياري)</label>
                            <div className="relative">
                                <FileText className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pr-10 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
                                    placeholder="اكتب شيئاً عن نفسك..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 p-4 font-bold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                            ) : (
                                "إنشاء الحساب"
                            )}
                        </button>
                    </form>
                </GlassCard>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    لديك حساب بالفعل؟{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        تسجيل الدخول
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
