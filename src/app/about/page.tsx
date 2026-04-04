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
    Bookmark
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    return (
        <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="space-y-32 pb-32 overflow-hidden bg-background"
        >
            {/* Hero Section */}
            <section className="relative text-center pt-24 pb-20 md:pt-32 md:pb-32 px-6">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full" />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                </div>
                
                <motion.div variants={item} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-10 border border-primary/20 backdrop-blur-md">
                    <Award className="w-4 h-4" />
                    <span>برنامج السنة النبوية الشامل</span>
                </motion.div>

                <motion.h1 variants={item} className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] py-2">
                    التعريف ببرنامج <br />
                    <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent animate-gradient-x">تحفيظ السنة النبوية</span>
                </motion.h1>

                <motion.p variants={item} className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-16 leading-relaxed font-medium px-4 opacity-80">
                    هو برنامج علمي متكامل يُعنى بحفظ أحاديث السنة النبوية وفق منهجٍ متدرّج، يبدأ بأصح كتب السنة، ثم يتوسّع ليشمل بقية دواوين الحديث، ليكون الحافظ على صلةٍ مباشرة بأكبر قدر ممكن من كلام النبي ﷺ.
                </motion.p>
                
                <motion.div variants={item} className="flex justify-center flex-wrap gap-6">
                    <GlassCard className="px-10 py-6 border-primary/20 bg-primary/5 flex items-center gap-5 group hover:scale-[1.02] transition-transform">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                            <Users className="w-7 h-7 text-primary" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">إشراف وجمع</p>
                            <p className="font-black text-xl">الشيخ يحيى اليحيى</p>
                        </div>
                    </GlassCard>
                </motion.div>
            </section>

            {/* Core Pillars */}
            <section className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-start">
                <div className="lg:col-span-12 text-center mb-10 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black">أركان البرنامج</h2>
                    <p className="text-muted-foreground font-medium text-lg">القيم الجوهرية التي يقوم عليها مسار الحفظ</p>
                </div>

                <div className="lg:col-span-7 space-y-8">
                    {[
                        { title: "العناية بالسنة النبوية", desc: "ربط الجيل بحديث النبي ﷺ وتوثيق صلته بالميراث النبوي الشريف.", icon: CheckCircle2 },
                        { title: "التمكين العلمي", desc: "بناء ملكة علمية تمكن الطالب من ضبط أكبر قدر ممكن من الأحاديث الصحيحة.", icon: Target },
                        { title: "التخلق بالهدي", desc: "أن يكون الحفظ بوابةً للعمل والتأسي بأخلاق النبي ﷺ في كافة شؤون الحياة.", icon: Sprout },
                    ].map((p, i) => (
                        <motion.div 
                            key={i} 
                            variants={item}
                            className="flex gap-6 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-110 transition-transform">
                                <p.icon className="w-8 h-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black tracking-tight">{p.title}</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">{p.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="lg:col-span-5 h-full">
                    <GlassCard className="p-12 bg-primary/5 border-primary/10 h-full relative overflow-hidden group flex flex-col justify-center min-h-[400px]">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-none" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-colors" />
                        
                        <div className="relative z-10 space-y-10">
                            <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
                                <ScrollText className="w-8 h-8 text-white" />
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    رسالة البرنامج
                                </h2>
                                <p className="text-3xl font-black leading-snug !bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                                    "نسعى لتخريج جيل متصل بالسنة النبوية، يتمثل أخلاقها سراً وعلانية، ويكون نبراساً للهدي المحمدي."
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </section>

            {/* Methodology Timeline */}
            <section className="bg-white/5 py-32 relative group">
                <div className="absolute inset-0 bg-primary/5 backdrop-blur-3xl -z-10" />
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24 space-y-4">
                        <div className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-4">
                            <Compass className="w-5 h-5" />
                            المنهجية العلمية
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black">كيف نحفظ السنة؟</h2>
                        <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed opacity-60">تعتمد منهجية الروضة على استراتيجيات دقيقة تضمن رسوخ الحفظ وسهولة الضبط.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { title: "التدرج النوعي", desc: "بدءاً من الصحيحين ثم الزوائد، لضمان بناء تراكمي قوي.", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { title: "حذف التكرار", desc: "التركيز على الروايات الجامعة والشاملة دون تكرار الحوادث.", icon: Library, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { title: "تيسير الأسانيد", desc: "الحفظ لمتون الأحاديث مع الاكتفاء براوي الحديث الصحابي لسهولة الضبط.", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        ].map((m, i) => (
                            <div key={i} className="text-center space-y-8 p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:border-primary/30 transition-all hover:-translate-y-2">
                                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner", m.bg, m.color)}>
                                    <m.icon className="w-10 h-10" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black">{m.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed font-bold opacity-70">{m.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Program Levels / Stages */}
            <section className="max-w-7xl mx-auto px-6 space-y-20">
                <div className="text-center space-y-6">
                    <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent pb-3">مستويات رحلة الحفظ</h2>
                    <p className="text-xl text-muted-foreground font-black uppercase tracking-widest opacity-40">ثمانية مراحل ذهبية لإتقان دواوين السنة</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stages.map((stage, index) => (
                        <GlassCard key={index} className="p-8 group hover:border-primary/50 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden bg-white/[0.01]">
                            {/* Level Number Watermark */}
                            <div className="absolute -bottom-6 -right-6 text-9xl font-black text-primary/5 select-none transition-all group-hover:text-primary/10 group-hover:-translate-y-4">
                                {index + 1}
                            </div>
                            
                            <div className="flex flex-col gap-8 relative z-10">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-all group-hover:scale-110 group-hover:rotate-6", stage.bg, stage.color)}>
                                    <stage.icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl mb-2 tracking-tight group-hover:text-primary transition-colors">{stage.title}</h3>
                                    <p className={cn("text-xs font-black uppercase tracking-widest opacity-60", stage.color)}>{stage.count}</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-6xl mx-auto px-6">
                <GlassCard className="p-16 md:p-24 bg-gradient-to-r from-primary via-primary/90 to-purple-600 text-white border-none shadow-3xl text-center rounded-[4rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                    <div className="relative z-10 space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-7xl font-black leading-tight">ابدأ رحلتك مع <br /> ميراث النبوة اليوم</h2>
                            <p className="text-xl text-white/80 max-w-3xl mx-auto font-medium leading-relaxed">
                                كن ممن اصطفاهم الله لحمل سنة نبيه ﷺ وضبط مسائله، التسجيل مفتوح لجميع المخلصين.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <Link href="/register" className="px-12 py-5 bg-white text-primary font-black text-xl rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                سجل الآن في البرنامج
                            </Link>
                            <Link href="/" className="px-12 py-5 bg-black/20 text-white border border-white/20 font-black text-xl rounded-2xl backdrop-blur-md hover:bg-black/30 transition-all">
                                الواجهة الرئيسية
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
