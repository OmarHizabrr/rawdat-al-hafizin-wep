"use client";

import { motion } from "framer-motion";
import {
    Clock,
    CheckCircle,
    Search,
    Sparkles,
    Settings,
} from "lucide-react";
import type { User } from "firebase/auth";
import { GlassCard } from "@/components/ui/GlassCard";

type Props = {
    user: User | null;
    onOpenProfile: () => void;
    onSignOut: () => void;
};

export function ApplicantPendingView({ user, onOpenProfile, onSignOut }: Props) {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                <GlassCard className="p-12 text-center space-y-8 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                    <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-primary/10 animate-pulse">
                        <Clock className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black tracking-tight">طلبك قيد المراجعة العلمية</h1>
                        <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                            أهلاً بك يا{" "}
                            <span className="text-primary font-bold">{user?.displayName || "طالب العلم"}</span>. لقد
                            استلمنا بياناتك بنجاح، ويقوم أعضاء اللجنة العلمية حالياً بمراجعة طلب التحاقك بالمنصة.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 pt-8">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                            <CheckCircle className="text-green-500 mx-auto w-6 h-6" />
                            <p className="text-xs font-black uppercase tracking-widest">اكتمال الملف</p>
                            <p className="text-[10px] opacity-60">تم استلام البيانات</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                            <Search className="text-primary mx-auto w-6 h-6 animate-bounce" />
                            <p className="text-xs font-black uppercase tracking-widest">المراجعة العلمية</p>
                            <p className="text-[10px] text-primary">جاري التحقق من الطلب</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 opacity-30 space-y-2">
                            <Sparkles className="mx-auto w-6 h-6" />
                            <p className="text-xs font-black uppercase tracking-widest">تفعيل الحساب</p>
                            <p className="text-[10px]">بدء الرحلة العلمية</p>
                        </div>
                    </div>
                    <div className="pt-8">
                        <p className="text-sm text-muted-foreground italic font-medium">
                            {`"سيتم إشعارك فور قبول طلبك، نسأل الله لك التوفيق والسداد."`}
                        </p>
                    </div>
                </GlassCard>
                <button
                    type="button"
                    onClick={onOpenProfile}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black transition-all flex items-center justify-center gap-3"
                >
                    <Settings className="w-5 h-5 opacity-50" /> مراجعة بيانات الملف الشخصي
                </button>
                <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full py-4 text-red-500 font-bold hover:underline opacity-60"
                >
                    تسجيل الخروج
                </button>
            </motion.div>
        </div>
    );
}
