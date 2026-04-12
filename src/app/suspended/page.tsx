"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldAlert, Headset, Lock, RefreshCcw, Loader2 } from "lucide-react";
import Link from "next/link";

function SuspendedContent() {
    const searchParams = useSearchParams();
    const customMessage = searchParams.get('message');
    const supportPhone = searchParams.get('phone') || "967777613709";

    const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent("مرحباً فريق الدعم، تم إيقاف حسابي وأحتاج إلى المساعدة في إعادة تفعيله.")}`;

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-lg space-y-8 border-destructive/30 p-8 text-center">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
                        <div className="w-24 h-24 bg-red-500 rounded-full" />
                    </div>
                    <div className="relative w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldAlert className="w-10 h-10" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        تم إيقاف حسابك
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        {customMessage || "تم إيقاف حسابك مؤقتاً من قبل الإدارة. لا يمكنك الوصول إلى التطبيق حالياً. يرجى التواصل مع فريق الدعم للمزيد من المعلومات."}
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 text-left space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                        <Lock className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                        <span className="text-muted-foreground">تم إيقاف الصلاحيات مؤقتاً</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                        <Headset className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                        <span className="text-muted-foreground">يمكنك التواصل مع الدعم الفني</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                        <RefreshCcw className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                        <span className="text-muted-foreground">سيتم إعادة التفعيل بعد المراجعة</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        href={whatsappUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full p-4 bg-[#25D366] text-white rounded-xl hover:bg-[#20bd5a] transition-colors font-bold shadow-lg shadow-green-500/20"
                    >
                        <Headset className="w-5 h-5" />
                        <span>التواصل مع فريق الدعم</span>
                    </Link>

                    <Link
                        href="/"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        العودة للصفحة الرئيسية
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}

export default function AccountSuspendedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <SuspendedContent />
        </Suspense>
    );
}
