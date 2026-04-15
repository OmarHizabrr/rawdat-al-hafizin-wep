"use client";

import { motion } from "framer-motion";
import {
    User as UserIcon,
    Settings,
    Trophy,
    Flame,
    Target,
} from "lucide-react";
import type { User } from "firebase/auth";
import { ActivityChart } from "@/components/students/ActivityChart";
import { NotificationBellLink } from "@/components/layout/NotificationBellLink";
import { cn } from "@/lib/utils";
import type { UserDocument } from "@/lib/user-document";
import { getLevelInfo } from "../_lib/student-dashboard-types";

type Props = {
    user: User | null;
    userData: UserDocument | null;
    lastWeekLogs: Record<string, unknown>[];
    onProfile: () => void;
    onSettings: () => void;
};

export function StudentDashboardHero({ user, userData, lastWeekLogs, onProfile, onSettings }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 bg-white/5 border border-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden card-shine"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full -ml-32 -mb-32" />

            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-10 w-full lg:w-auto">
                <div className="relative group mx-auto md:mx-0">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-gradient-to-br from-primary via-primary/80 to-purple-600 p-[2px] shadow-2xl shadow-primary/20 transition-all duration-500"
                    >
                        <div className="w-full h-full rounded-[0.9rem] md:rounded-[1.3rem] bg-[#0a0a0a] flex items-center justify-center overflow-hidden border-2 border-black/20">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-primary/30" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-1 -right-1 md:-bottom-1.5 md:-right-1.5 px-2.5 md:px-3 py-0.5 md:py-1 bg-amber-500 text-white text-[7px] md:text-xs font-black rounded-lg shadow-2xl border-2 border-[#0a0a0a] flex items-center gap-1"
                    >
                        <Trophy className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current animate-pulse" />
                        <span>{userData?.totalPoints || 0} XP</span>
                    </motion.div>
                </div>

                <div className="text-center md:text-right space-y-2">
                    <div className="space-y-0.5">
                        <h1 className="text-xl md:text-2xl font-black tracking-tight flex flex-col md:flex-row items-center gap-2.5 text-white">
                            {user?.displayName || "طالب العلم"}
                            <span
                                className={cn(
                                    "px-3 py-0.5 text-[7px] md:text-[9px] font-black rounded-full border border-current/10 uppercase tracking-[0.15em] shadow-xl backdrop-blur-md",
                                    getLevelInfo(userData?.totalPoints || 0).bg,
                                    getLevelInfo(userData?.totalPoints || 0).color
                                )}
                            >
                                {getLevelInfo(userData?.totalPoints || 0).label}
                            </span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                        <div className="flex items-center gap-2 text-orange-500 font-black text-[9px] md:text-xs px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-lg shadow-orange-500/5">
                            <Flame className="w-3.5 h-3.5 animate-bounce" />
                            <span>الالتزام: {Number(userData?.streak) || 0} يوم</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black opacity-60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-widest">
                            <Target className="w-3 h-3 text-primary" />
                            <span>المستوى {getLevelInfo(userData?.totalPoints || 0).rank} / 4</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner group transition-all hover:bg-white/10">
                    <ActivityChart logs={lastWeekLogs} />
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBellLink className="h-11 w-11 border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/30 text-muted-foreground hover:text-primary" />
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onProfile}
                        className="p-3.5 bg-white/5 hover:bg-primary/20 rounded-xl transition-all border border-white/10 hover:border-primary/30 group shadow-2xl relative"
                    >
                        <UserIcon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSettings}
                        className="p-3.5 bg-white/5 hover:bg-primary/20 rounded-xl transition-all border border-white/10 hover:border-primary/30 group shadow-2xl relative"
                    >
                        <Settings className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
