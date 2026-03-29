"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, HelpCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

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
    
    const getTypeStyles = () => {
        switch (type) {
            case 'danger': return { icon: <AlertCircle className="w-8 h-8" />, color: 'text-red-500', bg: 'bg-red-500/10', button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20' };
            case 'warning': return { icon: <AlertTriangle className="w-8 h-8" />, color: 'text-orange-500', bg: 'bg-orange-500/10', button: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' };
            case 'success': return { icon: <CheckCircle2 className="w-8 h-8" />, color: 'text-green-500', bg: 'bg-green-500/10', button: 'bg-green-500 hover:bg-green-600 shadow-green-500/20' };
            default: return { icon: <HelpCircle className="w-8 h-8" />, color: 'text-primary', bg: 'bg-primary/10', button: 'bg-primary hover:bg-primary/90 shadow-primary/20' };
        }
    };

    const styles = getTypeStyles();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    
                    {/* Dialog */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-background/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden"
                    >
                        <div className="p-8 text-center space-y-4">
                            {/* Animated Icon Container */}
                            <motion.div 
                                initial={{ rotate: -15, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", damping: 10 }}
                                className={`w-20 h-20 rounded-3xl ${styles.bg} ${styles.color} flex items-center justify-center mx-auto mb-6 shadow-inner`}
                            >
                                {styles.icon}
                            </motion.div>

                            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                {description}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="p-6 pt-0 bg-gray-50/50 dark:bg-white/5 flex gap-3">
                            <button 
                                onClick={onClose} 
                                disabled={loading}
                                className="flex-1 px-4 py-4 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl font-bold transition-all disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button 
                                onClick={onConfirm} 
                                disabled={loading}
                                className={`flex-1 px-4 py-4 ${styles.button} text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`}
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{confirmText}</span>
                            </button>
                        </div>

                        {/* Close button top-right */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
