"use client";

import Link from "next/link";
import {
    Award,
    Star,
    Shield,
    Zap,
    Trophy,
    Coins,
    User as UserIcon,
} from "lucide-react";
import type { User } from "firebase/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { UserDocument } from "@/lib/user-document";
import { AVAILABLE_ICONS, type BadgeRow, type LeaderboardRow, type PointsLogRow } from "../_lib/student-dashboard-types";

type Props = {
    user: User | null;
    userData: UserDocument | null;
    myBadges: BadgeRow[];
    pointsLogs: PointsLogRow[];
    leaderboard: LeaderboardRow[];
};

export function StudentGamificationSection({ user, userData, myBadges, pointsLogs, leaderboard }: Props) {
    return (
        <div className="grid lg:grid-cols-3 gap-8 pt-6">
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3 text-amber-500 px-4">
                    <Award className="w-6 h-6" /> خزانة الأوسمة الملكية
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {myBadges.length > 0 ? (
                        myBadges.map((badge) => {
                            const IconComp = AVAILABLE_ICONS.find((i) => i.key === badge.iconKey)?.icon || Star;
                            return (
                                <GlassCard
                                    key={badge.id}
                                    className="p-5 flex flex-col items-center text-center gap-3 group hover:-translate-y-1 transition-all rounded-xl"
                                >
                                    <div
                                        className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-xl group-hover:rotate-12 transition-all",
                                            badge.color
                                        )}
                                    >
                                        <IconComp className="w-7 h-7" />
                                    </div>
                                    <h4 className="font-black text-[11px] leading-tight">{badge.name}</h4>
                                    <p className="text-[9px] opacity-40 italic">
                                        {badge.rarity === "diamond" ? "نادر جداً" : "وسام ملكي"}
                                    </p>
                                </GlassCard>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-12 border-2 border-dashed border-white/5 rounded-2xl text-center opacity-20">
                            <Shield className="w-10 h-10 mx-auto mb-3" />
                            <p className="text-xs">ابدأ رحلتك لتجمـع الأوسمة</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-black flex items-center gap-3 text-primary">
                        <Zap className="w-5 h-5" /> السجل الأكاديمي
                    </h3>
                    <Link
                        href="/records"
                        className="text-xs font-bold text-primary hover:underline underline-offset-2 w-fit"
                    >
                        عرض السجل الأكاديمي الشامل ←
                    </Link>
                </div>
                <GlassCard className="p-6 bg-primary/5 space-y-4 rounded-xl">
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {pointsLogs.map((log) => (
                            <div
                                key={log.id}
                                className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                                            log.type === "penalty"
                                                ? "bg-rose-500/10 text-rose-500"
                                                : "bg-emerald-500/10 text-emerald-500"
                                        )}
                                    >
                                        {Number(log.amount) > 0 ? `+${log.amount}` : String(log.amount ?? "")}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold">{log.reason}</p>
                                        <p className="text-[8px] opacity-30">
                                            {log.timestamp?.toDate?.().toLocaleDateString("ar-EG")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[9px] opacity-40 font-black">الرصيد الكلي</span>
                        <div className="flex items-center gap-2 text-amber-500">
                            <Coins className="w-4 h-4" />
                            <span className="text-xl font-black">{userData?.totalPoints || 0}</span>
                        </div>
                    </div>
                </GlassCard>

                <div className="space-y-4 pt-4">
                    <h4 className="text-sm font-black flex items-center gap-2 px-2">
                        <Trophy className="w-4 h-4 text-amber-500" /> فرسان السنة (المتصدرون)
                    </h4>
                    <div className="space-y-3">
                        {leaderboard.map((student, idx) => (
                            <div
                                key={student.id}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                                    student.id === user?.uid
                                        ? "bg-primary/10 border-primary/20"
                                        : "bg-white/5 border-white/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs",
                                            idx === 0
                                                ? "bg-amber-500 text-white"
                                                : idx === 1
                                                  ? "bg-slate-300 text-slate-700"
                                                  : idx === 2
                                                    ? "bg-amber-700 text-white"
                                                    : "bg-white/10 text-white"
                                        )}
                                    >
                                        {idx + 1}
                                    </div>
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                                        {student.photoURL ? (
                                            <img src={student.photoURL} alt="" />
                                        ) : (
                                            <UserIcon className="w-full h-full p-2 opacity-20" />
                                        )}
                                    </div>
                                    <span className="text-xs font-bold truncate max-w-[100px]">{student.displayName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px]">
                                    <Star className="w-3 h-3 fill-current" />
                                    {student.totalPoints || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
