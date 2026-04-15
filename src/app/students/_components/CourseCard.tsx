"use client";

import Link from "next/link";
import { BookOpen, ArrowUpRight, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { Course } from "../_lib/student-dashboard-types";

type Props = {
    course: Course;
    isJoined: boolean;
    isActive?: boolean;
    onSelect?: () => void;
    onJoin?: () => void;
};

export function CourseCard({ course, isJoined, isActive, onSelect, onJoin }: Props) {
    return (
        <GlassCard
            className={cn(
                "p-0 flex flex-col h-full transition-all duration-500 hover:-translate-y-1.5 border-white/5 card-shine group rounded-[1.5rem] md:rounded-[2rem] overflow-hidden",
                isActive ? "border-primary ring-4 ring-primary/5 bg-primary/5 shadow-2xl shadow-primary/10" : "hover:border-primary/30",
                isJoined && onSelect ? "cursor-pointer" : ""
            )}
            onClick={isJoined ? () => onSelect?.() : undefined}
        >
            <div className="p-6 md:p-8 space-y-4 md:space-y-6 flex-1">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div
                        className={cn(
                            "px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-lg",
                            isJoined
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5"
                                : "bg-primary/10 text-primary border-primary/20 shadow-primary/5"
                        )}
                    >
                        {isJoined ? "نشط" : "متاح"}
                    </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                    <h4 className="text-xl md:text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {course.title}
                    </h4>
                    <p className="text-[12px] md:text-sm text-muted-foreground font-medium opacity-60 line-clamp-2 md:line-clamp-3 leading-relaxed">
                        {course.description}
                    </p>
                </div>
            </div>
            <div
                className={cn(
                    "mt-auto border-t border-white/5 bg-white/[0.02] px-6 py-4 md:px-8 md:py-6",
                    isJoined ? "flex flex-col gap-3 sm:flex-row sm:items-stretch" : "flex items-center justify-between"
                )}
            >
                {isJoined ? (
                    <Link
                        href={`/students/courses/${course.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-[10px] font-black text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                    >
                        تفاصيل الدورة
                        <ArrowUpRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Link>
                ) : (
                    <>
                        <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>مجتمع المعرفة</span>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onJoin?.();
                            }}
                            className="px-4 py-2 md:px-6 md:py-2.5 bg-primary text-white text-[9px] md:text-[10px] font-black rounded-lg md:rounded-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all btn-elite"
                        >
                            التحاق
                        </button>
                    </>
                )}
            </div>
        </GlassCard>
    );
}
