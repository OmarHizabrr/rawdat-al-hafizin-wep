"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
    BookOpen, 
    Target, 
    Compass, 
    Library, 
    Star, 
    Users, 
    Sprout,
    CheckCircle2,
    BookMarked,
    GraduationCap,
    Lightbulb,
    ScrollText,
    Award,
    Bookmark,
    Layout
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const stages = [
    { title: "الجمع بين الصحيحين", count: "أربع مجلدات", icon: ScrollText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "مفردات البخاري", count: "مجلد واحد", icon: Bookmark, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "مفردات مسلم", count: "مجلد واحد", icon: Bookmark, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "زوائد أبي داود", count: "مجلدان", icon: BookMarked, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { title: "زوائد الترمذي", count: "مجلد واحد", icon: BookMarked, color: "text-teal-500", bg: "bg-teal-500/10" },
    { title: "زوائد النسائي وابن ماجه", count: "مجلد واحد", icon: BookMarked, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "المسانيد", count: "مجلدات متعددة", icon: Library, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "الصحاح والمعاجم", count: "مجلدات متعددة", icon: Library, color: "text-orange-500", bg: "bg-orange-500/10" },
];

export default function AboutProgram() {
    const { user, userData } = useAuth();

    // Determine target dashboard based on role
    const getDashboardUrl = () => {
        if (!userData) return "/";
        const role = userData.role;
        if (role === 'admin' || role === 'committee') return "/admin";
        if (role === 'teacher') return "/teachers";
        if (role === 'student' || role === 'applicant') return "/students";
        return "/";
    };

    return (
        <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="space-y-20 pb-20 overflow-hidden bg-[#030712]"
        >
            {/* Hero Section */}
            <section className="relative text-center pt-16 pb-12 md:pt-24 md:pb-20 px-6">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[100px] rounded-full" />
                </div>
                
                <motion.div variants={item} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary font-black text-[9px] uppercase tracking-[0.2em] mb-8 border border-primary/20 backdrop-blur-md">
                    <Award className="w-3.5 h-3.5" />
                    <span>برنامج السنة النبوية الشامل</span>
                </motion.div>

                <motion.h1 variants={item} className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-8 leading-[1.1] py-2">
                    بوابتك لضبط <br />
                    <span className="bg-gradient-to-r from-primary via-purple-500 to-emerald-500 bg-clip-text text-transparent animate-gradient-x drop-shadow-xl">ميراث النبوة</span>
                </motion.h1>

                <motion.p variants={item} className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-medium px-4 opacity-70">
                    هو برنامج علمي متكامل يُعنى بحفظ أحاديث السنة النبوية وفق منهجٍ متدرّج، يبدأ بأصح كتب السنة، ثم يتوسّع ليشمل بقية دواوين الحديث.
                </motion.p>
                
                <motion.div variants={item} className="flex justify-center flex-wrap gap-4">
                    {user ? (
                        <Link href={getDashboardUrl()}>
                            <GlassCard className="px-6 py-4 border-primary/10 bg-primary/5 flex items-center gap-4 group hover:scale-[1.02] transition-all cursor-pointer rounded-2xl">
                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">أهلاً بك مجدداً</p>
                                    <p className="font-black text-lg">لوحتك الخاصة</p>
                                </div>
                            </GlassCard>
                        </Link>
                    ) : (
                        <GlassCard className="px-6 py-4 border-primary/10 bg-primary/5 flex items-center gap-4 group hover:scale-[1.02] transition-transform rounded-2xl">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">إشراف وجمع</p>
                                <p className="font-black text-lg">الشيخ يحيى اليحيى</p>
                            </div>
                        </GlassCard>
                    )}
                </motion.div>
            </section>

            {/* Core Pillars */}
            <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-8 items-stretch">
                <div className="md:col-span-12 text-center mb-8 space-y-3">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">أركان البرنامج الأساسية</h2>
                    <p className="text-muted-foreground font-medium text-sm md:text-base opacity-60">القيم الجوهرية التي يقوم عليها مسار الحفظ</p>
                </div>

                <div className="md:col-span-7 space-y-4">
                    {[
                        { title: "العناية بالسنة النبوية", desc: "ربط الجيل بحديث النبي ﷺ وتوثيق صلته بالميراث النبوي الشريف.", icon: CheckCircle2 },
                        { title: "التمكين العلمي", desc: "بناء ملكة علمية تمكن الطالب من ضبط أمهات كتب الحديث.", icon: Target },
                        { title: "التخلق بالهدي", desc: "أن يكون الحفظ بوابةً للعمل والتأسي بأخلاق النبي ﷺ.", icon: Sprout },
                    ].map((p, i) => (
                        <motion.div 
                            key={i} 
                            variants={item}
                            className="flex gap-4 p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-primary/10 transition-all group items-center"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-105 transition-transform">
                                <p.icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black tracking-tight">{p.title}</h3>
                                <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed font-bold opacity-60">{p.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="md:col-span-5">
                    <GlassCard className="p-8 bg-primary/5 border-primary/10 h-full relative overflow-hidden group flex flex-col justify-center rounded-2xl min-h-[300px]">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent" />
                        
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <ScrollText className="w-6 h-6 text-white" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    رسالة البرنامج
                                </h2>
                                <p className="text-2xl font-black leading-snug !bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic">
                                    "نسعى لتخريج جيل متصل بالسنة النبوية، يتمثل أخلاقها سراً وعلانية."
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </section>

            {/* Methodology Timeline */}
            <section className="bg-white/5 py-16 md:py-24 relative group">
                <div className="absolute inset-0 bg-primary/5 backdrop-blur-3xl -z-10" />
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-3">
                        <div className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-2">
                            <Compass className="w-4 h-4" />
                            المنهجية العلمية
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight">كيف نحفظ السنة؟</h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed opacity-60">تعتمد منهجية الروضة على استراتيجيات دقيقة تضمن رسوخ الحفظ وسهولة الضبط.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "التدرج النوعي", desc: "بدءاً من الصحيحين لضمان بناء تراكمي قوي.", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { title: "حذف التكرار", desc: "التركيز على الروايات الجامعة دون تكرار الحوادث.", icon: Library, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { title: "تيسير الأسانيد", desc: "الحفظ لمتون الأحاديث مع الاكتفاء براوي الحديث.", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        ].map((m, i) => (
                            <div key={i} className="text-center space-y-6 p-8 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-primary/20 transition-all hover:-translate-y-1">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner", m.bg, m.color)}>
                                    <m.icon className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black">{m.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-bold opacity-60">{m.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Program Levels / Stages */}
            <section className="max-w-7xl mx-auto px-6 space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent pb-1 tracking-tight">مستويات رحلة الحفظ</h2>
                    <p className="text-sm md:text-base text-muted-foreground font-black uppercase tracking-widest opacity-40">ثمانية مراحل ذهبية لإتقان دواوين الحديث</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stages.map((stage, index) => (
                        <GlassCard key={index} className="p-6 group hover:border-primary/40 transition-all hover:shadow-xl relative overflow-hidden bg-white/[0.01] rounded-2xl">
                            {/* Level Number Watermark */}
                            <div className="absolute -bottom-4 -right-4 text-7xl font-black text-primary/5 select-none transition-all group-hover:text-primary/10 group-hover:-translate-y-2">
                                {index + 1}
                            </div>
                            
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all group-hover:scale-105 group-hover:rotate-6", stage.bg, stage.color)}>
                                    <stage.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl mb-1 tracking-tight group-hover:text-primary transition-colors">{stage.title}</h3>
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", stage.color)}>{stage.count}</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-6xl mx-auto px-6">
                <GlassCard className="p-12 md:p-16 bg-gradient-to-r from-primary via-primary/95 to-purple-700 text-white border-none shadow-2xl text-center rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">ابدأ رحلتك مع <br /> ميراث النبوة اليوم</h2>
                            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto font-medium leading-relaxed opacity-90 px-4">
                                كن ممن اصطفاهم الله لحمل سنة نبيه ﷺ، التسجيل متاح الآن لكل طالب علم طموح.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/register" className="px-8 py-4 bg-white text-primary font-black text-lg rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                سجل الآن في البرنامج
                            </Link>
                            <Link href="/" className="px-8 py-4 bg-black/10 text-white border border-white/10 font-black text-lg rounded-xl backdrop-blur-md hover:bg-black/20 transition-all active:scale-95">
                                العودة للرئيسية
                            </Link>
                        </div>
                    </div>
                </GlassCard>
            </section>

            <footer className="text-center opacity-40 py-10">
                <p className="text-xs font-black uppercase tracking-[0.3em]">تحت إشراف اللجنة العلمية لبرنامج تحفيظ السنة</p>
            </footer>
        </motion.div>
    );
}
