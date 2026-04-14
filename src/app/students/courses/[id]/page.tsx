"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    getDocs, 
    Timestamp, 
    writeBatch,
    serverTimestamp
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Calendar,
    Clock,
    Hourglass,
    BookOpen,
    FileText,
    PlayCircle,
    DownloadCloud,
    ExternalLink,
    ChevronDown,
    Loader2,
    CheckCircle,
    ArrowRight,
    Layers,
    Info,
    ArrowUpRight,
    Music,
    Link as LinkIcon,
    Sparkles,
    Lock,
    MessageCircle,
    Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { getTargetActiveRecitationSessions, RecitationSession } from "@/lib/recitation-service";

interface Course {
    id: string;
    title: string;
    description: string;
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    registrationStart: Timestamp | null;
    registrationEnd: Timestamp | null;
    cost: string;
    mechanism: string;
    features: string[];
    whatsappLink?: string;
    conditions?: string[];
}

interface Resource {
    type: string;
    title: string;
    url: string;
}

interface Level {
    id: string;
    name: string;
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    resources: Resource[];
}

export default function CourseDetails() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [recitationSessions, setRecitationSessions] = useState<RecitationSession[]>([]);
    const [loadingRecitations, setLoadingRecitations] = useState(true);

    useEffect(() => {
        const loadCourse = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "courses", id);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    setCourse({ id: snap.id, ...snap.data() } as Course);

                    const levelsRef = collection(db, "levels", id, "levels");
                    const levelsQ = query(levelsRef);
                    const levelsSnap = await getDocs(levelsQ);
                    const levelsData = levelsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Level[];
                    setLevels(levelsData);
                }
            } catch (error) {
                console.error("Error loading course:", error);
            } finally {
                setLoading(false);
            }
        };
        loadCourse();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const loadRecitations = async () => {
            setLoadingRecitations(true);
            try {
                const sessions = await getTargetActiveRecitationSessions(id, "course");
                setRecitationSessions(sessions);
            } finally {
                setLoadingRecitations(false);
            }
        };
        void loadRecitations();
    }, [id]);

    const formatDate = (ts: Timestamp | null) => {
        if (!ts) return "قريباً";
        return ts.toDate().toLocaleDateString("ar-SA", { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getDuration = (start: Timestamp | null, end: Timestamp | null) => {
        if (!start || !end) return "غير محدد";
        const diff = end.toDate().getTime() - start.toDate().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return `${days} يوم`;
    };

    const getProgress = (start: Timestamp | null, end: Timestamp | null) => {
        if (!start || !end) return 0;
        const total = end.toDate().getTime() - start.toDate().getTime();
        const elapsed = new Date().getTime() - start.toDate().getTime();
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto opacity-20" />
                    <p className="font-bold text-xs tracking-widest text-muted-foreground uppercase">تحميل المنهج العلمي...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center">
                <GlassCard className="p-16 border-dashed border-2">
                    <p className="text-muted-foreground">عذراً، لم نتمكن من العثور على الدورة المطلوبة.</p>
                    <button onClick={() => router.back()} className="mt-6 text-primary font-bold">العودة للرئيسية</button>
                </GlassCard>
            </div>
        );
    }

    const progress = getProgress(course.startDate, course.endDate);
    const isStarted = course.startDate && new Date() > course.startDate.toDate();

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                >
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span className="font-bold text-sm">العودة</span>
                </button>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">برنامج معتمد</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-12">
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/20">
                                    البرنامج التعليمي
                                </div>
                                {isStarted && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-lg">قيد التنفيذ</span>}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{course.title}</h1>
                            <p className="text-lg text-muted-foreground/80 leading-relaxed font-medium">{course.description}</p>
                        </motion.div>

                        {isStarted && (
                            <div className="space-y-4">
                                <GlassCard className="p-8 space-y-4 bg-white/[0.02] border-white/5 shadow-2xl">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                        <span className="text-muted-foreground">إنجاز الدورة الكلي</span>
                                        <span className="text-primary">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 2, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full" 
                                        />
                                    </div>
                                </GlassCard>
                            </div>
                        )}
                    </div>

                    <div className="space-y-12">
                        {course.conditions && course.conditions.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/10">
                                        <Info className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">شروط الالتحاق بالدورة</h2>
                                </div>
                                <div className="grid gap-3">
                                    {course.conditions.map((condition, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                                            <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-black text-orange-600">{i + 1}</span>
                                            </div>
                                            <p className="text-sm font-medium opacity-90">{condition}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/10 backdrop-blur-md">
                                <Layers className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">منهجية المستويات</h2>
                        </div>

                        {levels.length === 0 ? (
                            <GlassCard className="p-16 text-center space-y-6 bg-white/[0.01] border-white/5 border-dashed border-2">
                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto opacity-20">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <p className="text-muted-foreground font-medium">سيتم رفع المنهج الدراسي قريباً، ترقبوا التحديثات.</p>
                            </GlassCard>
                        ) : (
                            <div className="grid gap-4">
                                {levels.map((level, index) => (
                                    <EliteAccordion 
                                        key={level.id} 
                                        index={index + 1} 
                                        title={level.name} 
                                        subtitle={`${formatDate(level.startDate)} - ${formatDate(level.endDate)}`}
                                    >
                                        <div className="p-6 pt-0 space-y-4">
                                            {(!level.resources || level.resources.length === 0) ? (
                                                <div className="p-8 text-center bg-black/10 rounded-2xl border border-white/5">
                                                    <p className="text-xs text-muted-foreground opacity-40 font-bold uppercase tracking-widest">لا توجد موارد تعليمية متاحة لهذا المستوى</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {level.resources.map((res, i) => (
                                                        <ResourceItem key={i} resource={res} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </EliteAccordion>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                                    <Users className="w-5 h-5 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">جلسات التسميع المرتبطة بالدورة</h2>
                            </div>
                            {loadingRecitations ? (
                                <div className="text-xs font-bold opacity-50 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جارٍ تحميل الجلسات...</div>
                            ) : recitationSessions.length === 0 ? (
                                <GlassCard className="p-6 border-dashed border-white/10 text-sm opacity-60">لا توجد جلسات تسميع فعالة مرتبطة بهذه الدورة الآن.</GlassCard>
                            ) : (
                                <div className="grid gap-3">
                                    {recitationSessions.map((session) => (
                                        <GlassCard key={session.id} className="p-4 border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <h4 className="font-black text-sm truncate">{session.title}</h4>
                                                <p className="text-[11px] opacity-60 mt-1 font-bold">{session.creatorName}</p>
                                            </div>
                                            <a href={session.url} target="_blank" rel="noopener noreferrer" className="shrink-0 px-3 py-2 rounded-xl bg-primary text-white text-xs font-black flex items-center gap-2">
                                                <ExternalLink className="w-3 h-3" />
                                                فتح الجلسة
                                            </a>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sticky top-24 space-y-8"
                    >
                        <GlassCard className="p-8 space-y-8 bg-white/[0.02] border-white/5 shadow-3xl">
                            <h1 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground opacity-50 px-1">تفاصيل البرنامج</h1>
                            
                            <div className="space-y-6">
                                <SidebarStat icon={Calendar} label="تاريخ الانطلاق" value={formatDate(course.startDate)} />
                                <SidebarStat icon={Clock} label="المدة الإجمالية" value={getDuration(course.startDate, course.endDate)} color="primary" />
                                <SidebarStat icon={Hourglass} label="نهاية البرنامج" value={formatDate(course.endDate)} />
                                <SidebarStat icon={BookOpen} label="الآلية" value={course.mechanism || "حلقات تفاعلية"} />
                            </div>

                            <div className="h-px bg-white/5" />

                            <div className="space-y-4">
                                <h4 className="font-bold text-sm block px-1">مميزات هذا البرنامج</h4>
                                <div className="grid gap-3">
                                    {course.features.map((f, i) => (
                                        <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 group hover:border-green-500/20 transition-all">
                                            <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                            </div>
                                            <span className="text-xs font-medium opacity-80">{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />
                            
                            <RegistrationSection course={course} />
                        </GlassCard>

                        <GlassCard className="p-6 bg-primary/5 border-primary/10 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Info className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">هل تواجه صعوبة؟</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">تواصل مع المشرف</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function RegistrationSection({ course }: { course: Course }) {
    const { user, userData } = useAuth();
    const [isRegistered, setIsRegistered] = useState(false);
    const [checking, setChecking] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean; type: 'success' | 'danger'; title: string; desc: string }>({ open: false, type: 'success', title: '', desc: '' });

    useEffect(() => {
        if (!user) {
            setChecking(false);
            return;
        }
        const checkRegistration = async () => {
            const regRef = doc(db, "enrollments", course.id, "enrollments", user.uid);
            const regSnap = await getDoc(regRef);
            setIsRegistered(regSnap.exists());
            setChecking(false);
        };
        checkRegistration();
    }, [user, course.id]);

    const handleRegister = async () => {
        if (!user) return;
        setRegistering(true);
        try {
            const batch = writeBatch(db);
            const enrollmentRef = doc(db, "enrollments", course.id, "enrollments", user.uid);
            batch.set(enrollmentRef, {
                enrolledAt: serverTimestamp(),
                studentName: user.displayName || userData?.displayName || "طالب",
                studentEmail: user.email,
                status: "accepted",
            });
            await batch.commit();
            setIsRegistered(true);
            setDialogConfig({ 
                open: true, 
                type: 'success', 
                title: 'تم الانضمام بنجاح', 
                desc: `لقد تم إدراجك كعضو في دورة "${course.title}". يرجى الانضمام لمجموعات الواتساب الرسمية الآن.` 
            });
        } catch (error) {
            console.error("Error registering", error);
            setDialogConfig({ 
                open: true, 
                type: 'danger', 
                title: 'عذراً، حدث خطأ', 
                desc: 'لم نتمكن من إتمام عملية الانضمام حالياً، يرجى المحاولة لاحقاً.' 
            });
        } finally {
            setRegistering(false);
        }
    };

    if (checking) return <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> جاري التحقق...</div>;

    const now = new Date();
    const isRegOpen =
        course.registrationStart &&
        course.registrationEnd &&
        now > course.registrationStart.toDate() &&
        now < course.registrationEnd.toDate();

    const isStudent = userData?.role === 'student' || userData?.role === 'admin' || userData?.role === 'committee';

    if (isRegistered) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
            >
                <GlassCard className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20 relative overflow-hidden shadow-2xl shadow-green-500/5">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 blur-3xl rounded-full" />
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 animate-bounce-slow">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-green-600 dark:text-green-400">مبارك انضمامك!</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">أنت الآن عضو رسمي في هذه الدورة</p>
                            </div>
                        </div>

                        <div className="p-6 bg-white/20 dark:bg-black/20 rounded-[2rem] border border-white/20 backdrop-blur-sm">
                            <p className="text-sm font-medium leading-relaxed italic opacity-80">
                                "نحن سعداء ببدء رحلتك العلمية معنا، نسأل الله لك الهدى والسداد في حفظ سنة نبيه ﷺ."
                            </p>
                        </div>

                        {course.whatsappLink && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-[0.2em]">الخطوة التالية الهامة</p>
                                <a 
                                    href={course.whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-green-600/30 hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center gap-3 text-lg"
                                >
                                    <MessageCircle className="w-6 h-6" />
                                    <span>انضم لمجموعة الواتساب الرسمية</span>
                                </a>
                            </div>
                        )}
                    </div>
                </GlassCard>
                
                <Link href="/students" className="block w-full py-4 text-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    العودة للوحة تحكم الطالب
                </Link>
            </motion.div>
        );
    }

    return (
        <>
            {!isStudent && !checking && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold text-center mb-4 leading-relaxed">
                    يجب اعتماد ملفك الشخصي من قبل اللجنة العلمية أولاً لتتمكن من التسجيل في الدورات.
                </div>
            )}
            <button
                disabled={!isRegOpen || registering || !isStudent}
                onClick={handleRegister}
                className={cn(
                    "w-full px-8 py-5 rounded-2xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-3",
                    isRegOpen && isStudent
                        ? "bg-primary hover:bg-primary/90 hover:scale-[1.05] active:scale-95 shadow-primary/20" 
                        : "bg-gray-400 cursor-not-allowed grayscale"
                )}
            >
                {registering ? <Loader2 className="w-5 h-5 animate-spin"/> : (isRegOpen ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />)}
                {isRegOpen ? (isStudent ? "التسجيل في الدورة" : "في انتظار الاعتماد") : "التسجيل مغلق"}
            </button>
            <EliteDialog 
                isOpen={dialogConfig.open}
                onClose={() => setDialogConfig({...dialogConfig, open: false})}
                onConfirm={() => {
                    setDialogConfig({...dialogConfig, open: false});
                    if (dialogConfig.type === 'success' && course.whatsappLink) {
                        window.open(course.whatsappLink, '_blank');
                    }
                }}
                type={dialogConfig.type}
                title={dialogConfig.title}
                description={dialogConfig.desc}
                confirmText={dialogConfig.type === 'success' && course.whatsappLink ? "الانضمام للواتساب" : "موافق"}
            />
        </>
    );
}

function EliteAccordion({ index, title, subtitle, children }: { index: number; title: string; subtitle: string; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(index === 1);
    return (
        <GlassCard className="p-0 overflow-hidden border-white/5 shadow-xl transition-all hover:border-white/10 group">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/[0.02] transition-all"
            >
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all shadow-inner border",
                        isOpen ? "bg-primary text-white border-primary shadow-primary/20" : "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                        {index.toString().padStart(2, '0')}
                    </div>
                    <div>
                        <h4 className={cn("text-lg font-black tracking-tight transition-colors", isOpen ? "text-primary" : "text-foreground opacity-90")}>{title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground opacity-50 mt-1">{subtitle}</p>
                    </div>
                </div>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 transition-transform duration-500", isOpen ? "rotate-180 bg-primary/10 border-primary/20" : "")}>
                    <ChevronDown className={cn("w-5 h-5", isOpen ? "text-primary" : "text-muted-foreground")} />
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    );
}

function ResourceItem({ resource }: { resource: Resource }) {
    const getResourceMeta = (type: string) => {
        switch (type) {
            case 'pdf': return { icon: FileText, color: "text-red-500", bg: "bg-red-500/10", label: "مستند PDF" };
            case 'video': return { icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-500/10", label: "مقطع فيديو" };
            case 'audio': return { icon: Music, color: "text-orange-500", bg: "bg-orange-500/10", label: "ملف صوتي" };
            default: return { icon: LinkIcon, color: "text-primary", bg: "bg-primary/10", label: "رابط خارجي" };
        }
    };
    const meta = getResourceMeta(resource.type);
    return (
        <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-primary/20 transition-all group"
        >
            <div className="flex items-center gap-5">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", meta.bg, meta.color)}>
                    <meta.icon className="w-6 h-6" />
                </div>
                <div>
                    <h5 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{resource.title}</h5>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mt-1">{meta.label}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110">
                    <DownloadCloud className="w-4 h-4 text-primary" />
                 </div>
                 <ExternalLink className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
        </a>
    );
}

function SidebarStat({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color?: 'primary' }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Icon className={cn("w-5 h-5", color === 'primary' ? 'text-primary' : 'text-muted-foreground opacity-50')} />
            </div>
            <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 m-0 leading-none mb-1.5">{label}</p>
                <p className="text-sm font-black leading-tight">{value}</p>
            </div>
        </div>
    );
}
