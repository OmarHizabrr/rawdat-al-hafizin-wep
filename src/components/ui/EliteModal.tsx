"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    
                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "bg-background/80 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/10 rounded-[1.2rem] shadow-2xl w-full relative z-10 overflow-hidden flex flex-col max-h-[90vh]",
                            maxWidthClasses[maxWidth]
                        )}
                    >
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg md:text-xl font-black tracking-tight">{title}</h3>
                                {description && <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{description}</p>}
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90 duration-300"
                            >
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="p-4 md:p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
