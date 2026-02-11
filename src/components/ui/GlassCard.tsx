"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}

export function GlassCard({
    children,
    className,
    gradient = false,
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl",
                "dark:border-white/10 dark:bg-black/20",
                gradient &&
                "bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/0",
                className
            )}
            {...props}
        >
            {/* Dynamic Shine Effect */}
            <div className="pointer-events-none absolute -inset-[100%] z-0 block h-[200%] w-[200%] rotate-45 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-white/5" />

            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
