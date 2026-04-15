"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Loader2, Sparkles, Star, Trophy, FileCheck } from "lucide-react";
import type { User } from "firebase/auth";
import { EliteModal } from "@/components/ui/EliteModal";
import { cn } from "@/lib/utils";
import type { SunnahVolume } from "@/lib/volumes";
import type { DialogConfig } from "../_lib/student-dashboard-types";

type Props = {
    user: User | null;
    dialogConfig: DialogConfig;
    onCloseDialog: () => void;
    isTestimonialModalOpen: boolean;
    onCloseTestimonialModal: () => void;
    newTestimonialContent: string;
    onTestimonialContentChange: (value: string) => void;
    isSubmittingTestimonial: boolean;
    onSubmitTestimonial: () => void;
    celebratedVolume: SunnahVolume | null;
    onDismissCelebration: () => void;
};

export function StudentDashboardModals({
    user,
    dialogConfig,
    onCloseDialog,
    isTestimonialModalOpen,
    onCloseTestimonialModal,
    newTestimonialContent,
    onTestimonialContentChange,
    isSubmittingTestimonial,
    onSubmitTestimonial,
    celebratedVolume,
    onDismissCelebration,
}: Props) {
    return (
        <>
            <EliteModal
                isOpen={dialogConfig.isOpen}
                onClose={onCloseDialog}
                title={dialogConfig.title}
                description={dialogConfig.description}
                maxWidth="sm"
                footer={
                    <button
                        type="button"
                        onClick={onCloseDialog}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm"
                    >
                        فهمت، استمرار
                    </button>
                }
            >
                <div className="flex flex-col items-center justify-center p-4">
                    <div
                        className={cn(
                            "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4 shadow-inner border",
                            dialogConfig.type === "success"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}
                    >
                        {dialogConfig.type === "success" ? (
                            <CheckCircle className="w-10 h-10" />
                        ) : (
                            <X className="w-10 h-10" />
                        )}
                    </div>
                </div>
            </EliteModal>

            <EliteModal
                isOpen={isTestimonialModalOpen}
                onClose={onCloseTestimonialModal}
                title="شارك تجربتك العلمية"
                description="كلماتك قد تكون نبراساً ينير الطريق لزملائك الجدد"
                maxWidth="lg"
                footer={
                    <button
                        type="button"
                        onClick={onSubmitTestimonial}
                        disabled={isSubmittingTestimonial || !newTestimonialContent.trim()}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-sm"
                    >
                        {isSubmittingTestimonial ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <Sparkles className="w-5 h-5" />
                        )}
                        نشر الخاطرة الآن
                    </button>
                }
            >
                <div className="p-2">
                    <textarea
                        value={newTestimonialContent}
                        onChange={(e) => onTestimonialContentChange(e.target.value)}
                        placeholder="ماذا وجدت في رحاب السنة؟ شاركنا أثر العلم في نفسك..."
                        className="w-full h-48 p-6 bg-white/5 rounded-[2rem] resize-none outline-none border border-white/10 focus:ring-8 focus:ring-primary/5 transition-all font-bold text-base leading-relaxed"
                    />
                </div>
            </EliteModal>

            <AnimatePresence>
                {celebratedVolume && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onDismissCelebration}
                            className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
                        />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            className="relative bg-background border border-amber-500/30 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl max-w-lg w-full text-center space-y-8 md:space-y-10 overflow-hidden group max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000" />

                            <div className="relative pt-4 md:pt-0">
                                <motion.div
                                    initial={{ rotate: -15, scale: 0.5 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", damping: 12 }}
                                    className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative z-10"
                                >
                                    <Trophy className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
                                </motion.div>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 rounded-full"
                                />
                            </div>

                            <div className="space-y-4 md:space-y-6 relative z-10">
                                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-amber-500 mb-2">
                                    مبارك الإتمام! ✨
                                </h2>
                                <p className="text-lg md:text-xl font-medium opacity-90 leading-relaxed">
                                    هنيئاً لك يا{" "}
                                    <span className="text-primary font-black underline decoration-amber-500/30 underline-offset-4 md:underline-offset-8 decoration-2 md:decoration-4">
                                        {user?.displayName || "طالب العلم"}
                                    </span>
                                    <br />
                                    إنجازك التام لـ{" "}
                                    <span className="text-amber-500 font-black">{celebratedVolume.title}</span>
                                </p>

                                <div className="flex justify-center gap-2 md:gap-3 py-4 md:py-6">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + i * 0.1 }}
                                        >
                                            <Star className="h-6 w-6 text-amber-500 fill-current drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] md:h-8 md:w-8" />
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner text-center md:text-right">
                                    <div>
                                        <p className="text-[10px] md:text-[10px] font-black uppercase text-amber-500 tracking-[0.1em] md:tracking-[0.2em] mb-1">
                                            إجمالي الصفحات التي ضُبطت
                                        </p>
                                        <p className="text-2xl md:text-3xl font-black tracking-tighter">
                                            {celebratedVolume.totalPages} صفحة
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl">
                                        <FileCheck className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 md:pt-4">
                                <button
                                    type="button"
                                    onClick={onDismissCelebration}
                                    className="w-full py-4 md:py-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl md:rounded-[2rem] font-black shadow-2xl shadow-amber-500/40 hover:scale-[1.03] active:scale-95 transition-all text-lg md:text-xl flex items-center justify-center gap-3"
                                >
                                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                                    تابِع مسير البركة
                                </button>
                                <p className="text-xs md:text-sm opacity-50 font-black tracking-wide italic">
                                    {`"فإذا فرغت فانصب وإلى ربك فارغب"`}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
