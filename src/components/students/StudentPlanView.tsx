"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
    doc,
    collection,
    query,
    orderBy,
    onSnapshot,
    setDoc,
    serverTimestamp,
    getDoc,
    arrayUnion,
    arrayRemove,
    updateDoc
} from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Calendar,
    CheckCircle2,
    Circle,
    ChevronLeft,
    ChevronRight,
    Trophy,
    Target,
    BookOpen,
    Hash,
    Layers,
    ListChecks,
    Clock,
    Flame,
    ArrowRight,
    Loader2,
    Star,
    Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlanItem {
    id: string;
    weekIndex: number;
    dayIndex: number;
    planType: 'hadiths' | 'pages' | 'volumes';
    startPoint: string;
    endPoint: string;
    tasks: string[];
}

interface StudentPlanViewProps {
    courseId: string;
    backUrl: string;
}

export function StudentPlanView({ courseId, backUrl }: StudentPlanViewProps) {
    const { user } = useAuth();
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [progress, setProgress] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseTitle, setCourseTitle] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [selectedWeek, setSelectedWeek] = useState(1);

    // 1. Fetch Plan & Progress
    useEffect(() => {
        if (!courseId || !user) return;

        // Fetch Course Meta
        getDoc(doc(db, "courses", courseId)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                setCourseTitle(data.title || "");
                if (data.startDate) setStartDate(data.startDate.toDate());
            }
        });

        // Fetch Plan Items
        const qPlan = query(
            collection(db, "coursePlans", courseId, "coursePlans"),
            orderBy("weekIndex", "asc"),
            orderBy("dayIndex", "asc")
        );
        const unsubPlan = onSnapshot(qPlan, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanItem[];
            setPlans(data);
            if (data.length > 0) {
                // Default to current week or week 1
                // We'll calculate current week later
            }
            setLoading(false);
        });

        // Fetch User Progress
        const unsubProgress = onSnapshot(doc(db, "planProgress", courseId, "planProgress", user.uid), (snap) => {
            if (snap.exists()) {
                setProgress(snap.data().completedDayIds || []);
            }
        });

        return () => {
            unsubPlan();
            unsubProgress();
        };
    }, [courseId, user]);

    // Calculate current day/week based on start date
    const currentStatus = useMemo(() => {
        if (!startDate) return { week: 1, day: 1 };
        const diff = new Date().getTime() - startDate.getTime();
        const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
        const week = Math.ceil(totalDays / 7);
        const day = (totalDays % 7) || 7;
        return { week: Math.max(1, week), day: Math.max(1, day) };
    }, [startDate]);

    // Group plans by week
    const weeksMap = useMemo(() => {
        const map = new Map<number, PlanItem[]>();
        plans.forEach(p => {
            if (!map.has(p.weekIndex)) map.set(p.weekIndex, []);
            map.get(p.weekIndex)!.push(p);
        });
        return Array.from(map.entries()).sort((a,b) => a[0] - b[0]);
    }, [plans]);

    useEffect(() => {
        if (weeksMap.length > 0 && selectedWeek === 1) {
            // Try to set current week as selected
            const currentWeek = currentStatus.week;
            if (weeksMap.some(([w]) => w === currentWeek)) {
                setSelectedWeek(currentWeek);
            } else if (weeksMap.length > 0) {
                setSelectedWeek(weeksMap[0][0]);
            }
        }
    }, [weeksMap, currentStatus]);

    const toggleCompletion = async (planId: string) => {
        if (!user || !courseId) return;
        const isCompleted = progress.includes(planId);
        const ref = doc(db, "planProgress", courseId, "planProgress", user.uid);
        
        try {
            const snap = await getDoc(ref);
            if (!snap.exists()) {
                await setDoc(ref, {
                    completedDayIds: [planId],
                    updatedAt: serverTimestamp()
                });
            } else {
                await updateDoc(ref, {
                    completedDayIds: isCompleted ? arrayRemove(planId) : arrayUnion(planId),
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error toggling progress:", error);
        }
    };

    const currentWeekPlans = weeksMap.find(([w]) => w === selectedWeek)?.[1] || [];
    const overallProgress = plans.length > 0 ? (progress.length / plans.length) * 100 : 0;
    
    // Find "Today's Task"
    const todayTask = plans.find(p => p.weekIndex === currentStatus.week && p.dayIndex === currentStatus.day);
    const isTodayCompleted = todayTask ? progress.includes(todayTask.id) : false;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">جاري تحميل مسارك التعليمي...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-24 px-4">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <Link href={backUrl} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span className="font-bold text-sm">العودة للدورة</span>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-lg shadow-amber-500/5">
                        <Flame className="w-4 h-4 fill-amber-500" />
                        <span className="text-xs font-black">{progress.length} أيام متتالية</span>
                    </div>
                </div>
            </div>

            {/* Title & Overall Progress */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">{courseTitle}</h1>
                    <p className="text-muted-foreground mt-1">رحلتك العلمية المبرمجة حسب منهج الصحيحين</p>
                </div>

                <GlassCard className="p-8 space-y-6 bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">إنجاز الخطة الإجمالي</p>
                            <h2 className="text-4xl font-black text-primary">{Math.round(overallProgress)}%</h2>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground opacity-50">{progress.length} من أصل {plans.length} يوم تم إنجازه</p>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${overallProgress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full" 
                        />
                    </div>
                </GlassCard>
            </div>

            {/* Today's Highlight */}
            {todayTask && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <GlassCard className={cn(
                        "p-1 border-2 transition-all duration-500",
                        isTodayCompleted ? "border-green-500/50 bg-green-500/5" : "border-primary/50 bg-primary/5"
                    )}>
                        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl relative",
                                    isTodayCompleted ? "bg-green-500 text-white" : "bg-primary text-white"
                                )}>
                                    <Trophy className="w-8 h-8" />
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] rounded-full flex items-center justify-center border border-gray-200">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    </div>
                                </div>
                                <div className="text-right md:text-right">
                                    <h3 className="text-2xl font-black">مهمة اليوم</h3>
                                    <p className="text-sm font-bold opacity-60">الأسبوع {todayTask.weekIndex} • اليوم {todayTask.dayIndex}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-2">
                                <div className="flex items-center gap-2 font-black text-lg">
                                    {todayTask.planType === 'hadiths' ? <Hash className="w-5 h-5 text-primary" /> : todayTask.planType === 'pages' ? <BookOpen className="w-5 h-5 text-primary" /> : <Layers className="w-5 h-5 text-primary" />}
                                    <span>{todayTask.planType === 'hadiths' ? 'أحاديث' : todayTask.planType === 'pages' ? 'صفحات' : 'مجلدات'} {' '} {todayTask.startPoint} {todayTask.endPoint ? ` - ${todayTask.endPoint}` : ''}</span>
                                </div>
                                <button
                                    onClick={() => toggleCompletion(todayTask.id)}
                                    className={cn(
                                        "px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center gap-3",
                                        isTodayCompleted 
                                            ? "bg-green-500 text-white shadow-green-500/20" 
                                            : "bg-primary text-white shadow-primary/20 hover:scale-105"
                                    )}
                                >
                                    {isTodayCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    <span>{isTodayCompleted ? 'تم إنجاز حصة اليوم' : 'تحديد كتم اليوم'}</span>
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {/* Week Selection & Timeline */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ListChecks className="w-6 h-6 text-primary" />
                        سجل الخطة الدراسية
                    </h2>
                    
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button 
                            onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
                            disabled={selectedWeek === 1}
                            className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-20 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="px-4 font-black text-sm">الأسبوع {selectedWeek}</div>
                        <button 
                            onClick={() => setSelectedWeek(w => w + 1)}
                            disabled={!weeksMap.some(([w]) => w === selectedWeek + 1)}
                            className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-20 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid gap-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedWeek}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid gap-4"
                        >
                            {currentWeekPlans.map((plan) => {
                                const isCompleted = progress.includes(plan.id);
                                const isCurrent = plan.weekIndex === currentStatus.week && plan.dayIndex === currentStatus.day;

                                return (
                                    <GlassCard
                                        key={plan.id}
                                        className={cn(
                                            "p-6 transition-all duration-300 border shadow-xl flex flex-col md:flex-row items-center gap-6",
                                            isCompleted ? "border-green-500/20 bg-green-500/[0.02]" : isCurrent ? "border-primary/50 bg-primary/[0.02] ring-1 ring-primary/20" : "border-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-6 flex-1 w-full">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow-inner",
                                                isCompleted ? "bg-green-500/10 text-green-500" : isCurrent ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                                            )}>
                                                {plan.dayIndex}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg">اليوم {plan.dayIndex}</h3>
                                                    {isCompleted && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> تم الإنجاز
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                     <p>
                                                        {plan.planType === 'hadiths' ? 'أحاديث' : plan.planType === 'pages' ? 'صفحات' : 'مجلدات'}:
                                                        {' '}{plan.startPoint} {plan.endPoint ? ` إلى ${plan.endPoint}` : ''}
                                                     </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="flex -space-x-2 mr-4">
                                                {plan.tasks.slice(0, 3).map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-primary/20 flex items-center justify-center">
                                                        <Clock className="w-3 h-3 text-primary" />
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => toggleCompletion(plan.id)}
                                                className={cn(
                                                    "flex-1 md:flex-none py-3 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2",
                                                    isCompleted 
                                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" 
                                                        : "bg-white/5 hover:bg-white/10 text-foreground"
                                                )}
                                            >
                                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                <span>{isCompleted ? 'مكتمل' : 'تحديد كمكتمل'}</span>
                                            </button>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {currentWeekPlans.length === 0 && (
                        <div className="text-center py-20 border border-dashed rounded-[3rem] opacity-30">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-bold">لا توجد مهام مضافة لهذا الأسبوع بعد.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Statistics Footer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FooterStat label="إنجاز الأسبوع" value={`${currentWeekPlans.filter(p => progress.includes(p.id)).length} / ${currentWeekPlans.length}`} />
                <FooterStat label="الورد المتبقي" value={`${plans.length - progress.length} يوماً`} />
                <FooterStat label="الرتبة التعليمية" value="طالب مجد" />
                <FooterStat label="أفضل إنجاز" value={`${progress.length > 0 ? progress.length : 0} مـهام`} />
            </div>
        </div>
    );
}

function FooterStat({ label, value }: { label: string, value: string }) {
    return (
        <GlassCard className="p-4 text-center space-y-1 bg-white/[0.01] border-white/5">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{label}</p>
            <p className="text-sm font-black">{value}</p>
        </GlassCard>
    );
}
