"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileQuestion, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                <GlassCard className="w-full max-w-md p-10 text-center">
                    <div className="relative mb-6 inline-block">
                        <FileQuestion className="relative z-10 h-20 w-20 text-primary" />
                    </div>

                    <h1 className="mb-2 text-4xl font-semibold text-primary">404</h1>
                    <h2 className="mb-3 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
                    <p className="mb-8 text-muted-foreground">
                        عذراً، الصفحة التي تحاول الوصول إليها قد تكون حُذفت أو تغيّر رابطها.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                        <Home className="h-5 w-5" />
                        العودة للرئيسية
                    </Link>
                </GlassCard>
            </motion.div>
        </div>
    );
}
