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
    Lock as LockIcon, Hash, BookOpen, TrendingUp,
    GraduationCap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { ActivityChart } from "../../components/students/ActivityChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";

interface Course {
    id: string;
    title: string;
    description: string;
    startDate: any;
    endDate: any;
    registrationEnd: any;
}

interface Testimonial {
    id: string;
    studentName: string;
    content: string;
    likes: string[];
}

interface PlanDay {
    dayIndex: number;
    tasks: string[];
}

const getLevelInfo = (points: number) => {
    if (points >= 1500) return { label: 'صاحب إتقان', color: 'text-amber-500', bg: 'bg-amber-500/10', rank: 4 };
    if (points >= 500) return { label: 'همّة علية', color: 'text-purple-500', bg: 'bg-purple-500/10', rank: 3 };
    if (points >= 100) return { label: 'طالب بصيرة', color: 'text-blue-500', bg: 'bg-blue-500/10', rank: 2 };
    return { label: 'بداية النور', color: 'text-emerald-500', bg: 'bg-emerald-500/10', rank: 1 };
};

export default function StudentsDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [timeLeftToRegister, setTimeLeftToRegister] = useState({ d: '00', h: '00', m: '00' });
    const [timeLeftToStart, setTimeLeftToStart] = useState({ d: '00', h: '00', m: '00' });
    
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

    // Dashboard Data Effect
    useEffect(() => {
        if (!user || !activeCourse) return;

        const fetchData = async () => {
            try {
                // Fetch Daily Log
                const logRef = doc(db, "daily_logs", `${activeCourse.id}_${user.uid}_${todayStr}`);
                const logSnap = await getDoc(logRef);
                if (logSnap.exists()) setDailyLog(logSnap.data() as any);
                else setDailyLog(null);

                // Fetch Last Week for Sparkline
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const qLastWeek = query(
                    collection(db, "daily_logs"),
                    where("userId", "==", user.uid),
                    where("courseId", "==", activeCourse.id),
                    where("date", ">=", sevenDaysAgo.toISOString().split('T')[0]),
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

        // Fetch Plan
        const fetchPlan = async () => {
            if (!activeCourse.startDate) return;
            const start = activeCourse.startDate.toDate();
            const today = new Date();
            const dayNum = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            if (dayNum > 0) {
                const q = query(collection(db, "coursePlans", activeCourse.id, "coursePlans"), where("dayIndex", "==", dayNum));
                const snap = await getDocs(q);
                if (!snap.empty) setTodayPlan(snap.docs[0].data() as PlanDay);
                else setTodayPlan(null);
            }
        };
        fetchPlan();

        // Fetch Enrollment
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

    const handleToggleTask = async (task: string, isCompleted: boolean) => {
        if (!user || !activeCourse || isLoggingDaily) return;
        setIsLoggingDaily(true);
        try {
            const batch = writeBatch(db);
            const logId = `${activeCourse.id}_${user.uid}_${todayStr}`;
            const logRef = doc(db, "daily_logs", logId);
            
            let currentLog = dailyLog;
            if (!currentLog) {
                currentLog = {
                    userId: user.uid,
                    courseId: activeCourse.id,
                    date: todayStr,
                    pages: 0,
                    completedTasks: [],
                    completed: false
                };
                batch.set(logRef, { ...currentLog, createdAt: serverTimestamp() });
            }

            const newTasks = isCompleted 
                ? [...(currentLog.completedTasks || []), task]
                : (currentLog.completedTasks || []).filter(t => t !== task);

            const isDayCompleted = newTasks.length === (todayPlan?.tasks?.length || 0);
            
            batch.update(logRef, {
                completedTasks: newTasks,
                completed: isDayCompleted
            });

            // If completing a task for the first time, give points
            if (isCompleted) {
                const userRef = doc(db, "users", user.uid);
                batch.update(userRef, {
                    totalPoints: increment(5),
                    lastActiveDate: serverTimestamp()
                });
                
                // Streak Logic (simplified for client-side)
                const lastDate = userData?.lastActiveDate?.toDate()?.toISOString()?.split('T')[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) {
                    batch.update(userRef, { streak: increment(1) });
                } else if (lastDate !== todayStr) {
                    batch.update(userRef, { streak: 1 });
                }
            }

            await batch.commit();
            setDailyLog({ ...currentLog, completedTasks: newTasks, completed: isDayCompleted });
            
            if (isDayCompleted && !dailyLog?.completed) {
                setShowCelebrate(true);
                setTimeout(() => setShowCelebrate(false), 3000);
            }
        } catch (error) {
            console.error("Error toggling task", error);
        } finally {
            setIsLoggingDaily(false);
        }
    };

    const handleJoinCourse = async () => {
        if (!user || !activeCourse) return;
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const enrollRef = doc(db, "enrollments", activeCourse.id, "enrollments", user.uid);
            batch.set(enrollRef, {
                userId: user.uid,
                courseId: activeCourse.id,
                courseTitle: activeCourse.title,
                studentName: user.displayName || userData?.displayName || "طالب العلم",
                studentEmail: user.email,
                enrolledAt: serverTimestamp(),
                status: 'active'
            });

            const memberRef = doc(db, "courses", activeCourse.id, "members", user.uid);
            batch.set(memberRef, {
                userId: user.uid,
                displayName: user.displayName || userData?.displayName || "طالب العلم",
                email: user.email,
                role: 'student',
                addedAt: serverTimestamp(),
                photoURL: user.photoURL || userData?.photoURL || ""
            });

            await batch.commit();
            setDialogConfig({
                isOpen: true,
                type: 'success',
                title: 'تم الانضمام بنجاح',
                description: `مبارك انضمامك لدورة ${activeCourse.title}. نسأل الله لك النفع والبركة.`
            });
        } catch (error) {
            console.error("Error joining course", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLike = async (tid: string, likes: string[]) => {
        if (!user) return;
        const ref = doc(db, "testimonials", tid);
        const isLiked = likes.includes(user.uid);
        await updateDoc(ref, {
            likes: isLiked ? likes.filter(id => id !== user.uid) : arrayUnion(user.uid)
        });
    };

    const handleSubmitTestimonial = async () => {
        if (!user || !newTestimonialContent.trim()) return;
        setIsSubmittingTestimonial(true);
        try {
            await setDoc(doc(collection(db, "testimonials")), {
                userId: user.uid,
                studentName: user.displayName || userData?.displayName || "طالب العلم",
                content: newTestimonialContent,
                likes: [],
                createdAt: serverTimestamp()
            });
            setNewTestimonialContent("");
            setIsTestimonialModalOpen(false);
        } catch (error) {
            console.error("Error submitting testimonial", error);
        } finally {
            setIsSubmittingTestimonial(false);
        }
    };

    if (loading && !activeCourse) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-32">
            {/* Motivation Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 p-[2px] shadow-2xl shadow-primary/20 transition-transform group-hover:scale-105">
                            <div className="w-full h-full rounded-[1.9rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-primary opacity-40" />
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-lg border-2 border-background flex items-center gap-1">
                            <Star className="w-3 h-3" /> {userData?.totalPoints || 0} XP
                        </div>
                    </div>
                    <div className="text-right md:text-left space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black">{user?.displayName || "طالب العلم"}</h1>
                            <div className={`px-4 py-1 ${getLevelInfo(userData?.totalPoints || 0).bg} ${getLevelInfo(userData?.totalPoints || 0).color} text-[10px] font-black rounded-full border border-current/20 uppercase tracking-widest`}>
                                {getLevelInfo(userData?.totalPoints || 0).label}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1.5 text-orange-500 font-bold">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm">سلسلة: {userData?.streak || 0} يوم</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <div className="text-sm font-medium">طالب بصيرة • السنة النبوية</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <ActivityChart logs={lastWeekLogs} />
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push('/profile')} className="p-4 hover:bg-primary/10 rounded-2xl transition-all border border-transparent hover:border-primary/20"><UserIcon className="w-5 h-5 text-muted-foreground hover:text-primary" /></button>
                        <button onClick={() => router.push('/settings')} className="p-4 hover:bg-primary/10 rounded-2xl transition-all border border-transparent hover:border-primary/20"><Settings className="w-5 h-5 text-muted-foreground hover:text-primary" /></button>
                    </div>
                </div>
            </motion.div>

            {/* Level Up Celebration Modal */}
            <AnimatePresence>
                {showLevelUp && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                        <GlassCard className="p-10 border-amber-500/50 bg-amber-500/10 backdrop-blur-2xl text-center space-y-6 shadow-[0_0_100px_rgba(245,158,11,0.3)]">
                            <Award className="w-24 h-24 text-amber-500 mx-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black text-white">مبارك الارتقاء!</h2>
                                <p className="text-xl font-bold text-amber-500">لقد وصلت لمرتبة: {getLevelInfo(userData?.totalPoints || 0).label}</p>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Card or Join Card */}
            {activeCourse && !fetchingEnrolled && (
                <div className="relative">
                    {!isEnrolled ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <GlassCard className="p-10 border-primary/40 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/30 shadow-xl shadow-primary/20">
                                        <GraduationCap className="w-10 h-10 text-primary" />
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <h2 className="text-3xl font-black text-center">{activeCourse.title}</h2>
                                        <p className="text-muted-foreground font-medium max-w-md mx-auto leading-loose italic opacity-80 text-center">"{activeCourse.description}"</p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-6 py-4">
                                        <div className="flex items-center gap-2 text-xs font-bold opacity-60"><Calendar className="w-4 h-4" /> التسجيل متاح الآن</div>
                                        <div className="flex items-center gap-2 text-xs font-bold opacity-60"><Users className="w-4 h-4" /> انضم لـ 1,200 طالب</div>
                                    </div>
                                    <button onClick={handleJoinCourse} disabled={loading} className="px-12 py-5 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-2xl shadow-primary/40 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                        انضم الآن وابدأ الرحلة
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <GlassCard className="p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 overflow-hidden">
                             <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="relative w-32 h-32 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-white/5" />
                                        <motion.circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 58} initial={{ strokeDashoffset: 2 * Math.PI * 58 }} animate={{ strokeDashoffset: (2 * Math.PI * 58) * (1 - progressPercent / 100) }} className="text-primary" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-primary">{progressPercent}%</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">الإنجاز</span>
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-right space-y-4">
                                    <h2 className="text-2xl font-black">{activeCourse.title}</h2>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><p className="text-[10px] text-muted-foreground font-bold">المتبقي</p><p className="font-black">{daysRemaining} يوم</p></div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><p className="text-[10px] text-muted-foreground font-bold">المدة</p><p className="font-black">{totalDays} يوم</p></div>
                                        <div className="p-4 rounded-2xl bg-primary text-white"><p className="text-[10px] font-bold">الجهد</p><p className="font-black">{streak} يوم</p></div>
                                    </div>
                                </div>
                             </div>
                        </GlassCard>
                    )}
                </div>
            )}

            {/* Daily Tasks */}
            {isEnrolled && todayPlan && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" /> ورد اليوم {todayPlan.dayIndex}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">استعن بالله ولا تعجز، فخير العمل أدومه وإن قل.</p>
                        </div>
                        {dailyLog?.completed && <div className="px-4 py-2 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full border border-green-500/20 flex items-center gap-2 uppercase tracking-widest animate-bounce"><Sparkles className="w-3 h-3" /> تم الإنجاز بنجاح</div>}
                    </div>
                    
                    <div className="grid gap-4">
                        {todayPlan.tasks.map((task, idx) => {
                            const isDone = dailyLog?.completedTasks?.includes(task);
                            return (
                                <GlassCard key={idx} className={`p-6 transition-all duration-300 group cursor-pointer border-transparent hover:border-primary/20 ${isDone ? 'bg-primary/5 opacity-60' : 'hover:bg-white/5'}`} onClick={() => handleToggleTask(task, !isDone)}>
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDone ? 'bg-primary text-white scale-90' : 'bg-white/10 text-muted-foreground group-hover:bg-primary/20'}`}>
                                            {isLoggingDaily ? <Loader2 className="w-6 h-6 animate-spin" /> : isDone ? <CheckCircle className="w-7 h-7" /> : <div className="w-3 h-3 rounded-full border-2 border-current opacity-40" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={`text-lg font-bold transition-all ${isDone ? 'line-through opacity-40' : ''}`}>{task}</p>
                                            <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">+5 XP عند الإكمال</p>
                                        </div>
                                        <button className={`p-3 rounded-xl transition-all ${isDone ? 'text-primary' : 'text-muted-foreground opacity-20'}`}><TrendingUp className="w-5 h-5" /></button>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Testimonials Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> قناديل الهدى (تجارب الطلاب)</h3>
                    <button onClick={() => setIsTestimonialModalOpen(true)} className="px-5 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-black rounded-xl transition-all border border-primary/20 flex items-center gap-2"><MessageSquarePlus className="w-4 h-4" /> شاركنا تجربتك</button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <GlassCard key={t.id} className="p-8 space-y-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500">
                            <div className="space-y-4">
                                <Quote className="w-10 h-10 text-primary opacity-20" />
                                <p className="text-lg leading-loose font-medium italic opacity-80">"{t.content}"</p>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/10">{t.studentName[0]}</div>
                                    <span className="text-sm font-bold">{t.studentName}</span>
                                </div>
                                <button onClick={() => handleToggleLike(t.id, t.likes)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${t.likes.includes(user?.uid || '') ? 'bg-red-500/10 text-red-500' : 'hover:bg-white/10 opacity-40'}`}>
                                    <Heart className={`w-4 h-4 ${t.likes.includes(user?.uid || '') ? 'fill-current' : ''}`} />
                                    <span className="text-xs font-black">{t.likes.length}</span>
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={dialogConfig.isOpen} onOpenChange={(open: boolean) => setDialogConfig(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent className="max-w-md bg-background border-border rounded-3xl shadow-2xl p-8">
                    <DialogHeader className="space-y-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 ${dialogConfig.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {dialogConfig.type === 'success' ? <CheckCircle className="w-8 h-8" /> : <X className="w-8 h-8" />}
                        </div>
                        <DialogTitle className="text-2xl font-black text-center">{dialogConfig.title}</DialogTitle>
                        <DialogDescription className="text-center font-medium leading-relaxed opacity-60 text-lg">{dialogConfig.description}</DialogDescription>
                    </DialogHeader>
                    <button onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))} className="w-full mt-8 py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl transition-all shadow-xl shadow-primary/20">حسناً، فهمت</button>
                </DialogContent>
            </Dialog>

            {/* Testimonial Modal */}
            <Dialog open={isTestimonialModalOpen} onOpenChange={setIsTestimonialModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle className="text-2xl font-black">شارك تجربتك مع زملائك</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-6">
                        <textarea value={newTestimonialContent} onChange={(e) => setNewTestimonialContent(e.target.value)} placeholder="اكتب هنا تجربتك أو نصيحة لزملائك الطلاب..." className="w-full h-48 p-6 bg-white/5 border border-white/10 rounded-2xl font-medium leading-loose resize-none focus:ring-2 focus:ring-primary/20 outline-none" />
                        <button onClick={handleSubmitTestimonial} disabled={isSubmittingTestimonial || !newTestimonialContent.trim()} className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                            {isSubmittingTestimonial ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            نشر التجربة الآن
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
