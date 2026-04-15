"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Radio, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { RecitationSessionRow } from "../_lib/student-dashboard-types";

type Props = {
    sessions: RecitationSessionRow[];
    onJoinSession: (session: RecitationSessionRow) => void;
};

export function StudentLiveSessionsSection({ sessions, onJoinSession }: Props) {
    return (
        <AnimatePresence>
            {sessions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 px-4 md:px-6">
                        <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                        <h3 className="text-xl font-black">تسميع مباشر الآن</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 md:gap-5">
                        {sessions.map((session) => (
                            <GlassCard
                                key={session.id}
                                className="flex-1 min-w-[280px] md:min-w-[320px] p-2.5 md:p-4 border-red-500/20 bg-red-500/5 relative group overflow-hidden rounded-xl"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="space-y-0.5">
                                        <div className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />{" "}
                                            {session.type === "video" ? "بث فيديو" : "صوتي مباشر"}
                                        </div>
                                        <h4 className="text-base font-black tracking-tight">{session.title}</h4>
                                        <p className="text-[9px] opacity-50">المبادر: {session.creatorName}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onJoinSession(session)}
                                        className="px-3.5 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                    >
                                        دخول <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
