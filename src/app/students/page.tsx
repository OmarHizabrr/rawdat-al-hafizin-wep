"use client";

import React, { useState, useEffect } from "react";
import { 
    collection, query, onSnapshot, doc, setDoc, 
    serverTimestamp, updateDoc, increment, arrayUnion, 
    getDocs, where, writeBatch, getDoc, orderBy, limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Award, Star, Heart, MessageCircle, Clock, 
    Calendar, CheckCircle, Timer, Sparkles, 
    User as UserIcon, Settings, Target, 
    MessageSquarePlus, ChevronDown, 
    ArrowRight, Info, CreditCard, Users, 
    Download, ScrollText, Loader2, X,
    Layout, Quote, HelpCircle, Mail, Globe,
    Lock as LockIcon, Hash, BookOpen, TrendingUp
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Types ---
interface Course {
    id: string;
    title: string;
    description: string;
    registrationStart: any;
    registrationEnd: any;
    startDate: any;
    endDate: any;
    mechanism: string;
    cost: string;
    features: string[];
    whatsappLink?: string;
}

interface Testimonial {
    id: string;
    studentName: string;
    studentPhoto?: string;
    content: string;
    likes: string[];
    createdAt: any;
}

import { PlanDay, TierTask } from "@/types/plan";

const getLevelInfo = (pts: number) => {
    if (pts < 100) return { label: 'بداية النور', rank: 1 };
    if (pts < 500) return { label: 'طالب بصيرة', rank: 2 };
    if (pts < 1500) return { label: 'همّة علية', rank: 3 };
    return { label: 'صاحب إتقان', rank: 4 };
};

const getLevelProgress = (pts: number) => {
    const caps = [100, 500, 1500, 5000];
    const cap = caps.find(c => pts < c) || 5000;
    return { percent: Math.min((pts / cap) * 100, 100), next: cap - pts };
};

// --- Main Component ---
export default function StudentPortal() {
    const { user } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeftToRegister, setTimeLeftToRegister] = useState({ d: "00", h: "00", m: "00" });
    const [timeLeftToStart, setTimeLeftToStart] = useState({ d: "00", h: "00", m: "00" });
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    
    const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
    const [newTestimonialContent, setNewTestimonialContent] = useState("");
    const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

    const [dailyLog, setDailyLog] = useState<{ userId: string, courseId: string, date: string, pages: number, completedTasks: string[], completed: boolean } | null>(null);
    const [lastWeekLogs, setLastWeekLogs] = useState<any[]>([]);
    const [todayPlan, setTodayPlan] = useState<PlanDay | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [lastRank, setLastRank] = useState<number | null>(null);
    const [streak, setStreak] = useState(0);
    const [isLoggingDaily, setIsLoggingDaily] = useState(false);
    const [completedEnrollments, setCompletedEnrollments] = useState<any[]>([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [fetchingEnrolled, setFetchingEnrolled] = useState(true);
    const [showCelebrate, setShowCelebrate] = useState(false);

    const [progressPercent, setProgressPercent] = useState(0);
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [totalDays, setTotalDays] = useState(0);

    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        type: 'success' as 'success'|'danger'|'warning'|'info',
        title: '',
        description: ''
    });

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch Courses
    useEffect(() => {
        const q = query(collection(db, "courses"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coursesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Course[];
            setCourses(coursesData);

            const active = coursesData.find(c => {
                if (!c.endDate) return false;
                return c.endDate.toDate() > new Date();
            });
            setActiveCourse(active || null);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Testimonials
    useEffect(() => {
        const q = query(collection(db, "testimonials"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Testimonial[]);
        });
        return () => unsubscribe();
    }, []);

    // Timers Effect
    useEffect(() => {
        if (!activeCourse) return;
        const timer = setInterval(() => {
            const now = new Date().getTime();
            
            // Reg Timer
            if (activeCourse.registrationEnd) {
                const diff = activeCourse.registrationEnd.toDate().getTime() - now;
                if (diff > 0) {
                    setTimeLeftToRegister({
                        d: Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'),
                        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'),
                        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
                    });
                }
            }

            // Start Timer
            if (activeCourse.startDate) {
                const diff = activeCourse.startDate.toDate().getTime() - now;
                if (diff > 0) {
                    setTimeLeftToStart({
                        d: Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'),
                        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'),
                        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
                    });
                }
            }

            // Progress Stats
            if (activeCourse.startDate && activeCourse.endDate) {
                const total = activeCourse.endDate.toDate().getTime() - activeCourse.startDate.toDate().getTime();
                const elapsed = now - activeCourse.startDate.toDate().getTime();
                const remaining = activeCourse.endDate.toDate().getTime() - now;
                
                setTotalDays(Math.ceil(total / (1000 * 60 * 60 * 24)));
                setDaysRemaining(Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24))));
                setProgressPercent(Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [activeCourse]);

    // Daily Logic Effect
    useEffect(() => {
        if (!user || !activeCourse) return;

        const fetchData = async () => {
            try {
                // Fetch Daily Log for today
                const logId = `${user.uid}_${todayStr}`;
                const logSnap = await getDoc(doc(db, "daily_logs", logId));
                if (logSnap.exists()) {
                    setDailyLog(logSnap.data() as any);
                }

                // Fetch Last 7 Days Logs
                const qLastWeek = query(
                    collection(db, "daily_logs"),
                    where("userId", "==", user.uid),
                    where("courseId", "==", activeCourse.id),
                    orderBy("date", "desc"),
                    limit(7)
                );
                const weekSnap = await getDocs(qLastWeek);
                setLastWeekLogs(weekSnap.docs.map(d => d.data()));

                // Fetch User Data for points/streak
                const uSnap = await getDoc(doc(db, "users", user.uid));
                if (uSnap.exists()) setUserData(uSnap.data());
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };
        fetchData();

        // 2. Fetch Today's Multi-Tier Plan
        const planRef = collection(db, "coursePlans", activeCourse.id, "coursePlans");
        const fetchPlan = async () => {
            if (!activeCourse.startDate) return;
            const start = activeCourse.startDate.toDate();
            const today = new Date();
            const dayNum = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            if (dayNum > 0) {
                const q = query(planRef, where("dayIndex", "==", dayNum));
                const snap = await getDocs(q);
                if (!snap.empty) setTodayPlan(snap.docs[0].data() as PlanDay);
                else setTodayPlan(null);
            }
        };
        fetchPlan();

        // 3. Fetch Enrollment
        const enrollRef = doc(db, "enrollments", activeCourse.id, "enrollments", user.uid);
        const unsubEnroll = onSnapshot(enrollRef, (snap) => {
            setIsEnrolled(snap.exists());
            setFetchingEnrolled(false);
        });

        return () => { unsubEnroll(); };
    }, [user, activeCourse, todayStr]);

    // Level Up Celebration Effect
    useEffect(() => {
        if (!userData) return;
        const currentRank = getLevelInfo(userData.totalPoints || 0).rank;
        if (lastRank !== null && currentRank > lastRank) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 5000);
        }
        setLastRank(currentRank);
    }, [userData?.totalPoints]);

    // Achievements Effect
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "enrollments_history"), where("studentId", "==", user.uid), where("status", "==", "completed"));
        const fetch = async () => {
            const snap = await getDocs(q);
            setCompletedEnrollments(snap.docs.map(d => d.data()));
        };
        fetch();
    }, [user]);

    const handleToggleTask = async (tierId: string) => {
        if (!user || !activeCourse) return;
        
        setIsLoggingDaily(true);
        try {
            const batch = writeBatch(db);
            const logRef = doc(db, "daily_logs", `${user.uid}_${todayStr}`);
            
            const currentTasks = dailyLog?.completedTasks || [];
            const isCompleted = currentTasks.includes(tierId);
            const newTasks = isCompleted 
                ? currentTasks.filter(id => id !== tierId)
                : [...currentTasks, tierId];

            const allTasksFinished = todayPlan?.tasks?.every(t => newTasks.includes(t.tierId)) || false;

            batch.set(logRef, {
                userId: user.uid,
                courseId: activeCourse.id,
                date: todayStr,
                completedTasks: newTasks,
                completed: allTasksFinished,
                updatedAt: serverTimestamp(),
                createdAt: dailyLog ? undefined : serverTimestamp()
            }, { merge: true });

            const userRef = doc(db, "users", user.uid);
            if (!isCompleted) {
                // Streak Logic
                let newStreak = userData?.streak || 0;
                const lastDate = userData?.lastActiveDate || "";
                
                const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                const yStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yStr) {
                    newStreak += 1;
                } else if (lastDate !== todayStr) {
                    newStreak = 1;
                }

                batch.update(userRef, {
                    totalPoints: increment(5),
                    streak: newStreak,
                    lastActiveDate: todayStr,
                    lastActive: serverTimestamp()
                });

                // Update local status for immediate UI feedback
                setUserData((prev: any) => prev ? ({ ...prev, streak: newStreak, totalPoints: (prev.totalPoints || 0) + 5 }) : prev);
            }

            await batch.commit();
            if (!isCompleted) {
                setShowCelebrate(true);
                setTimeout(() => setShowCelebrate(false), 3000);
            }
        } catch (error) {
            console.error("Error", error);
            setDialogConfig({ isOpen: true, type: 'danger', title: 'خطأ', description: 'لم نتمكن من حفظ إنجازك حالياً.' });
        } finally {
            setIsLoggingDaily(false);
        }
    };

    const handleToggleLike = async (tid: string, likes: string[]) => {
        if (!user) return;
        const ref = doc(db, "testimonials", tid);
        if (likes.includes(user.uid)) {
            await updateDoc(ref, { likes: likes.filter(id => id !== user.uid) });
        } else {
            await updateDoc(ref, { likes: arrayUnion(user.uid) });
        }
    };

    const handleSubmitTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTestimonialContent.trim()) return;
        setIsSubmittingTestimonial(true);
        try {
            await setDoc(doc(collection(db, "testimonials")), {
                studentName: user.displayName || userData?.displayName || "طالب",
                studentPhoto: user.photoURL || "",
                content: newTestimonialContent,
                likes: [],
                createdAt: serverTimestamp()
            });
            setNewTestimonialContent("");
            setIsTestimonialModalOpen(false);
            setDialogConfig({ isOpen: true, type: 'success', title: 'تم النشر', description: 'شكراً لمشاركة مشاعرك الصادقة!' });
        } catch (error) {
            setDialogConfig({ isOpen: true, type: 'danger', title: 'خطأ', description: 'فشل نشر المشاركة.' });
        } finally {
            setIsSubmittingTestimonial(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
        </div>
    );

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
                        <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">روضة الحافظين</h1>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-tighter uppercase">Student Hub</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push('/profile')} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><UserIcon className="w-5 h-5 text-muted-foreground hover:text-primary" /></button>
                    <button onClick={() => router.push('/settings')} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><Settings className="w-5 h-5 text-muted-foreground hover:text-primary" /></button>
                </div>
            </motion.div>

            {/* Hero / Welcome */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-64 rounded-[3.5rem] overflow-hidden shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-700 to-indigo-900" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20">
                        <Award className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                            أهلاً بك يا حافظ السنة
                        </h2>
                        <p className="text-white/80 font-medium tracking-wide">"نضر الله امرأ سمع مقالتي فوعاها فأداها كما سمعها"</p>
                    </div>
                </div>
            </motion.div>

            {/* Progress Bar (Journey) */}
            {activeCourse && (
                <section className="relative group">
                    <GlassCard className="p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-white/5" />
                                    <motion.circle 
                                        cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={2 * Math.PI * 58}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                                        animate={{ strokeDashoffset: (2 * Math.PI * 58) * (1 - progressPercent / 100) }}
                                        transition={{ duration: 1.5 }}
                                        className="text-primary" 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black">{progressPercent}%</span>
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">الإنجاز</span>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-right space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black">{activeCourse.title}</h2>
                                    <p className="text-sm font-medium text-muted-foreground italic">"{activeCourse.description.substring(0, 80)}..."</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-[10px] text-muted-foreground font-bold">المتبقي</p>
                                        <p className="font-black">{daysRemaining} يوم</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-[10px] text-muted-foreground font-bold">المدة</p>
                                        <p className="font-black">{totalDays} يوم</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-primary text-white text-center">
                                        <p className="text-[10px] font-bold">الجهد</p>
                                        <p className="font-black">{streak} يوم</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {activeCourse && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CountdownWidget label="باقي على التسجيل" timer={timeLeftToRegister} color="orange" icon={Clock} />
                            <CountdownWidget label="باقي على البداية" timer={timeLeftToStart} color="green" icon={Calendar} />
                        </div>
                    )}

                    {/* Elite Motivation Header (Points, Level, Streak) */}
                    {isEnrolled && userData && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-8">
                             <GlassCard className="p-0 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden shadow-2xl">
                                <div className="grid md:grid-cols-3 gap-6 p-8">
                                    {/* Level & Points */}
                                    <div className="space-y-4 text-right">
                                        <div className="flex items-center justify-end gap-3 text-primary">
                                            <Award className="w-8 h-8 drop-shadow-lg" />
                                            <h2 className="text-3xl font-black">{getLevelInfo(userData.totalPoints || 0).label}</h2>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                                <span>{getLevelProgress(userData.totalPoints || 0).next} نقطة للمستوى التالي</span>
                                                <span>النور المتراكم</span>
                                            </div>
                                            <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${getLevelProgress(userData.totalPoints || 0).percent}%` }} className="h-full bg-primary rounded-full shadow-lg shadow-primary/30" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Weekly Achievement Sparkline */}
                                    <div className="flex items-end justify-center gap-2 h-20 group relative">
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            const d = new Date(); d.setDate(d.getDate() - (6 - i));
                                            const dStr = d.toISOString().split('T')[0];
                                            const log = lastWeekLogs.find(l => l.date === dStr);
                                            const h = log ? (log.completed ? '100%' : '40%') : '10%';
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                    <motion.div 
                                                        initial={{ height: 0 }} animate={{ height: h }} 
                                                        className={cn(
                                                            "w-full rounded-md shadow-sm transition-all duration-500",
                                                            log?.completed ? "bg-primary" : log ? "bg-amber-500/40" : "bg-white/5"
                                                        )} 
                                                    />
                                                    <span className="text-[8px] font-black opacity-30">{dStr.slice(-2)}</span>
                                                </div>
                                            );
                                        })}
                                        <div className="absolute -top-6 text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">إنجازك خلال الأسبوع</div>
                                    </div>

                                    {/* Streak Badge */}
                                    <div className="flex flex-col items-center md:items-end justify-center">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                            <div className="relative bg-black/40 border border-white/10 p-5 rounded-[2rem] flex items-center gap-4 transition-transform hover:scale-105 active:scale-95 shadow-xl">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none mb-1">همّة متصلة</p>
                                                    <p className="text-3xl font-black text-white">{userData.streak || 0} يوم</p>
                                                </div>
                                                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/40">
                                                    <TrendingUp className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </GlassCard>
                        </motion.div>
                    )}

                    {/* Level Up Celebration Modal */}
                    <AnimatePresence>
                        {showLevelUp && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 1.2 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                            >
                                <GlassCard className="p-10 border-amber-500/50 bg-amber-500/10 backdrop-blur-2xl text-center space-y-6 shadow-[0_0_100px_rgba(245,158,11,0.3)]">
                                    <motion.div animate={{ rotate: [0, 10, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                                        <Award className="w-24 h-24 text-amber-500 mx-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                    </motion.div>
                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black text-white">مبارك الارتقاء!</h2>
                                        <p className="text-xl font-bold text-amber-500">لقد وصلت لمرتبة: {getLevelInfo(userData.totalPoints || 0).label}</p>
                                    </div>
                                    <div className="text-sm font-medium opacity-60">واصل همّتك لنيل الدرجات العلا</div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Card (Multi-Tier) */}
                    {activeCourse && !fetchingEnrolled && (
                        <div className="relative">
                            {!isEnrolled ? (
                                <GlassCard className="p-10 border-primary/30 bg-primary/5 text-center space-y-6">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                                        <LockIcon className="w-10 h-10 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black">أنت غير مسجل بعد</h3>
                                        <p className="text-muted-foreground">قم بالتسجيل لتبدأ رحلتك الإيمانية فوراً.</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <RegistrationSection course={activeCourse} />
                                    </div>
                                </GlassCard>
                            ) : (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                    <GlassCard className={cn(
                                        "p-8 overflow-hidden group relative transition-all duration-500",
                                        dailyLog?.completed ? "border-green-500/30 bg-green-500/5 shadow-green-500/10" : "border-amber-500/20 bg-amber-500/5 shadow-amber-500/5"
                                    )}>
                                        {showCelebrate && <CelebrateOverlay />}
                                        
                                        {/* Status Sign (علامة) */}
                                        {!dailyLog?.completedTasks?.length && (
                                            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full animate-pulse border border-amber-500/30">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                                                <span className="text-[8px] font-black uppercase text-amber-600">بانتظار الإنجاز</span>
                                            </div>
                                        )}

                                        <div className="space-y-8 relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500",
                                                    dailyLog?.completed ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-primary/10 border-primary/20 text-primary"
                                                )}>
                                                    {dailyLog?.completed ? <CheckCircle className="w-8 h-8" /> : <Timer className="w-8 h-8 animate-pulse" />}
                                                </div>
                                                <div className="text-right">
                                                    <h3 className={cn("text-2xl font-black", dailyLog?.completed ? "text-green-600" : "text-primary")}>
                                                        {dailyLog?.completed ? "تبارك الله! أتممت الورد" : "هل أنجزت خطتك اليوم؟"}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm font-medium">سجل إنجازك لكل مهمة على حدة.</p>
                                                </div>
                                            </div>
                                            
                                            {/* Tier Tasks List (Interactive Checklist) */}
                                            <div className="grid gap-3">
                                                {todayPlan?.tasks?.map((task, idx) => {
                                                    const isDone = dailyLog?.completedTasks?.includes(task.tierId);
                                                    return (
                                                        <button 
                                                            key={idx}
                                                            disabled={isLoggingDaily}
                                                            onClick={() => handleToggleTask(task.tierId)}
                                                            className={cn(
                                                                "flex items-center justify-between p-4 rounded-2xl border transition-all text-right group/task relative overflow-hidden",
                                                                isDone 
                                                                    ? "bg-green-500/10 border-green-500/30 shadow-inner" 
                                                                    : "bg-white/5 border-white/10 hover:border-primary/40"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4 relative z-10 text-right">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                                    isDone ? "bg-green-500/20 text-green-600" : "bg-primary/10 text-primary"
                                                                )}>
                                                                    {task.type === 'hadiths' ? <Hash className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                                                </div>
                                                                <div>
                                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isDone ? "text-green-600/60" : "text-muted-foreground")}>
                                                                        {task.label}
                                                                    </p>
                                                                    <p className={cn("text-sm font-bold", isDone && "line-through opacity-50")}>
                                                                        {task.start} {task.end ? `- ${task.end}` : ''} {task.type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                                isDone 
                                                                    ? "bg-green-500 border-green-500 text-white scale-110" 
                                                                    : "border-white/20 group-hover/task:border-primary/50"
                                                            )}>
                                                                {isDone ? <CheckCircle className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/10" />}
                                                            </div>

                                                            {/* Mini ripple on click */}
                                                            {isLoggingDaily && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
                                                        </button>
                                                    );
                                                })}
                                                {!todayPlan && (
                                                    <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center flex flex-col items-center gap-3">
                                                        <Info className="w-8 h-8 opacity-20" />
                                                        <p className="text-xs font-bold opacity-40">لا يوجد مهام محددة لهذا اليوم في خطتك الحالية.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            )}
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                        {activeCourse?.features.map((f, i) => (
                            <GlassCard key={i} className="p-4 flex items-center gap-4 bg-white/5 border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-500" /></div>
                                <span className="text-sm font-medium">{f}</span>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <GlassCard className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 relative">
                        <Quote className="absolute -top-4 -right-4 w-24 h-24 text-amber-500/5 -rotate-12" />
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-amber-600 font-bold uppercase tracking-widest text-[10px]">نبضة السنّة</h3>
                            <p className="text-lg font-bold leading-loose italic">"مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ"</p>
                        </div>
                    </GlassCard>

                    {activeCourse && (
                        <GlassCard className="p-6 space-y-6">
                            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest"><Info className="w-4 h-4 text-primary" /> تفاصيل الروضة</h3>
                            <div className="grid gap-3">
                                <InfoBadge icon={Timer} label="الآلية" value={activeCourse.mechanism} color="blue" />
                                <InfoBadge icon={CreditCard} label="التكلفة" value={activeCourse.cost} color="green" />
                                <InfoBadge icon={Users} label="الفئة" value="طلاب العلم" color="purple" />
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="w-6 h-6 text-pink-500" /> مشاعر إيمانية</h3>
                    <button onClick={() => setIsTestimonialModalOpen(true)} className="text-primary font-bold text-sm flex items-center gap-2"><MessageSquarePlus className="w-5 h-5" /> شاركنا</button>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar scroll-smooth snap-x">
                    {testimonials.map(t => (
                        <GlassCard key={t.id} className="min-w-[300px] p-6 flex flex-col justify-between snap-center">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
                                        {t.studentPhoto ? <img src={t.studentPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-primary">{t.studentName?.[0]}</div>}
                                    </div>
                                    <p className="font-bold text-xs">{t.studentName}</p>
                                </div>
                                <p className="text-sm italic opacity-80 leading-relaxed">"{t.content}"</p>
                            </div>
                            <button onClick={() => handleToggleLike(t.id, t.likes)} className="mt-4 flex items-center gap-2 text-xs font-bold text-red-500/60"><Heart className={cn("w-4 h-4", t.likes.includes(user?.uid||'')&&"fill-current text-red-500")} /> {t.likes.length}</button>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Achievements */}
            {completedEnrollments.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Award className="w-6 h-6 text-amber-500" /> إنجازاتي</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {completedEnrollments.map((c, i) => (
                            <GlassCard key={i} className="p-4 flex items-center justify-between border-amber-500/20 bg-amber-500/5">
                                <div className="flex items-center gap-3">
                                    <ScrollText className="w-8 h-8 text-amber-600" />
                                    <div><p className="font-bold">{c.courseTitle}</p><p className="text-[10px] opacity-50">أتممت بنجاح</p></div>
                                </div>
                                <button className="p-2 bg-amber-600 text-white rounded-lg shadow-lg"><Download className="w-4 h-4" /></button>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* FAQ */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold">الأسئلة الشائعة</h3>
                <div className="grid gap-3">
                    <FAQItem q="كيف أسجل إنجازي؟" a="عبر بطاقة 'هل أنجزت وردك اليوم' المتوفرة في صفحتك الرئيسية." />
                    <FAQItem q="متى أحصل على الشهادة؟" a="عند إتمام كامل متطلبات الدورة والموافقة الإدارية." />
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isTestimonialModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTestimonialModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-background border border-white/10 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10">
                            <h2 className="text-xl font-bold mb-6">شارك حفظة السنة مشاعرك</h2>
                            <textarea required autoFocus value={newTestimonialContent} onChange={e => setNewTestimonialContent(e.target.value)} className="w-full h-40 p-4 rounded-2xl border bg-white/5 outline-none mb-6 resize-none" placeholder="اكتب بصدق..." />
                            <button disabled={isSubmittingTestimonial} onClick={handleSubmitTestimonial} className="w-full py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                                {isSubmittingTestimonial ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} نشر الآن
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EliteDialog 
                isOpen={dialogConfig.isOpen} 
                onClose={() => setDialogConfig({...dialogConfig, isOpen: false})} 
                onConfirm={() => setDialogConfig({...dialogConfig, isOpen: false})} 
                type={dialogConfig.type} title={dialogConfig.title} 
                description={dialogConfig.description} confirmText="حسناً" 
            />
        </div>
    );
}

// --- Sub-Components ---

function CountdownWidget({ label, timer, color, icon: Icon }: any) {
    const cls: any = { orange: "text-orange-500 bg-orange-500/5 border-orange-500/20", green: "text-green-500 bg-green-500/5 border-green-500/20" };
    return (
        <GlassCard className={cn("p-6 flex flex-col items-center justify-center text-center space-y-4 border-2 transition-all hover:scale-105", cls[color])}>
            <div className="flex items-center gap-2 opacity-60"><Icon className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">{label}</span></div>
            <div className="flex items-center gap-4">
                <div className="flex flex-col"><span className="text-3xl font-black">{timer.d}</span><span className="text-[8px] uppercase">يوم</span></div>
                <span className="text-2xl font-light opacity-20">:</span>
                <div className="flex flex-col"><span className="text-3xl font-black">{timer.h}</span><span className="text-[8px] uppercase">ساعة</span></div>
                <span className="text-2xl font-light opacity-20">:</span>
                <div className="flex flex-col"><span className="text-3xl font-black">{timer.m}</span><span className="text-[8px] uppercase">دقيقة</span></div>
            </div>
        </GlassCard>
    );
}

function InfoBadge({ icon: Icon, label, value, color }: any) {
    const cls: any = { blue: "text-blue-500 border-blue-500/10 bg-blue-500/5", green: "text-green-500 border-green-500/10 bg-green-500/5", purple: "text-purple-500 border-purple-500/10 bg-purple-500/5" };
    return (
        <div className={cn("p-3 rounded-2xl border flex items-center gap-3", cls[color])}>
            <Icon className="w-5 h-5 opacity-40" />
            <div className="text-right"><p className="text-[8px] uppercase font-bold opacity-50">{label}</p><p className="text-xs font-black">{value}</p></div>
        </div>
    );
}

function FAQItem({ q, a }: { q: string, a: string }) {
    return (
        <GlassCard className="p-0 overflow-hidden border-white/5">
            <details className="group">
                <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-bold text-sm tracking-tight">{q}<ChevronDown className="w-4 h-4 opacity-50 group-open:rotate-180 transition-transform" /></summary>
                <div className="px-6 pb-6 text-sm opacity-70 leading-relaxed">{a}</div>
            </details>
        </GlassCard>
    );
}

function CelebrateOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 400, opacity: 1, rotate: 0 }}
                    animate={{ y: 500, x: (Math.random() - 0.5) * 200 + 200, opacity: 0, rotate: 360 }}
                    transition={{ duration: 3, delay: i * 0.1, repeat: Infinity }}
                    className="absolute w-2 h-2 bg-primary rounded-full"
                    style={{ backgroundColor: ['#EAB308', '#A855F7', '#EF4444', '#10B981'][i % 4] }}
                />
            ))}
        </div>
    );
}

function RegistrationSection({ course }: { course: Course }) {
    const { user, userData } = useAuth();
    const [registering, setRegistering] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false, title: '', description: '', type: 'success' as any, onConfirm: null as any });

    const handleRegister = async () => {
        if (!user) return;
        setRegistering(true);
        try {
            const batch = writeBatch(db);
            const ref = doc(db, "enrollments", course.id, "enrollments", user.uid);
            batch.set(ref, { enrolledAt: serverTimestamp(), studentName: user.displayName || "طالب", status: "accepted" });
            
            const memberRef = doc(db, "members", course.id, "members", user.uid);
            batch.set(memberRef, { displayName: user.displayName || "طالب", role: "student", addedAt: serverTimestamp() });
            
            await batch.commit();
            const msg = `أهلاً بك في دورة ${course.title}. استعد للبداية! ${course.whatsappLink ? `\n\nيرجى الانضمام لمجموعة الواتساب:\n ${course.whatsappLink}` : ''}`;
            setDialogConfig({ isOpen: true, title: 'تم الانضمام!', description: msg, type: 'success', onConfirm: null });
        } catch (e) {
            setDialogConfig({ isOpen: true, title: 'عذراً', description: 'حدث خطأ أثناء التسجيل.', type: 'danger', onConfirm: null });
        } finally { setRegistering(false); }
    };

    const isRegOpen = course.registrationStart && course.registrationEnd && new Date() > course.registrationStart.toDate() && new Date() < course.registrationEnd.toDate();

    return (
        <>
            <button 
                disabled={!isRegOpen || registering} 
                onClick={handleRegister} 
                className={cn("px-10 py-5 rounded-2xl font-black text-white transition-all shadow-2xl flex items-center gap-3", isRegOpen ? "bg-primary hover:scale-105 active:scale-95 shadow-primary/40" : "bg-gray-400 grayscale cursor-not-allowed")}
            >
                {registering ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                {isRegOpen ? "انضم لهذه الروضة الآن" : "التسجيل مغلق"}
            </button>
            <EliteDialog 
                isOpen={dialogConfig.isOpen} 
                onClose={() => setDialogConfig({...dialogConfig, isOpen: false})} 
                onConfirm={() => setDialogConfig({...dialogConfig, isOpen: false})} 
                type={dialogConfig.type as any} 
                title={dialogConfig.title} 
                description={dialogConfig.description} 
            />
        </>
    );
}
