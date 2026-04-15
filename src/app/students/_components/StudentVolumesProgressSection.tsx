"use client";

import { motion } from "framer-motion";
import { Library, BookOpen, Trophy, Layers as LayersIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { SUNNAH_VOLUMES } from "@/lib/volumes";
import type { PlanTemplate } from "@/types/plan";
import type { Course } from "../_lib/student-dashboard-types";

type Props = {
    activeTemplate: PlanTemplate | null;
    activeCourse: Course | null;
    templateVolumes: { volumeId: string; tierId?: string }[];
    courseVolumes: string[];
    volumeProgress: Record<string, number>;
};

export function StudentVolumesProgressSection({
    activeTemplate,
    activeCourse,
    templateVolumes,
    courseVolumes,
    volumeProgress,
}: Props) {
    return (
        <section className="space-y-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 md:px-4">
                <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black flex items-center gap-3 text-primary">
                        <Library className="w-6 h-6" /> مسار إنجاز المجلدات المطلوبة
                    </h3>
                    <p className="text-muted-foreground text-xs md:text-sm font-medium italic">
                        {`"وخيرُ العلم ما ضُبطت أصولُه.."`}
                    </p>
                </div>

                {(activeTemplate || activeCourse?.folderId) && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-primary/10 border border-primary/20 rounded-xl md:rounded-2xl p-2.5 md:p-3.5 flex items-center gap-3 md:gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative w-10 h-10 md:w-14 md:h-14">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    className="text-white/5 md:hidden"
                                />
                                <circle
                                    cx="28"
                                    cy="28"
                                    r="25"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    className="text-white/5 hidden md:block"
                                />
                                <motion.circle
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    className="text-primary md:hidden"
                                    strokeDasharray={113}
                                    initial={{ strokeDashoffset: 113 }}
                                    animate={{
                                        strokeDashoffset:
                                            113 -
                                            113 *
                                                Math.min(
                                                    Object.entries(volumeProgress)
                                                        .filter(
                                                            ([vid]) =>
                                                                templateVolumes.some((tv) => tv.volumeId === vid) ||
                                                                courseVolumes.includes(vid) ||
                                                                activeCourse?.folderId === vid
                                                        )
                                                        .reduce((acc, [, val]) => acc + val, 0) /
                                                        (SUNNAH_VOLUMES.filter(
                                                            (v) =>
                                                                templateVolumes.some((tv) => tv.volumeId === v.id) ||
                                                                courseVolumes.includes(v.id) ||
                                                                activeCourse?.folderId === v.id
                                                        ).reduce((acc, v) => acc + v.totalPages, 0) || 1),
                                                    1
                                                ),
                                    }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                                <motion.circle
                                    cx="28"
                                    cy="28"
                                    r="25"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    className="text-primary hidden md:block"
                                    strokeDasharray={157}
                                    initial={{ strokeDashoffset: 157 }}
                                    animate={{
                                        strokeDashoffset:
                                            157 -
                                            157 *
                                                Math.min(
                                                    Object.entries(volumeProgress)
                                                        .filter(
                                                            ([vid]) =>
                                                                templateVolumes.some((tv) => tv.volumeId === vid) ||
                                                                courseVolumes.includes(vid) ||
                                                                activeCourse?.folderId === vid
                                                        )
                                                        .reduce((acc, [, val]) => acc + val, 0) /
                                                        (SUNNAH_VOLUMES.filter(
                                                            (v) =>
                                                                templateVolumes.some((tv) => tv.volumeId === v.id) ||
                                                                courseVolumes.includes(v.id) ||
                                                                activeCourse?.folderId === v.id
                                                        ).reduce((acc, v) => acc + v.totalPages, 0) || 1),
                                                    1
                                                ),
                                    }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[7px] md:text-[9px] font-black">
                                {Math.round(
                                    (Object.entries(volumeProgress)
                                        .filter(
                                            ([vid]) =>
                                                templateVolumes.some((tv) => tv.volumeId === vid) ||
                                                courseVolumes.includes(vid) ||
                                                activeCourse?.folderId === vid
                                        )
                                        .reduce((acc, [, val]) => acc + val, 0) /
                                        (SUNNAH_VOLUMES.filter(
                                            (v) =>
                                                templateVolumes.some((tv) => tv.volumeId === v.id) ||
                                                courseVolumes.includes(v.id) ||
                                                activeCourse?.folderId === v.id
                                        ).reduce((acc, v) => acc + v.totalPages, 0) || 1)) *
                                        100
                                )}
                                %
                            </div>
                        </div>
                        <div className="space-y-0 relative z-10">
                            <div className="text-[7px] md:text-[9px] font-black text-primary uppercase tracking-widest opacity-70">
                                الإنجاز الكلي
                            </div>
                            <div className="text-base md:text-lg font-black flex items-baseline gap-1.5">
                                <span className="text-xl md:text-2xl tracking-tighter">
                                    {SUNNAH_VOLUMES.filter(
                                        (v) =>
                                            templateVolumes.some((tv) => tv.volumeId === v.id) ||
                                            courseVolumes.includes(v.id) ||
                                            activeCourse?.folderId === v.id
                                    ).reduce((acc, v) => acc + v.totalPages, 0) -
                                        Object.entries(volumeProgress)
                                            .filter(
                                                ([vid]) =>
                                                    templateVolumes.some((tv) => tv.volumeId === vid) ||
                                                    courseVolumes.includes(vid) ||
                                                    activeCourse?.folderId === vid
                                            )
                                            .reduce((acc, [, val]) => acc + val, 0)}
                                </span>
                                <span className="text-[9px] opacity-50">متبقية</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {SUNNAH_VOLUMES.filter((volume) => {
                    const isTarget =
                        templateVolumes.some((tv) => tv.volumeId === volume.id) ||
                        courseVolumes.includes(volume.id) ||
                        activeCourse?.folderId === volume.id;
                    return isTarget;
                }).map((volume) => {
                    const completed = volumeProgress[volume.id] || 0;
                    const percent = Math.min(Math.round((completed / volume.totalPages) * 100), 100);
                    return (
                        <GlassCard
                            key={volume.id}
                            className={cn(
                                "p-3.5 md:p-4.5 hover:-translate-y-1 transition-all duration-500 overflow-hidden relative group rounded-xl",
                                percent >= 100
                                    ? "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/10"
                                    : "bg-white/[0.01]"
                            )}
                        >
                            <div
                                className={cn(
                                    "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-150",
                                    "bg-gradient-to-br " + volume.color
                                )}
                            />
                            <div className="space-y-2.5 md:space-y-3.5 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div
                                        className={cn(
                                            "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br shadow-xl transform group-hover:rotate-12 transition-transform",
                                            volume.color
                                        )}
                                    >
                                        {percent >= 100 ? (
                                            <Trophy className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                                        ) : (
                                            <BookOpen className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg md:text-xl font-black tracking-tighter opacity-80">
                                            {percent}%
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-black text-xs md:text-sm mb-0.5 truncate">{volume.title}</h4>
                                    <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest">
                                        {completed} / {volume.totalPages} مـادة
                                    </p>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden shadow-inner relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        className={cn(
                                            "h-full relative",
                                            percent >= 100 ? "bg-emerald-500" : "bg-gradient-to-r " + volume.color
                                        )}
                                    >
                                        {percent < 100 && percent > 0 && (
                                            <div className="absolute top-0 right-0 h-full w-4 bg-white/20 blur-sm animate-pulse" />
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            {SUNNAH_VOLUMES.filter(
                (v) => activeTemplate?.selectedVolumeIds?.includes(v.id) || activeCourse?.folderId === v.id
            ).length === 0 && (
                <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 flex flex-col items-center gap-4">
                    <LayersIcon className="w-12 h-12" />
                    <p className="font-bold">لم يتم رصد مجلدات مطلوبة في خطتك الحالية بعد.</p>
                </div>
            )}
        </section>
    );
}
