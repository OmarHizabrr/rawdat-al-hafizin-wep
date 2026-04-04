"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { db, storage } from "@/lib/firebase";
import { 
    doc, updateDoc, 
    collection, query, where, getDocs, orderBy 
} from "firebase/firestore";
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
    Lock,
    Eye,
    EyeOff,
    BarChart3,
    Award,
    FileSpreadsheet,
    GraduationCap,
    TrendingUp,
    Calendar,
    Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingExams, setFetchingExams] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'academic'>('academic');
    const [exams, setExams] = useState<any[]>([]);
    const [showPassword, setShowPassword] = useState(false);
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

            // Fetch Exams if on academic tab
            if (activeTab === 'academic') {
                const fetchExams = async () => {
                    setFetchingExams(true);
                    try {
                        const q = query(
                            collection(db, "exams"), 
                            where("userId", "==", user.uid), 
                            orderBy("createdAt", "desc")
                        );
                        const snap = await getDocs(q);
                        setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    } catch (e) {
                        console.error("Error fetching exams:", e);
                    } finally {
                        setFetchingExams(false);
                    }
                };
                fetchExams();
            }
        }
    }, [user, userData, activeTab]);

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
            if (formData.displayName !== user.displayName || formData.photoURL !== user.photoURL) {
                await updateProfile(user, {
                    displayName: formData.displayName,
                    photoURL: formData.photoURL
                });
            }

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
                <div>
                   <h1 className="text-2xl font-bold">الملف التعريفي للطالب</h1>
                   <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest leading-none">Student Identification & Records</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className={cn(
                        "flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === 'profile' ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                    )}
                >
                    <User className="w-4 h-4" /> تعديل البيانات
                </button>
                <button 
                    onClick={() => setActiveTab('academic')} 
                    className={cn(
                        "flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === 'academic' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                    )}
                >
                    <GraduationCap className="w-4 h-4" /> الملف الأكاديمي
                </button>
            </div>

            {activeTab === 'profile' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
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
                                    className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-right"
                                    placeholder="+963..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-primary" />
                                    كلمة المرور
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        className="w-full p-3 pl-12 rounded-xl border bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-3 text-muted-foreground hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
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
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Academic Overview Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 text-center space-y-1">
                            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">إجمالي النقاط</p>
                            <p className="text-2xl font-black">{userData?.totalPoints || 0}</p>
                        </div>
                        <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-center space-y-1">
                            <TrendingUp className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">الهمّة (Streak)</p>
                            <p className="text-2xl font-black">{userData?.streak || 0} يوم</p>
                        </div>
                        <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                            <BarChart3 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">الرتبة الحالية</p>
                            <p className="text-sm font-black">{userData?.totalPoints && userData.totalPoints >= 1500 ? 'صاحب إتقان' : userData?.totalPoints && userData.totalPoints >= 500 ? 'همّة علية' : 'طالب بصيرة'}</p>
                        </div>
                        <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
                            <FileSpreadsheet className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">الاختبارات</p>
                            <p className="text-2xl font-black">{exams.length}</p>
                        </div>
                    </div>

                    {/* Academic File Header */}
                    <GlassCard className="p-8 relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
                        <Award className="absolute -top-4 -right-4 w-32 h-32 text-primary/5 -rotate-12" />
                        <div className="relative z-10 space-y-4">
                             <div className="flex items-center gap-3 text-right">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                                    {formData.photoURL ? <img src={formData.photoURL} className="w-full h-full rounded-2xl object-cover" /> : <User className="w-8 h-8 text-primary" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{formData.displayName}</h2>
                                    <p className="text-xs opacity-50">رقم الطالب: {user?.uid.substring(0, 8).toUpperCase()}</p>
                                </div>
                             </div>
                             <p className="text-xs italic opacity-60 leading-relaxed font-medium">"نور العلم ورفعة الدرجات لا تُنال إلا بالصبر والمداومة"</p>
                        </div>
                    </GlassCard>

                    {/* Exams Table */}
                    <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-sm opacity-60 px-2"><FileSpreadsheet className="w-4 h-4" /> سجل الاختبارات المجتازة</h3>
                        <GlassCard className="p-0 overflow-hidden divide-y divide-white/5">
                            {fetchingExams ? (
                                <div className="p-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin opacity-20" /></div>
                            ) : exams.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20"><Calendar className="w-6 h-6" /></div>
                                    <p className="text-[10px] opacity-40">لا توجد اختبارات مسجلة حالياً.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 p-4 bg-white/5 text-[10px] font-black uppercase opacity-60 tracking-widest text-right">
                                        <div className="col-span-2">عنوان الاختبار</div>
                                        <div className="text-center">الدرجة</div>
                                        <div className="text-left">التاريخ</div>
                                    </div>
                                    {exams.map((exam, idx) => (
                                        <div key={idx} className="grid grid-cols-4 p-5 hover:bg-white/5 transition-all group text-right">
                                            <div className="col-span-2">
                                                <p className="font-bold text-sm">{exam.title}</p>
                                                <p className="text-[8px] opacity-40">{exam.courseId || 'عام'}</p>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg font-black text-xs border border-green-500/20">{exam.mark}</div>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <p className="text-[10px] font-medium opacity-40">{new Date(exam.createdAt?.toDate ? exam.createdAt.toDate() : exam.createdAt).toLocaleDateString('ar-EG')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </GlassCard>
                    </div>

                    {/* Footer Warning */}
                    <p className="text-center text-[10px] opacity-20 py-4 font-bold tracking-widest uppercase">Elite Sunnah Platform • Academic Record Seal</p>
                </div>
            )}
        </div>
    );
}
