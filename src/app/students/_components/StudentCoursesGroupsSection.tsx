"use client";

import Link from "next/link";
import {
    Calendar,
    BookOpen,
    Users,
    Globe,
    ArrowUpRight,
    Clock3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { UserDocument } from "@/lib/user-document";
import {
    type Course,
    type Group,
    type CourseWirdStatus,
    isDailyWirdDoneForCourse,
} from "../_lib/student-dashboard-types";
import { CourseCard } from "./CourseCard";

type Props = {
    courses: Course[];
    groups: Group[];
    joinedCourseIds: Set<string>;
    joinedGroupIds: Set<string>;
    userData: UserDocument | null;
    dailyWirdStatuses: CourseWirdStatus[];
    activeCourse: Course | null;
    onSelectActiveCourse: (course: Course) => void;
    onJoinCourse: (course: Course) => void;
};

export function StudentCoursesGroupsSection({
    courses,
    groups,
    joinedCourseIds,
    joinedGroupIds,
    userData,
    dailyWirdStatuses,
    activeCourse,
    onSelectActiveCourse,
    onJoinCourse,
}: Props) {
    return (
        <div className="space-y-12">
            {joinedCourseIds.size > 0 && (
                <section className="space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-3 px-2">
                        <Calendar className="w-5 h-5 text-primary" /> أكمل وردك اليومي
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses
                            .filter((c) => joinedCourseIds.has(c.id))
                            .sort((a, b) => {
                                const aStatus = dailyWirdStatuses.find((s) => s.courseId === a.id);
                                const bStatus = dailyWirdStatuses.find((s) => s.courseId === b.id);
                                const aDone = isDailyWirdDoneForCourse(aStatus, a);
                                const bDone = isDailyWirdDoneForCourse(bStatus, b);
                                return Number(aDone) - Number(bDone);
                            })
                            .map((course) => {
                                const status = dailyWirdStatuses.find((s) => s.courseId === course.id);
                                const todayPages = status?.totalTodayPages || 0;
                                const minPages = status?.dailyMinPages || Number(course.dailyMinPages || 1);
                                const done = isDailyWirdDoneForCourse(status, course);
                                const perTrack = status?.usesPerTrackTargets && (status.tracksTotal || 0) > 0;
                                return (
                                    <GlassCard
                                        key={`daily-${course.id}`}
                                        className={cn(
                                            "p-5 rounded-2xl border",
                                            done
                                                ? "border-emerald-500/30 bg-emerald-500/5"
                                                : "border-amber-500/30 bg-amber-500/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-black text-sm truncate">{course.title}</p>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-black px-2 py-1 rounded-lg",
                                                    done ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                                )}
                                            >
                                                {done ? "مكتمل" : "قيد المتابعة"}
                                            </span>
                                        </div>
                                        {perTrack ? (
                                            <>
                                                <p className="text-xs opacity-70 mt-2">
                                                    المجلدات اليوم: {status?.tracksComplete ?? 0} / {status?.tracksTotal}{" "}
                                                    مكتملة
                                                </p>
                                                <p className="text-[11px] opacity-60 mt-1">
                                                    إجمالي الصفحات المسجّلة: {todayPages}
                                                </p>
                                                {!done && (status?.incompleteTrackLabels?.length ?? 0) > 0 && (
                                                    <p className="text-[10px] font-bold text-amber-600/90 mt-2 leading-relaxed">
                                                        ينقص: {status!.incompleteTrackLabels.slice(0, 3).join(" — ")}
                                                        {status!.incompleteTrackLabels.length > 3 ? "…" : ""}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-xs opacity-70 mt-2">
                                                اليوم: {todayPages} / {minPages} صفحة
                                            </p>
                                        )}
                                        <Link
                                            href={`/students/courses/${course.id}`}
                                            className="mt-3 inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                                        >
                                            أكمل الورد الآن <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </GlassCard>
                                );
                            })}
                    </div>
                </section>
            )}

            <section className="space-y-6">
                <div className="space-y-1 px-2">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-primary" /> دوراتي الحالية
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                        استخدم «تفاصيل الدورة» للدخول مباشرة وتسجيل الورد اليومي، أو اضغط البطاقة لتعيين الدورة النشطة في
                        البوابة.
                    </p>
                </div>
                {joinedCourseIds.size > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses
                            .filter((c) => joinedCourseIds.has(c.id))
                            .map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isJoined={true}
                                    isActive={activeCourse?.id === course.id}
                                    onSelect={() => onSelectActiveCourse(course)}
                                />
                            ))}
                    </div>
                ) : (
                    <GlassCard className="p-8 md:p-10 text-center space-y-3 rounded-2xl border-dashed border-white/10 bg-white/[0.02]">
                        <BookOpen className="w-10 h-10 mx-auto text-primary/40" />
                        <p className="text-sm md:text-base font-bold text-foreground">لا توجد دورات مسجّل بها حالياً</p>
                        <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                            إن كنت منضماً لحلقة دون تسجيل في دورة، قد تظهر حلقتك أدناه. يمكنك استكشاف الدورات المتاحة أو
                            التواصل مع الإدارة لتأكيد اشتراكك.
                        </p>
                    </GlassCard>
                )}
            </section>

            {joinedGroupIds.size > 0 && (
                <section className="space-y-6">
                    <h3 className="text-2xl font-black flex items-center gap-3 px-2">
                        <Users className="w-6 h-6 text-violet-400" /> حلقاتي
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups
                            .filter((g) => joinedGroupIds.has(g.id))
                            .map((g) => {
                                const isPrimaryGroup = userData?.groupId === g.id;
                                const firstEnrolledCourse = courses.find((c) => joinedCourseIds.has(c.id));
                                return (
                                    <GlassCard
                                        key={g.id}
                                        className="flex flex-col gap-4 p-5 rounded-xl border-white/10 bg-white/[0.03]"
                                    >
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-black text-base">{g.name}</p>
                                                {isPrimaryGroup && (
                                                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                                                        حلقتك
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                                                {g.gender === "female" ? "حلقة نسائية" : "حلقة رجالية"}
                                            </p>
                                            <div className="mt-3 space-y-1.5 text-[10px] font-bold text-muted-foreground/80">
                                                <p className="flex items-center gap-2">
                                                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    {g.schedule.startTime} – {g.schedule.endTime}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    <span className="truncate">
                                                        {g.schedule.recitationDays?.join(" • ") || "—"}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-4">
                                            {firstEnrolledCourse && (
                                                <Link
                                                    href={`/students/courses/${firstEnrolledCourse.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-center text-[10px] font-black text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
                                                >
                                                    تفاصيل الدورة
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                </Link>
                                            )}
                                            <Link
                                                href="/notifications"
                                                className="flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-center text-[9px] font-bold text-muted-foreground transition-colors hover:text-primary"
                                            >
                                                التواصل مع الطاقم
                                            </Link>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                    </div>
                </section>
            )}

            <section className="space-y-6">
                <h3 className="text-2xl font-black flex items-center gap-3 px-2">
                    <Globe className="w-6 h-6 text-emerald-500" /> استكشف الدورات
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses
                        .filter((c) => !joinedCourseIds.has(c.id) && c.visibility !== "private")
                        .map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                isJoined={false}
                                onJoin={() => onJoinCourse(course)}
                            />
                        ))}
                </div>
            </section>
        </div>
    );
}
