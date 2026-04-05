"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import { 
    doc, updateDoc, 
    collection, query, where, getDocs, orderBy, collectionGroup, limit 
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Calendar,
    Star,
    ScrollText,
    ArrowRight,
    GraduationCap,
    User,
    Camera,
    TrendingUp,
    Award,
    FileSpreadsheet,
    Loader2,
    Sparkles,
    Trophy,
    Save,
    Phone,
    Lock,
    EyeOff,
    Eye,
    FileText,
    Shield,
    Zap,
    Coins,
    Flame,
    Hash,
    Target,
    Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingExams, setFetchingExams] = useState(false);
    const [fetchingGamification, setFetchingGamification] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'academic'>('academic');
    const [exams, setExams] = useState<any[]>([]);
    const [myBadges, setMyBadges] = useState<any[]>([]);
    const [pointsLogs, setPointsLogs] = useState<any[]>([]);
    const [showPassword, setShowPassword] = useState(false);
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

            // Fetch Exams and Gamification if on academic tab
            if (activeTab === 'academic') {
                const fetchAcademicData = async () => {
                    setFetchingExams(true);
                    setFetchingGamification(true);
                    try {
                        // Fetch Exams
                        const qExams = query(
                            collectionGroup(db, "exams"), 
                            where("userId", "==", user.uid), 
                            orderBy("createdAt", "desc")
                        );
                        const examsSnap = await getDocs(qExams);
                        setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                        // Fetch Badges (Nested Path Pattern)
                        const badgesRef = collection(db, "badges", user.uid, "badges");
                        const badgesSnap = await getDocs(badgesRef);
                        setMyBadges(badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                        // Fetch Points Logs (Last 5 for preview)
                        const logsQuery = query(
                            collection(db, "points_logs", user.uid, "points_logs"),
                            orderBy("timestamp", "desc"),
                            limit(5)
                        );
                        const logsSnap = await getDocs(logsQuery);
                        setPointsLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                    } catch (e) {
                        console.error("Error fetching academic data:", e);
                    } finally {
                        setFetchingExams(false);
                        setFetchingGamification(false);
                    }
                };
                fetchAcademicData();
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
            toast.error("فشل رفع الصورة الشخصية.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

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

            toast.success("تم تحديث الملف الشخصي بنجاح.");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "حدث خطأ أثناء التحديث.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-12 pb-32">
            {/* Elite Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-muted-foreground hover:text-white group">
                        <ArrowRight className="w-6 h-6 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight">ملفي الأكاديمي</h1>
                        <p className="text-xs font-black text-primary uppercase tracking-[0.3em] opacity-60">Elite Identification & Academic Seal</p>
                    </div>
                </div>

                <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-[2rem] w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('academic')} 
                        className={cn(
                            "flex-1 md:flex-none py-3 px-8 rounded-[1.8rem] text-sm font-black transition-all flex items-center justify-center gap-2",
                            activeTab === 'academic' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <GraduationCap className="w-5 h-5" /> السجل العلمي
                    </button>
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={cn(
                            "flex-1 md:flex-none py-3 px-8 rounded-[1.8rem] text-sm font-black transition-all flex items-center justify-center gap-2",
                            activeTab === 'profile' ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <User className="w-5 h-5" /> تعديل البيانات
                    </button>
                </div>
            </div>

            {activeTab === 'academic' ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Elite Student Card */}
                    <GlassCard className="p-10 md:p-14 relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-purple-800 text-white border-none shadow-[0_30px_60px_rgba(0,0,0,0.3)] rounded-[3.5rem]">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/20 blur-[80px] rounded-full -ml-32 -mb-32" />
                        
                        <div className="relative z-10 grid md:grid-cols-12 gap-12 items-center">
                            <div className="md:col-span-4 flex flex-col items-center gap-6">
                                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] p-1.5 bg-white/20 backdrop-blur-md shadow-2xl relative group">
                                    <div className="w-full h-full rounded-[3.3rem] overflow-hidden bg-background border-4 border-white/20 relative">
                                        {formData.photoURL ? (
                                            <img src={formData.photoURL} alt="Student" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary/20"><User className="w-20 h-20" /></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                            <Camera className="w-6 h-6 text-white cursor-pointer" onClick={() => setActiveTab('profile')} />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shadow-xl border-4 border-primary z-20 animate-bounce">
                                        <Star className="w-8 h-8 text-white fill-current" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">ID: {user?.uid.substring(0, 12).toUpperCase()}</div>
                                    <h2 className="text-3xl font-black">{formData.displayName}</h2>
                                    <p className="text-white/60 font-medium">طالب في حلقات السنة النبوية</p>
                                </div>
                            </div>

                            <div className="md:col-span-8 space-y-10">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <AcademicMetric icon={TrendingUp} label="همّة اليوم" value={`${userData?.streak || 0} يوم`} />
                                    <AcademicMetric icon={Award} label="إجمالي النقاط" value={`${userData?.totalPoints || 0}`} />
                                    <AcademicMetric icon={Star} label="المستوى" value={getLevelInfo(userData?.totalPoints || 0).label} />
                                    <AcademicMetric icon={FileSpreadsheet} label="الاختبارات" value={exams.length} />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" /> التقدم نحو المستوى التالي
                                        </p>
                                        <p className="text-xs font-black text-amber-400">
                                            {userData?.totalPoints || 0} / {getLevelInfo(userData?.totalPoints || 0).next || 'Max'} XP
                                        </p>
                                    </div>
                                    <div className="h-4 w-full bg-white/10 rounded-full p-1 overflow-hidden backdrop-blur-md border border-white/10">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ 
                                                width: (getLevelInfo(userData?.totalPoints || 0).next && getLevelInfo(userData?.totalPoints || 0).min !== undefined)
                                                    ? `${Math.min(((userData?.totalPoints || 0) - getLevelInfo(userData?.totalPoints || 0).min) / ((getLevelInfo(userData?.totalPoints || 0).next || 1) - getLevelInfo(userData?.totalPoints || 0).min) * 100, 100)}%`
                                                    : '100%' 
                                            }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <ScrollText className="w-7 h-7 text-amber-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-white/40 uppercase tracking-widest">ميثاق طالب العلم</p>
                                        <p className="font-bold text-sm italic">"من سلك طريقاً يلتمس فيه علماً سهّل الله له به طريقاً إلى الجنة"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Stats Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="md:col-span-2 space-y-6">
                            <div className="flex items-center gap-3 px-4">
                                <FileSpreadsheet className="w-5 h-5 text-primary" />
                                <h3 className="text-xl font-bold">سجل الاختبارات والنتائج</h3>
                                <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent mx-4" />
                            </div>

                            <GlassCard className="p-0 overflow-hidden border-white/5 bg-white/[0.01]">
                                {fetchingExams ? (
                                    <div className="p-24 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
                                ) : exams.length === 0 ? (
                                    <div className="p-24 text-center space-y-4">
                                        <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto opacity-40"><Award className="w-10 h-10 text-primary" /></div>
                                        <div className="space-y-1">
                                            <p className="font-black text-lg">بانتظار ثمرة جهدك!</p>
                                            <p className="text-xs text-muted-foreground font-medium">لم يتم تسجيل أي نتائج اختبارات رسمية حتى الآن.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right border-collapse">
                                            <thead>
                                                <tr className="bg-white/[0.03] border-b border-white/5">
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">العنوان</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 text-center">الدرجة</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 text-left">التاريخ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {exams.map((exam, idx) => (
                                                    <tr key={idx} className="group hover:bg-white/[0.04] transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="font-black text-lg group-hover:text-primary transition-colors">{exam.title}</div>
                                                            <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{exam.courseId || 'عام'}</div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="mx-auto w-16 py-1.5 bg-green-500/10 text-green-500 rounded-xl font-black text-lg border border-green-500/20 text-center shadow-inner">
                                                                {exam.mark}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-left">
                                                            <p className="text-xs font-black opacity-30">{new Date(exam.createdAt?.toDate ? exam.createdAt.toDate() : exam.createdAt).toLocaleDateString('ar-EG')}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </GlassCard>
                         </div>

                         <div className="space-y-8">
                            <div className="flex items-center gap-3 px-4">
                                <Award className="w-5 h-5 text-amber-500" />
                                <h3 className="text-xl font-bold">خزانة الأوسمة</h3>
                            </div>

                            <GlassCard className="p-8 space-y-6 border-white/5 bg-white/[0.01]">
                                {fetchingGamification ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin opacity-20" /></div>
                                ) : myBadges.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {myBadges.map((badge, idx) => {
                                            const Icon = AVAILABLE_ICONS.find(i => i.key === badge.iconKey)?.icon || Star;
                                            return (
                                                <div key={idx} className="group relative">
                                                    <div className={cn(
                                                        "p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-all hover:-translate-y-1",
                                                        badge.rarity === 'gold' ? "border-amber-500/20 bg-amber-500/5" : ""
                                                    )}>
                                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg", badge.color || "from-primary to-purple-600")}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-[10px] font-black truncate w-full">{badge.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center opacity-20 italic text-xs">لا توجد أوسمة محققة حالياً</div>
                                )}
                                
                                <div className="pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 px-2">آخر الأنشطة الحيوية</h4>
                                    <div className="space-y-3">
                                        {pointsLogs.map((log, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                                                        log.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                    )}>{log.amount > 0 ? `+${log.amount}` : log.amount}</div>
                                                    <span className="text-[10px] font-bold opacity-60 truncate max-w-[120px]">{log.reason}</span>
                                                </div>
                                                <TrendingUp className="w-3 h-3 opacity-20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Image Section */}
                        <div className="flex justify-center">
                             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-44 h-44 rounded-[3.5rem] overflow-hidden border-8 border-white/5 bg-white/5 p-1 backdrop-blur-md shadow-2xl relative">
                                    {formData.photoURL ? (
                                        <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover rounded-[3rem]" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                            <User className="w-20 h-20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-10 h-10 text-white" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 right-0 bg-primary text-white p-2.5 rounded-2xl shadow-xl border-4 border-background">
                                    <Save className="w-4 h-4" />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                        </div>

                        {/* Form Fields */}
                        <GlassCard className="p-10 space-y-8 border-white/5 bg-white/[0.01]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-40 px-1">الاسم الكامل</label>
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><User className="w-5 h-5" /></div>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => handleChange('displayName', e.target.value)}
                                            className="w-full p-4 pl-12 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                            placeholder="أدخل اسمك الكامل"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-40 px-1">رقم الهاتف</label>
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><Phone className="w-5 h-5" /></div>
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                            className="w-full p-4 pl-12 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-left font-mono"
                                            placeholder="+963..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-40 px-1">كلمة المرور الشخصية</label>
                                <div className="group relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><Lock className="w-5 h-5" /></div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        className="w-full p-4 pl-12 pr-12 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-40 px-1">نبذة تعريفية (Bio)</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    className="w-full p-6 rounded-[2rem] border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all h-40 resize-none font-medium leading-relaxed"
                                    placeholder="اكتب نبذة مختصرة عن تجاربك أو أهدافك في حفظ السنة..."
                                />
                            </div>
                        </GlassCard>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all flex items-center justify-center gap-4 group"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                            <span>حفـظ البيـانات الآن</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

function AcademicMetric({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
    return (
        <div className="p-6 bg-white/10 backdrop-blur-sm rounded-[2rem] border border-white/10 flex flex-col items-center text-center space-y-2 hover:bg-white/15 transition-colors">
            <div className="p-3 bg-white/10 rounded-xl text-white shadow-inner mb-1">
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    );
}

function AchievementItem({ icon: Icon, title, desc, active, color, bg }: any) {
    return (
        <div className={cn(
            "flex items-center gap-6 p-4 rounded-2xl transition-all border",
            active ? "bg-white/5 border-white/10 opacity-100" : "opacity-30 border-transparent grayscale select-none"
        )}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", bg, color)}>
                <Icon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
                <h4 className="font-black text-lg">{title}</h4>
                <p className="text-xs font-medium text-muted-foreground">{desc}</p>
            </div>
            {active && (
                <div className="mr-auto w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Star className="w-4 h-4 fill-current" />
                </div>
            )}
        </div>
    );
}

const getLevelInfo = (points: number) => {
    if (points >= 1500) return { label: 'صاحب إتقان', color: 'text-amber-500', bg: 'bg-amber-500/10', rank: 4, next: null, min: 1500 };
    if (points >= 500) return { label: 'همّة علية', color: 'text-purple-500', bg: 'bg-purple-500/10', rank: 3, next: 1500, min: 500 };
    if (points >= 100) return { label: 'طالب بصيرة', color: 'text-blue-500', bg: 'bg-blue-500/10', rank: 2, next: 500, min: 100 };
    return { label: 'بداية النور', color: 'text-emerald-500', bg: 'bg-emerald-500/10', rank: 1, next: 100, min: 0 };
};

const AVAILABLE_ICONS = [
    { key: 'Star', icon: Star },
    { key: 'Award', icon: Award },
    { key: 'Shield', icon: Shield },
    { key: 'Trophy', icon: Trophy },
    { key: 'Zap', icon: Zap },
    { key: 'Target', icon: Target },
    { key: 'Heart', icon: Heart },
    { key: 'Flame', icon: Flame },
    { key: 'Sparkles', icon: Sparkles }
];
