"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface EliteModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
    footer?: React.ReactNode;
}

const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
};

export function EliteModal({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidth = "lg",
    footer
}: EliteModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Prevent scroll on body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
                    role="presentation"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        aria-hidden
                    />

                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 16 }}
                        transition={{ type: "spring", damping: 26, stiffness: 320 }}
                        className={cn(
                            "relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full min-h-0 flex-col overflow-hidden rounded-t-[1.2rem] border border-white/10 bg-background/90 shadow-2xl backdrop-blur-2xl dark:bg-gray-900/95 sm:max-h-[min(88dvh,calc(100dvh-2rem))] sm:rounded-[1.2rem]",
                            maxWidthClasses[maxWidth]
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/5 p-4 md:p-6">
                            <div className="min-w-0 flex-1 space-y-1 pe-2">
                                <h3 className="text-lg font-black tracking-tight md:text-xl">{title}</h3>
                                {description && (
                                    <p className="text-[10px] font-medium text-muted-foreground md:text-xs">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="shrink-0 rounded-xl p-2 transition-all duration-300 hover:rotate-90 hover:bg-white/10"
                            >
                                <X className="h-5 w-5 md:h-6 md:w-6" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 custom-scrollbar">
                            {children}
                        </div>

                        {footer && (
                            <div className="flex shrink-0 flex-col gap-2 border-t border-white/5 bg-white/[0.02] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:flex-wrap sm:gap-3 md:p-6">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
