"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileQuestion, Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <GlassCard className="max-w-md w-full text-center p-12 border-primary/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
                    <div className="relative mb-8 inline-block">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                        <FileQuestion className="w-24 h-24 text-primary relative z-10" />
                    </div>

                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                        الصفحة غير موجودة
                    </h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                        عذراً، الصفحة التي تحاول الوصول إليها قد تكون حذفت أو تم تغيير رابطها.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1"
                    >
                        <Home className="w-5 h-5" />
                        <span>العودة للرئيسية</span>
                    </Link>
                </GlassCard>
            </motion.div>
        </div>
    );
}
