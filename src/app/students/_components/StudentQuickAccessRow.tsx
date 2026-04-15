"use client";

import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Course, Group } from "../_lib/student-dashboard-types";

type Props = {
    courses: Course[];
    groups: Group[];
    joinedCourseIds: Set<string>;
    joinedGroupIds: Set<string>;
};

export function StudentQuickAccessRow({ courses, groups, joinedCourseIds, joinedGroupIds }: Props) {
    return (
        <section className="grid gap-4 md:grid-cols-2">
            <GlassCard className="p-5 rounded-2xl border-primary/20 bg-primary/5">
                <h2 className="text-lg font-black mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" /> وصول سريع للدورات
                </h2>
                <p className="text-xs text-muted-foreground mb-3">
                    ادخل مباشرة إلى تفاصيل دورتك وسجل الورد اليومي من نفس الصفحة.
                </p>
                <div className="flex flex-wrap gap-2">
                    {courses
                        .filter((c) => joinedCourseIds.has(c.id))
                        .slice(0, 4)
                        .map((c) => (
                            <Link
                                key={`quick-course-${c.id}`}
                                href={`/students/courses/${c.id}`}
                                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black hover:bg-primary/10"
                            >
                                {c.title}
                            </Link>
                        ))}
                </div>
            </GlassCard>
            <GlassCard className="p-5 rounded-2xl border-violet-500/20 bg-violet-500/5">
                <h2 className="text-lg font-black mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" /> وصول سريع للحلقات
                </h2>
                <p className="text-xs text-muted-foreground mb-3">تظهر حلقاتك المسجلة هنا مباشرة بدون بحث.</p>
                <div className="flex flex-wrap gap-2">
                    {groups
                        .filter((g) => joinedGroupIds.has(g.id))
                        .slice(0, 4)
                        .map((g) => (
                            <span
                                key={`quick-group-${g.id}`}
                                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black"
                            >
                                {g.name}
                            </span>
                        ))}
                </div>
            </GlassCard>
        </section>
    );
}
