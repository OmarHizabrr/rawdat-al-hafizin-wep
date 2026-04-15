"use client";

import Link from "next/link";
import {
    Calendar,
    CheckCircle,
    Loader2,
    Hash,
    BookOpen,
    Target,
    ArrowUpRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { PlanTemplate, TierTask } from "@/types/plan";
import type { Course, DailyLogDoc, PlanDay } from "../_lib/student-dashboard-types";

type Props = {
    isEnrolled: boolean;
    todayPlan: PlanDay | null;
    dailyLog: DailyLogDoc | null;
    isLoggingDaily: boolean;
    activeTemplate: PlanTemplate | null;
    courses: Course[];
    joinedCourseIds: Set<string>;
    onToggleTask: (taskData: string | TierTask, isCompleted: boolean) => void;
};

export function StudentDailyPlanSection({
    isEnrolled,
    todayPlan,
    dailyLog,
    isLoggingDaily,
    activeTemplate,
    courses,
    joinedCourseIds,
    onToggleTask,
}: Props) {
    return (
        <section
            id="student-daily-plan"
            className="scroll-mt-28 space-y-6"
            aria-label="ورد اليوم والمتابعة اليومية"
        >
            {isEnrolled && todayPlan ? (
                <div className="space-y-8">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black flex items-center gap-3 text-primary">
                                <Calendar className="w-6 h-6" /> ورد اليوم {todayPlan.dayIndex}
                            </h3>
                            <p className="text-muted-foreground italic font-medium">{`"نور العلم في العمل به.."`}</p>
                        </div>
                        {dailyLog?.completed && (
                            <div className="px-6 py-3 bg-emerald-500 text-white font-black rounded-2xl">
                                تم الإنجاز بنجاح ✨
                            </div>
                        )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {todayPlan.tasks.map((taskData, idx) => {
                            const taskLabel = typeof taskData === "string" ? taskData : taskData.label;
                            const isDone = dailyLog?.completedTasks?.includes(taskLabel);

                            let accentColor = "bg-primary";
                            if (typeof taskData !== "string" && activeTemplate) {
                                const tier = activeTemplate.tiers.find((t) => t.id === taskData.tierId);
                                if (tier?.color) accentColor = tier.color;
                            }

                            return (
                                <GlassCard
                                    key={idx}
                                    className={cn(
                                        "p-4 md:p-6 cursor-pointer transition-all border-l-4 group relative rounded-2xl",
                                        isDone
                                            ? "border-emerald-500 bg-emerald-500/5 opacity-80 shadow-emerald-500/5"
                                            : `border-transparent bg-white/[0.02] hover:bg-white/[0.04] flex flex-col`
                                    )}
                                    onClick={() => onToggleTask(taskData, !isDone)}
                                >
                                    <div className="flex items-center gap-4 md:gap-5">
                                        <div
                                            className={cn(
                                                "w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all duration-500",
                                                isDone
                                                    ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                                                    : "bg-white/5 text-muted-foreground"
                                            )}
                                        >
                                            {isLoggingDaily ? (
                                                <Loader2 className="animate-spin" />
                                            ) : isDone ? (
                                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                                            ) : (
                                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-current opacity-30" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                {typeof taskData !== "string" && (
                                                    <div className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", accentColor)} />
                                                )}
                                                <p
                                                    className={cn(
                                                        "text-base md:text-lg font-black transition-all leading-tight",
                                                        isDone && "line-through opacity-50"
                                                    )}
                                                >
                                                    {taskLabel}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded uppercase tracking-widest">
                                                    +5 XP
                                                </div>
                                                {typeof taskData !== "string" && taskData.type === "hadiths" && (
                                                    <span className="text-[8px] opacity-40 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <Hash className="w-2.5 h-2.5" /> أحاديث
                                                    </span>
                                                )}
                                                {typeof taskData !== "string" && taskData.type === "pages" && (
                                                    <span className="text-[8px] opacity-40 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <BookOpen className="w-2.5 h-2.5" /> صفحات
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!isDone && typeof taskData !== "string" && (taskData.start || taskData.end) && (
                                        <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                                            <p className="text-[10px] font-bold opacity-60 flex items-center gap-1.5">
                                                <Target className="w-3.5 h-3.5 text-primary" />
                                                نطاق المهمة: {taskData.start}{" "}
                                                {taskData.end ? `إلى ${taskData.end}` : ""}
                                            </p>
                                        </div>
                                    )}
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <GlassCard className="space-y-4 p-6 md:p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                    <Calendar className="mx-auto h-9 w-9 text-primary/40" />
                    <h3 className="text-base font-black text-foreground">ورد اليوم والمهام اليومية</h3>
                    <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
                        عند تسجيلك في دورة وتفعيلها من «دوراتي الحالية» يظهر هنا وردك ومهامك. يمكنك فتح صفحة الدورة مباشرة من
                        بطاقة الدورة.
                    </p>
                    {courses.some((c) => joinedCourseIds.has(c.id)) && (
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {courses
                                .filter((c) => joinedCourseIds.has(c.id))
                                .map((c) => (
                                    <Link
                                        key={c.id}
                                        href={`/students/courses/${c.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[10px] font-black text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                                    >
                                        دورة: {c.title}
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                ))}
                        </div>
                    )}
                </GlassCard>
            )}
        </section>
    );
}
