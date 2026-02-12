"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <GlassCard className="max-w-md w-full text-center p-12 border-red-500/20 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-xl">
                    <div className="relative mb-6 inline-block">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                        <AlertTriangle className="w-20 h-20 text-red-500 relative z-10" />
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
                        حدث خطأ غير متوقع!
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        نعتذر عن هذا الخلل. فريقنا يعمل على حله. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={reset}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold shadow-lg shadow-red-500/25"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            <span>محاولة مرة أخرى</span>
                        </button>
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-white/10 text-foreground border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            <span>العودة للرئيسية</span>
                        </Link>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
