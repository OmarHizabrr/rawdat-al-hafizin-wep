"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    /** @deprecated Use default surface. Glass = blur + strong shadow (legacy marketing style). */
    variant?: "surface" | "glass";
    gradient?: boolean;
}

export function GlassCard({
    children,
    className,
    variant = "surface",
    gradient = false,
    ...props
}: GlassCardProps) {
    const isGlass = variant === "glass";

    return (
        <motion.div
            initial={isGlass ? { opacity: 0, scale: 0.98, y: 10 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: isGlass ? 0.35 : 0.2, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden text-card-foreground",
                isGlass
                    ? "rounded-[1rem] md:rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 md:p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-white/5 dark:bg-black/40 card-shine"
                    : "rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm",
                gradient &&
                    isGlass &&
                    "bg-gradient-to-br from-white/[0.08] via-transparent to-transparent",
                className
            )}
            {...props}
        >
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
