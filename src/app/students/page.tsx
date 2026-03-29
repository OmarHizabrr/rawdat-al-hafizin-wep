"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    onSnapshot,
    Timestamp,
    doc,
    setDoc,
    serverTimestamp,
    addDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    orderBy,
    limit,
    writeBatch
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    BookOpen,
    Settings,
    User as UserIcon,
    Printer,
    Download,
    Timer,
    CreditCard,
    CheckCircle,
    MessageSquarePlus,
    Quote,
    Heart,
    Mail,
    MessageCircle,
    Globe,
    Loader2,
    ChevronDown,
    Info,
    X,
    Layout,
    Sparkles,
    Calendar,
    ArrowRight,
    ExternalLink,
    Clock,
    Star,
    Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { cn } from "@/lib/utils";

// Types
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
}

interface Testimonial {
    id: string;
    studentId: string;
    studentName: string;
    studentPhoto?: string;
    content: string;
    createdAt: Timestamp;
    likes?: string[]; // Array of uids
    isVisible?: boolean;
}

export default function StudentPortal() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeftToRegister, setTimeLeftToRegister] = useState<{ d: string, h: string, m: string }>({ d: "00", h: "00", m: "00" });
    const [timeLeftToStart, setTimeLeftToStart] = useState<{ d: string, h: string, m: string }>({ d: "00", h: "00", m: "00" });
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    
    // Add Testimonial State
    const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
    const [newTestimonialContent, setNewTestimonialContent] = useState("");
    const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'warning' | 'info';
        title: string;
        description: string;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        description: ''
    });

    // Fetch Courses
    useEffect(() => {
        const q = query(collection(db, "courses"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coursesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Course[];

            // Filter and sort active courses
            const now = new Date();
            const active = coursesData
                .filter((c) => !c.endDate || c.endDate.toDate() > now)
                .sort((a, b) => {
                    const dateA = a.startDate?.toDate().getTime() ?? 0;
                    const dateB = b.startDate?.toDate().getTime() ?? 0;
                    return dateA - dateB;
                });

            setCourses(coursesData);
            setActiveCourse(active.length > 0 ? active[0] : null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Timer Logic
    useEffect(() => {
        if (!activeCourse) return;

        const interval = setInterval(() => {
            const now = new Date();

            if (activeCourse.registrationEnd) {
                const diff = activeCourse.registrationEnd.toDate().getTime() - now.getTime();
                const d = Math.max(0, diff);
                setTimeLeftToRegister(parseDuration(d));
            }

            if (activeCourse.startDate) {
                const diff = activeCourse.startDate.toDate().getTime() - now.getTime();
                const d = Math.max(0, diff);
                setTimeLeftToStart(parseDuration(d));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeCourse]);

    // Fetch Testimonials
    useEffect(() => {
        const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Testimonial[];
            // Filter only visible ones for students
            setTestimonials(data.filter(t => t.isVisible !== false));
        });
        return () => unsubscribe();
    }, []);

    const parseDuration = (ms: number) => {
        const minutes = Math.floor((ms / 1000 / 60) % 60);
        const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
        const days = Math.floor(ms / 1000 / 60 / 60 / 24);

        return {
            d: days.toString().padStart(2, "0"),
            h: hours.toString().padStart(2, "0"),
            m: minutes.toString().padStart(2, "0")
        };
    };

    const showDialog = (type: 'success' | 'danger' | 'warning' | 'info', title: string, description: string) => {
        setDialogConfig({ isOpen: true, type, title, description });
    };

    const handleSubmitTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTestimonialContent.trim()) return;

        setIsSubmittingTestimonial(true);
        try {
            await addDoc(collection(db, "testimonials"), {
                studentId: user.uid,
                studentName: user.displayName || "طالب",
                studentPhoto: user.photoURL || "",
                content: newTestimonialContent,
                createdAt: serverTimestamp(),
                likes: [],
                isVisible: true
            });
            setNewTestimonialContent("");
            setIsTestimonialModalOpen(false);
            showDialog('success', 'شكراً لك', 'تم إرسال مشاركتك بنجاح. سنقوم بمراجعتها ونشرها قريباً.');
        } catch (error) {
            console.error("Error adding testimonial", error);
            showDialog('danger', 'فشل الإرسال', 'حدث خطأ أثناء محاولة إرسال مشاركتك. يرجى المحاولة لاحقاً.');
        } finally {
            setIsSubmittingTestimonial(false);
        }
    };

    const handleToggleLike = async (testimonialId: string, currentLikes: string[] = []) => {
        if (!user) {
            showDialog('info', 'تسجيل الدخول', 'يرجى تسجيل الدخول للتفاعل مع مشاركات زملائك.');
            return;
        }

        const isLiked = currentLikes.includes(user.uid);
        const ref = doc(db, "testimonials", testimonialId);

        try {
            await updateDoc(ref, {
                likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
        } catch (error) {
            console.error("Error toggling like", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="space-y-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto opacity-20" />
                    <p className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">جاري تجهيز روضتك...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 px-4 max-w-5xl mx-auto">
            {/* Header / Brand Nav */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-white/5 border border-white/5 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-primary fill-current" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            روضة الحافظين
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-tighter uppercase">Student Hub</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Link href="/students/profile" className="p-3 hover:bg-white/10 rounded-2xl transition-all hover:scale-110 active:scale-95 group">
                        <UserIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                    <Link href="/settings" className="p-3 hover:bg-white/10 rounded-2xl transition-all hover:scale-110 active:scale-95 group">
                        <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                </div>
            </motion.div>

            {/* Hero / Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group h-64 rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-primary/20"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-700 to-indigo-900" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl"
                    >
                        <Award className="w-10 h-10 text-white" />
                    </motion.div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white drop-shadow-xl">أهلاً بك يا حافظ القرآن</h2>
                        <p className="text-white/80 font-medium tracking-wide">"خيركم من تعلم القران وعلمه"</p>
                    </div>
                </div>

                {/* Decorative floating elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            </motion.div>

            {/* Countdown Widgets Section */}
            {activeCourse && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CountdownWidget 
                        label="التسجيل ينتهي في" 
                        timer={timeLeftToRegister} 
                        color="orange" 
                        icon={Clock} 
                    />
                    <CountdownWidget 
                        label="انطلاق الدورة خلال" 
                        timer={timeLeftToStart} 
                        color="green" 
                        icon={Calendar} 
                    />
                </div>
            )}

            {/* Active Task / Dashboard Card */}
            {activeCourse ? (
                <div className="grid gap-8">
                    <GlassCard className="p-0 overflow-hidden border-white/10 hover:border-primary/30 transition-all shadow-2xl">
                        <div className="p-8 space-y-8 bg-white/[0.02]">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/10 shadow-inner">
                                        <BookOpen className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <h3 className="text-2xl font-bold tracking-tight">{activeCourse.title}</h3>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            دورة حفظ مكثفة متاحة حالياً
                                        </p>
                                    </div>
                                </div>
                                
                                <RegistrationSection course={activeCourse} />
                            </div>

                            {/* Info Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                                <InfoBadge 
                                    icon={Timer} 
                                    label="الآلية" 
                                    value={activeCourse.mechanism} 
                                    color="blue" 
                                />
                                <InfoBadge 
                                    icon={CreditCard} 
                                    label="التكلفة" 
                                    value={activeCourse.cost} 
                                    color="green" 
                                />
                                <InfoBadge 
                                    icon={Users} 
                                    label="الفئة" 
                                    value="طلاب العلم" 
                                    color="purple" 
                                />
                            </div>

                            <div className="pt-6">
                                <Link href={`/students/courses/${activeCourse.id}`} className="block">
                                    <button className="w-full py-5 bg-primary/5 border border-primary/20 text-primary font-bold rounded-2xl hover:bg-primary hover:text-white transition-all hover:scale-[1.02] active:scale-95 group flex items-center justify-center gap-3">
                                        استكشاف المنهج والموارد
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-[-5px] transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Progress mockup for visual depth */}
                        <div className="bg-primary/5 p-4 border-t border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">خطة الحماية والتقدم</span>
                                <span className="text-xs font-bold text-primary">0%</span>
                            </div>
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: "0%" }}
                                    className="h-full bg-primary" 
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Features Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Layout className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-bold">ما الذي ستحصل عليه؟</h3>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {activeCourse.features.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <GlassCard className="p-4 flex items-center gap-4 bg-white/5 border-white/5 group hover:border-primary/20 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <span className="text-sm font-medium">{feature}</span>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <GlassCard className="p-20 text-center space-y-6 bg-white/5 border-dashed border-2 border-white/10 rounded-[3rem]">
                    <div className="w-20 h-20 bg-gray-500/10 rounded-3xl flex items-center justify-center mx-auto">
                        <BookOpen className="w-10 h-10 text-muted-foreground opacity-30" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold">لا يوجد دورات متاحة حالياً</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">ترقبنا قريباً! نحن نعدّ حالياً لبرامج تعليمية جديدة تليق بطموحاتك.</p>
                    </div>
                </GlassCard>
            )}

            {/* Testimonials / Emotions */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-6 h-6 text-pink-500" />
                        <h3 className="text-xl font-bold">مشاعر إيمانية</h3>
                    </div>
                    <button 
                        onClick={() => setIsTestimonialModalOpen(true)}
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-all"
                    >
                        <MessageSquarePlus className="w-5 h-5" />
                        شاركنا شعورك
                    </button>
                </div>

                <div className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar">
                    {testimonials.map((t, idx) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="min-w-[320px] snap-center"
                        >
                            <GlassCard className="h-full p-6 flex flex-col justify-between border-white/10 hover:border-pink-500/30 transition-all shadow-xl bg-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border-2 border-primary/20 shadow-lg flex-shrink-0">
                                            {t.studentPhoto ? (
                                                <img src={t.studentPhoto} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {t.studentName[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm tracking-tight">{t.studentName}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">طالب مثابر</p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <Quote className="absolute -top-4 -right-4 w-12 h-12 text-primary/5 -z-0" />
                                        <p className="text-sm font-medium leading-relaxed italic relative z-10 opacity-90">
                                            "{t.content}"
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 flex items-center justify-between border-t border-white/5 mt-auto">
                                    <button 
                                        onClick={() => handleToggleLike(t.id, t.likes)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-bold",
                                            user && t.likes?.includes(user.uid) 
                                                ? "bg-red-500/10 text-red-500 scale-110" 
                                                : "bg-white/5 text-muted-foreground hover:bg-red-500/5 hover:text-red-500"
                                        )}
                                    >
                                        <Heart className={cn("w-4 h-4", user && t.likes?.includes(user.uid) ? "fill-current" : "")} />
                                        <span>{t.likes?.length || 0}</span>
                                    </button>
                                    <span className="text-[10px] text-muted-foreground opacity-50">{t.createdAt?.toDate().toLocaleDateString('ar-EG')}</span>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                    {testimonials.length === 0 && (
                        <div className="w-full text-center py-12 bg-white/5 rounded-3xl border border-dashed text-muted-foreground">
                            مساحة فارغة تنتظر كلماتك الطيبة...
                        </div>
                    )}
                </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-xl font-bold">استفسارات شائعة</h3>
                </div>
                <div className="grid gap-4">
                    <FAQItem 
                        q="كيف يمكنني التسجيل كطالب رسمي؟" 
                        a="يمكنك الانضمام عبر صفحة التسجيل، وبعد الدخول استخدم رمز الوصول (Access Code) الذي حصلت عليه من الإدارة لإتمام العملية." 
                    />
                    <FAQItem 
                        q="هل أحصل على شهادة بعد الحتم؟" 
                        a="نعم بالتاكيد، النظام يصدر شهادات إلكترونية للمجتازين للاختبارات النهائية ومعتمدة من اللجنة العلمية." 
                    />
                    <FAQItem 
                        q="ما هي وسيلة التواصل مع المعلم؟" 
                        a="يوجد داخل كل حلقة نظام محادثة مباشر وجدول مواعيد لعمليات التسميع والتقييم." 
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="pt-20 border-t border-white/5">
                <div className="flex flex-col items-center gap-8">
                    <div className="flex justify-center gap-4">
                        <SocialBtn icon={Mail} color="blue" href="mailto:contact@rawdat.com" />
                        <SocialBtn icon={MessageCircle} color="green" href="https://wa.me/..." />
                        <SocialBtn icon={Globe} color="purple" href="https://rawdat.com" />
                    </div>
                    <p className="text-xs text-muted-foreground font-bold tracking-widest text-center opacity-40">
                        جميع الحقوق محفوظة منصة روضة الحافظين ٢٠٢٦
                    </p>
                </div>
            </div>

            {/* Elite Modals */}
            <AnimatePresence>
                {isTestimonialModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTestimonialModalOpen(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-primary/5">
                                <h2 className="text-xl font-bold flex items-center gap-3">
                                    <MessageSquarePlus className="w-6 h-6 text-primary" />
                                    مشاركة شعورك
                                </h2>
                                <button 
                                    onClick={() => setIsTestimonialModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmitTestimonial} className="p-8 space-y-6">
                                <p className="text-xs text-muted-foreground">اكتب كلماتك بصدق، فمشاعرك قد تلهم غيرك من الحفاظ.</p>
                                <textarea
                                    required
                                    autoFocus
                                    value={newTestimonialContent}
                                    onChange={e => setNewTestimonialContent(e.target.value)}
                                    className="w-full h-40 p-4 rounded-2xl border bg-white/5 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none shadow-inner"
                                    placeholder="اكتب شيئاً مؤثراً هنا..."
                                />
                                <button
                                    disabled={isSubmittingTestimonial}
                                    type="submit"
                                    className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:grayscale"
                                >
                                    {isSubmittingTestimonial ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    نشر المشاركة الآن
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EliteDialog 
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({...dialogConfig, isOpen: false})}
                onConfirm={() => setDialogConfig({...dialogConfig, isOpen: false})}
                type={dialogConfig.type as any}
                title={dialogConfig.title}
                description={dialogConfig.description}
                confirmText="حسناً"
            />
        </div>
    );
}

// Sub-components for cleaner code
function CountdownWidget({ label, timer, color, icon: Icon }: any) {
    const colorClasses: any = {
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        green: "text-green-500 bg-green-500/10 border-green-500/20"
    };

    return (
        <GlassCard className={cn("p-6 flex flex-col items-center justify-center text-center space-y-4 border-2 transition-all hover:scale-105", colorClasses[color])}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-center gap-4">
                <TimeUnit value={timer.d} label="يوم" />
                <span className="text-2xl font-light opacity-30">:</span>
                <TimeUnit value={timer.h} label="ساعة" />
                <span className="text-2xl font-light opacity-30">:</span>
                <TimeUnit value={timer.m} label="دقيقة" />
            </div>
        </GlassCard>
    );
}

function TimeUnit({ value, label }: { value: string, label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-3xl font-black tracking-tighter">{value}</span>
            <span className="text-[8px] font-bold opacity-60 uppercase">{label}</span>
        </div>
    );
}

function InfoBadge({ icon: Icon, label, value, color }: any) {
    const colors: any = {
        blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
        green: "text-green-500 bg-green-500/5 border-green-500/10",
        purple: "text-purple-500 bg-purple-500/5 border-purple-500/10"
    };
    return (
        <div className={cn("p-3 rounded-2xl border flex flex-col items-center text-center gap-1", colors[color])}>
            <Icon className="w-4 h-4 opacity-50" />
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{label}</span>
            <span className="text-xs font-bold truncate w-full">{value}</span>
        </div>
    );
}

function FAQItem({ q, a }: { q: string, a: string }) {
    return (
        <GlassCard className="p-0 overflow-hidden border-white/5 hover:border-white/10 transition-all group">
            <details className="group/details">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <span className="font-bold tracking-tight text-sm group-hover/details:text-primary transition-colors">{q}</span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-open/details:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground/80 leading-relaxed animate-in slide-in-from-top-2">
                    {a}
                </div>
            </details>
        </GlassCard>
    );
}

function SocialBtn({ icon: Icon, color, href }: any) {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white",
        green: "bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white",
        purple: "bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white"
    };
    return (
        <a href={href} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-lg", colors[color])}>
            <Icon className="w-6 h-6" />
        </a>
    );
}

function RegistrationSection({ course }: { course: Course }) {
    const [isRegistered, setIsRegistered] = useState(false);
    const [checking, setChecking] = useState(true);
    const [registering, setRegistering] = useState(false);
    const { user, userData } = useAuth();
    const [dialogConfig, setDialogConfig] = useState({ open: false, type: 'success', title: '', desc: '' });

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(
            doc(db, "enrollments", course.id, "enrollments", user.uid),
            (doc) => {
                setIsRegistered(doc.exists());
                setChecking(false);
            }
        );
        return () => unsub();
    }, [user, course.id]);

    const handleRegister = async () => {
        if (!user) return;
        setRegistering(true);
        try {
            const batch = writeBatch(db);

            // 1. Enrollment Track (Pedagogical record)
            const enrollmentRef = doc(db, "enrollments", course.id, "enrollments", user.uid);
            batch.set(enrollmentRef, {
                enrolledAt: serverTimestamp(),
                studentName: user.displayName || userData?.displayName || "طالب غير معروف",
                studentEmail: user.email,
                status: "accepted", // Automatically accepted as requested
            });

            // 2. Global Members Track (Alignment with GroupMembersManager)
            const memberRef = doc(db, "members", course.id, "members", user.uid);
            batch.set(memberRef, {
                displayName: user.displayName || userData?.displayName || "طالب",
                email: user.email,
                photoURL: user.photoURL || "",
                role: "student",
                addedAt: serverTimestamp(),
            });

            await batch.commit();

            setDialogConfig({ 
                open: true, 
                type: 'success', 
                title: 'تم الانضمام بنجاح', 
                desc: `لقد تم إدراجك كعضو في دورة "${course.title}". يمكنك البدء الآن!` 
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

    if (isRegistered) {
        return (
            <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold shadow-xl">
                <CheckCircle className="w-5 h-5" />
                <span>أنت مسجل بالفعل</span>
            </div>
        );
    }

    return (
        <>
            <button
                disabled={!isRegOpen || registering}
                onClick={handleRegister}
                className={cn(
                    "px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-xl flex items-center gap-3",
                    isRegOpen 
                        ? "bg-primary hover:bg-primary/90 hover:scale-[1.05] active:scale-95 shadow-primary/20" 
                        : "bg-gray-400 cursor-not-allowed grayscale"
                )}
            >
                {registering ? <Loader2 className="w-5 h-5 animate-spin"/> : (isRegOpen ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />)}
                {isRegOpen ? "سجل اهتمامك الآن" : "التسجيل مغلق"}
            </button>
            
            <EliteDialog 
                isOpen={dialogConfig.open}
                onClose={() => setDialogConfig({...dialogConfig, open: false})}
                onConfirm={() => setDialogConfig({...dialogConfig, open: false})}
                type={dialogConfig.type as any}
                title={dialogConfig.title}
                description={dialogConfig.desc}
                confirmText="موافق"
            />
        </>
    );
}

const Lock = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

const Users = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const HelpCircle = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
    </svg>
);
