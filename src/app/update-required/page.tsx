"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Monitor, Download, Headset, ShieldCheck, Zap, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function UpdateRequiredContent() {
    const searchParams = useSearchParams();
    const updateUrl = searchParams.get('url') || "#";
    const customMessage = searchParams.get('message');
    const currentVersion = searchParams.get('current');
    const requiredVersion = searchParams.get('required');
    const supportPhone = searchParams.get('phone') || "967777613709";

    const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent("مرحباً فريق الدعم، أحتاج رابط التحديث الجديد.")}`;

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-md space-y-6 border-amber-500/40 p-6 text-center">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-10">
                        <div className="w-16 h-16 bg-yellow-500 rounded-full" />
                    </div>
                    <div className="relative w-14 h-14 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto text-yellow-500 shadow-inner">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-xl font-semibold text-foreground md:text-2xl">
                        تحديث ضروري للمتابعة
                    </h1>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed px-4 opacity-70">
                        {customMessage || "إصدار التطبيق لديك أصبح قديماً. لضمان أفضل تجربة وحماية لبياناتك، يرجى تحديث التطبيق الآن."}
                    </p>

                    {(currentVersion || requiredVersion) && (
                        <div className="flex items-center justify-center gap-3 text-[10px] font-mono bg-gray-50 dark:bg-white/5 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                            {currentVersion && <span className="opacity-50">v{currentVersion}</span>}
                            <ArrowRight className="w-3 h-3 opacity-20" />
                            {requiredVersion && <span className="text-primary font-bold">New: v{requiredVersion}</span>}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2 text-left">
                    <FeatureItem icon={ShieldCheck} title="حماية رقمية متطورة" desc="تحديثات أمنية هامة لحماية بياناتك" />
                    <FeatureItem icon={Sparkles} title="مميزات حصرية" desc="استمتع بأحدث التحسينات المضافة" />
                </div>

                <div className="space-y-2 pt-2">
                    <Link
                        href={updateUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-black text-xs shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" />
                        <span>تحديث التطبيق الآن</span>
                    </Link>

                    <Link
                        href={whatsappUrl}
                        target="_blank"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <Headset className="w-4 h-4" />
                        <span>طلب مساعدة تقنية</span>
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <h3 className="text-xs font-medium text-foreground">{title}</h3>
                <p className="text-[9px] text-muted-foreground opacity-60">{desc}</p>
            </div>
        </div>
    );
}

export default function UpdateRequiredPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <UpdateRequiredContent />
        </Suspense>
    );
}
