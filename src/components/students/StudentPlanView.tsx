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
    updateDoc,
    deleteDoc
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
    BookOpen,
    Hash,
    Layers,
    ListChecks,
    Clock,
    Flame,
    ArrowRight,
    Loader2,
    Star,
    Compass,
    Activity
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

        // Fetch User Progress using the new nested path
        const progressPath = `${courseId}_${user.uid}`;
        const unsubProgress = onSnapshot(collection(db, "plan_progress", progressPath, "plan_progress"), (snap) => {
            setProgress(snap.docs.map(d => d.id));
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
        const progressPath = `${courseId}_${user.uid}`;
        const ref = doc(db, "plan_progress", progressPath, "plan_progress", planId);
        
        try {
            if (isCompleted) {
                await deleteDoc(ref);
            } else {
                await setDoc(ref, {
                    planId,
                    userId: user.uid,
                    courseId,
                    completedAt: serverTimestamp()
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
                <p className="text-sm text-muted-foreground">جاري تحميل مسارك التعليمي…</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-24 px-4">
            {/* Header Area */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                <Link
                    href={backUrl}
                    className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    العودة للوحة الدورة
                </Link>
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <Flame className="h-4 w-4 fill-current" />
                    {progress.length} من المهام
                </div>
            </div>

            {/* Title & Overall Progress */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{courseTitle}</h1>
                    <p className="text-muted-foreground mt-1">رحلتك العلمية المبرمجة حسب منهج الصحيحين</p>
                </div>

                <GlassCard className="relative space-y-6 overflow-hidden p-6 md:p-8 md:space-y-8">
                    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-primary">
                                <Activity className="h-3.5 w-3.5" />
                                التقدم الكلي
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
                                    {Math.round(overallProgress)}%
                                </h2>
                                <span className="text-sm text-muted-foreground">مكتمل</span>
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-xs text-muted-foreground">
                                {progress.length} من أصل {plans.length} يوم عمل
                            </p>
                            <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-primary">
                                <Compass className="h-3 w-3" />
                                مسار {todayTask?.planType === "hadiths" ? "المحدثين" : "الحفاظ"}
                            </div>
                        </div>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallProgress}%` }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-primary"
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
                    <GlassCard
                        className={cn(
                            "border-2 p-6 md:p-8",
                            isTodayCompleted
                                ? "border-green-500/40 bg-green-500/5"
                                : "border-primary/40 bg-primary/5"
                        )}
                    >
                        <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
                            <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
                                <div
                                    className={cn(
                                        "relative flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-sm md:h-20 md:w-20",
                                        isTodayCompleted ? "bg-green-600" : "bg-primary"
                                    )}
                                >
                                    <Trophy className="h-9 w-9 md:h-10 md:w-10" />
                                    <div className="absolute -end-1 -top-1 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card shadow-sm">
                                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                    </div>
                                </div>
                                <div className="text-center md:text-right">
                                    <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
                                        <span className="h-2 w-2 rounded-full bg-primary" />
                                        <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">مهمة اليوم</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        الأسبوع {todayTask.weekIndex} • اليوم {todayTask.dayIndex}
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col items-center gap-4 md:w-auto md:items-end">
                                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-lg font-medium md:text-xl">
                                    {todayTask.planType === "hadiths" ? (
                                        <Hash className="h-6 w-6 text-primary" />
                                    ) : todayTask.planType === "pages" ? (
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    ) : (
                                        <Layers className="h-6 w-6 text-primary" />
                                    )}
                                    <span className="text-foreground">
                                        {todayTask.planType === "hadiths"
                                            ? "أحاديث"
                                            : todayTask.planType === "pages"
                                              ? "صفحات"
                                              : "مجلدات"}{" "}
                                        {todayTask.startPoint}
                                        {todayTask.endPoint ? ` - ${todayTask.endPoint}` : ""}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleCompletion(todayTask.id)}
                                    className={cn(
                                        "flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-sm font-medium shadow-sm transition-colors md:w-auto",
                                        isTodayCompleted
                                            ? "border border-green-500/30 bg-green-600 text-white hover:bg-green-600/90"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                >
                                    {isTodayCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                    {isTodayCompleted ? "تم الإنجاز بحمد الله" : "تسجيل إنجاز اليوم"}
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
                    
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
                            disabled={selectedWeek === 1}
                            className="rounded-md p-2 transition-colors hover:bg-muted disabled:opacity-30"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="min-w-[5.5rem] px-3 text-center text-sm font-medium">الأسبوع {selectedWeek}</div>
                        <button
                            type="button"
                            onClick={() => setSelectedWeek((w) => w + 1)}
                            disabled={!weeksMap.some(([w]) => w === selectedWeek + 1)}
                            className="rounded-md p-2 transition-colors hover:bg-muted disabled:opacity-30"
                        >
                            <ChevronLeft className="h-5 w-5" />
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
                                            "flex flex-col items-center gap-6 p-5 md:flex-row md:p-6",
                                            isCompleted
                                                ? "border-green-500/30 bg-green-500/5"
                                                : isCurrent
                                                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                                                  : ""
                                        )}
                                    >
                                        <div className="flex items-center gap-6 flex-1 w-full">
                                            <div
                                                className={cn(
                                                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                                                    isCompleted
                                                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                                        : isCurrent
                                                          ? "bg-primary text-primary-foreground"
                                                          : "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {plan.dayIndex}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg">اليوم {plan.dayIndex}</h3>
                                                    {isCompleted && (
                                                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
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
                                                    <div
                                                        key={i}
                                                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary/15"
                                                    >
                                                        <Clock className="w-3 h-3 text-primary" />
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => toggleCompletion(plan.id)}
                                                className={cn(
                                                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium transition-colors md:flex-none",
                                                    isCompleted
                                                        ? "border border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/15 dark:text-green-400"
                                                        : "border border-border bg-muted/50 text-foreground hover:bg-muted"
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
                        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
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
        <GlassCard className="space-y-1 p-4 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
        </GlassCard>
    );
}
