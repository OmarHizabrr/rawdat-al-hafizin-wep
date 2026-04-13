"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, HelpCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface EliteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    loading?: boolean;
}

export function EliteDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "تأكيد",
    cancelText = "إلغاء",
    type = 'info',
    loading = false
}: EliteDialogProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const getTypeStyles = () => {
        switch (type) {
            case 'danger': return { icon: <AlertCircle className="w-8 h-8" />, color: 'text-red-500', bg: 'bg-red-500/10', button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20' };
            case 'warning': return { icon: <AlertTriangle className="w-8 h-8" />, color: 'text-orange-500', bg: 'bg-orange-500/10', button: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' };
            case 'success': return { icon: <CheckCircle2 className="w-8 h-8" />, color: 'text-green-500', bg: 'bg-green-500/10', button: 'bg-green-500 hover:bg-green-600 shadow-green-500/20' };
            default: return { icon: <HelpCircle className="w-8 h-8" />, color: 'text-primary', bg: 'bg-primary/10', button: 'bg-primary hover:bg-primary/90 shadow-primary/20' };
        }
    };

    const styles = getTypeStyles();

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        aria-hidden
                    />

                    <motion.div
                        initial={{ scale: 0.94, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 12 }}
                        className="relative z-10 flex max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full max-w-sm min-h-0 flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-background/90 shadow-2xl backdrop-blur-xl dark:border-white/5 dark:bg-gray-900/90 sm:rounded-[2rem]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 pb-4 text-center sm:p-8">
                            <motion.div
                                initial={{ rotate: -15, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", damping: 10 }}
                                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl shadow-inner sm:mb-6 sm:h-20 sm:w-20 ${styles.bg} ${styles.color}`}
                            >
                                {styles.icon}
                            </motion.div>

                            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
                            <div className="max-h-[min(40dvh,240px)] overflow-y-auto overscroll-contain px-1 text-start sm:text-center">
                                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 bg-muted/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-white/5 sm:flex-row sm:gap-3 sm:p-6 sm:pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="min-h-12 flex-1 rounded-2xl px-4 py-3 font-bold transition-all hover:bg-muted disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={loading}
                                className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-white shadow-lg transition-all disabled:opacity-50 ${styles.button}`}
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span>{confirmText}</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute end-3 top-3 rounded-full p-2 opacity-50 transition-colors hover:bg-muted hover:opacity-100"
                            aria-label="إغلاق"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
