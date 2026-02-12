"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Monitor, Download, Headset, ShieldCheck, Zap, Sparkles, Loader2 } from "lucide-react";
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
            <GlassCard className="max-w-lg w-full text-center space-y-8 p-8 border-yellow-200 dark:border-yellow-900/50">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
                        <div className="w-24 h-24 bg-yellow-500 rounded-full" />
                    </div>
                    <div className="relative w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                        <Zap className="w-10 h-10 fill-current" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        تحديث ضروري للمتابعة
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        {customMessage || "إصدار التطبيق لديك أصبح قديماً. لضمان أفضل تجربة وحماية لبياناتك، يرجى تحديث التطبيق الآن."}
                    </p>

                    {(currentVersion || requiredVersion) && (
                        <div className="flex items-center justify-center gap-4 text-sm font-mono bg-gray-50 dark:bg-white/5 py-2 rounded-lg">
                            {currentVersion && <span>Current: v{currentVersion}</span>}
                            {requiredVersion && <span>Required: v{requiredVersion}</span>}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 text-left">
                    <FeatureItem icon={ShieldCheck} title="حماية أعلى" desc="تحديثات أمنية هامة لحماية بياناتك" />
                    <FeatureItem icon={Sparkles} title="ميزات جديدة" desc="استمتع بأحدث الميزات والتحسينات" />
                </div>

                <div className="space-y-3">
                    <Link
                        href={updateUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full p-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold shadow-lg shadow-primary/20"
                    >
                        <Download className="w-5 h-5" />
                        <span>تحديث التطبيق الآن</span>
                    </Link>

                    <Link
                        href={whatsappUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full p-4 bg-gray-100 dark:bg-white/10 text-foreground rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-medium"
                    >
                        <Headset className="w-5 h-5" />
                        <span>طلب رابط التحديث</span>
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
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
