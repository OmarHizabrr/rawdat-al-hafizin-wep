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
    ChevronRight,
    ArrowRight,
    Search,
    BookMarked,
    GraduationCap,
    Lightbulb
} from "lucide-react";
import Link from "next/link";

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
    { title: "الجمع بين الصحيحين", count: "أربع مجلدات", icon: BookMarked },
    { title: "مفردات البخاري", count: "مجلد واحد", icon: Library },
    { title: "مفردات مسلم", count: "مجلد واحد", icon: Library },
    { title: "زوائد أبي داود", count: "مجلدان", icon: BookOpen },
    { title: "زوائد الترمذي", count: "مجلد واحد", icon: BookOpen },
    { title: "زوائد النسائي وابن ماجه والدارمي", count: "مجلد واحد", icon: BookOpen },
    { title: "المسانيد", count: "مجلدات متعددة", icon: Search },
    { title: "الصحاح والمعاجم", count: "مجلدات متعددة", icon: Compass },
];

const features = [
    { title: "أصح المصادر", desc: "الاعتماد على أصح مصادر السنة النبوية المعتمدة.", icon: Star },
    { title: "ترتيب متقن", desc: "ترتيب علمي متقن ومتدرّج يبدأ بالأهم ثم ما يليه.", icon: Compass },
    { title: "روايات جامعة", desc: "اعتماد الروايات الجامعة مع حذف التكرار والأسانيد لسهولة الحفظ.", icon: Library },
    { title: "مناسب للجميع", desc: "منهج مناسب لجميع طلاب العلم الراغبين في ضبط السنة.", icon: Users },
];

export default function AboutProgram() {
    return (
        <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="space-y-24 pb-20 overflow-hidden"
        >
            {/* Hero Section */}
            <section className="relative text-center pt-10 pb-16 md:pt-20 md:pb-24">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-full max-w-4xl mx-auto -z-10 rounded-full bg-primary/5 blur-3xl opacity-50" />
                
                <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-8 border border-primary/20">
                    <BookOpen className="w-4 h-4" />
                    <span>برنامج تحفيظ السنة النبوية</span>
                </motion.div>

                <motion.h1 variants={item} className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-6 leading-normal py-2 px-4">
                    التعريف ببرنامج <br />
                    <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">تحفيظ السنة النبوية</span>
                </motion.h1>

                <motion.p variants={item} className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed px-6">
                    هو برنامج علمي متكامل يُعنى بحفظ أحاديث السنة النبوية وفق منهجٍ متدرّج، يبدأ بأصح كتب السنة، ثم يتوسّع ليشمل بقية دواوين الحديث، مع اعتماد الجمع بين الروايات وحذف التكرار والأسانيد، ليكون الحافظ على صلةٍ مباشرة بأكبر قدر ممكن من كلام النبي ﷺ.
                </motion.p>
                
                <motion.div variants={item} className="flex justify-center gap-4">
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <p className="text-sm text-muted-foreground">إشراف وجمع</p>
                        <p className="font-bold text-lg">الشيخ يحيى بن عبد العزيز اليحيى</p>
                    </div>
                </motion.div>
            </section>

            {/* Goals & Mission */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto px-6">
                <motion.div variants={item} className="space-y-6">
                    <div className="flex items-center gap-3 text-primary mb-4 text-2xl font-bold">
                        <Target className="w-8 h-8" />
                        <h2>أهداف البرنامج</h2>
                    </div>
                    <ul className="space-y-4">
                        {[
                            "العناية بالسنة النبوية وتوثيق صلة الطلاب بها.",
                            "تمكين الطالب من حفظ أكبر قدر من الأحاديث الصحيحة.",
                        ].map((goal, i) => (
                            <li key={i} className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10 group hover:border-primary/30 transition-colors">
                                <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                                <span className="text-lg leading-relaxed">{goal}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div variants={item} className="space-y-6 flex flex-col justify-center">
                    <GlassCard className="p-10 border-primary/20 bg-primary/5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3 text-primary text-2xl font-bold">
                                <Sprout className="w-8 h-8" />
                                <h2>رسالة البرنامج</h2>
                            </div>
                            <p className="text-2xl font-extrabold leading-loose text-foreground/90">
                                الإسهام في تخريج جيلٍ مرتبطٍ بسنة النبي ﷺ، متمثلٍ لأخلاقها، وواعٍ لمقاصدها.
                            </p>
                        </div>
                    </GlassCard>
                </motion.div>
            </section>

            {/* Methodology Section */}
            <section className="bg-white/5 py-20 px-6 rounded-[2.5rem] border border-white/10 max-w-7xl mx-auto relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                
                <div className="relative z-10 text-center space-y-4 mb-16">
                    <motion.div variants={item} className="flex justify-center text-primary mb-2">
                        <Compass className="w-12 h-12" />
                    </motion.div>
                    <motion.h2 variants={item} className="text-3xl md:text-5xl font-bold">منهج البرنامج العلمي</motion.h2>
                    <motion.p variants={item} className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        يقوم البرنامج على التدرج العلمي من الأصح إلى ما دونه، مع جمع الأحاديث دون تكرار والتركيز على دواوين السنة المعتمدة، ويبدأ بالجمع بين الصحيحين ثم الانتقال إلى الزوائد وبقية كتب السنة.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "التدرج العلمي", desc: "الارتقاء بالطالب من الأصح (الصحيحين) إلى ما دونه في درجات الصحة.", icon: Lightbulb },
                        { title: "روايات جامعة", desc: "جمع الأحاديث دون تكرار قدر الإمكان مع حذف الأسانيد.", icon: BookOpen },
                        { title: "دواوين المعتمدة", desc: "التركيز على دواوين السنة المعتمدة (الكتب الستة والمسانيد والمعاجم).", icon: Target },
                    ].map((m, i) => (
                        <div key={i} className="text-center space-y-4 p-6 hover:translate-y-[-5px] transition-transform">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                                <m.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold">{m.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{m.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Program Stages */}
            <section className="space-y-16 px-6 max-w-7xl mx-auto">
                <div className="text-center space-y-4">
                    <motion.h2 variants={item} className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent py-2">مراحل البرنامج التدريبية</motion.h2>
                    <motion.p variants={item} className="text-lg text-muted-foreground">
                        يشمل البرنامج ثمانية مراحل رئيسية تغطي أصح كتب السنة.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stages.map((stage, index) => (
                        <GlassCard key={index} className="p-6 group hover:border-primary/50 transition-all hover:shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            <div className="flex flex-col gap-4">
                                <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                    <stage.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{stage.title}</h3>
                                    <p className="text-sm text-primary font-medium">{stage.count}</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Features & Target Audience */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto px-6 items-start">
                {/* Features */}
                <section className="space-y-10">
                    <div className="flex items-center gap-3 text-2xl font-bold">
                        <Star className="w-8 h-8 text-amber-500" />
                        <h2>مميزات البرنامج</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="space-y-3 p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="text-primary"><f.icon className="w-6 h-6" /></div>
                                <h3 className="font-bold">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Target Audience */}
                <section className="space-y-10">
                    <div className="flex items-center gap-3 text-2xl font-bold">
                        <Users className="w-8 h-8 text-blue-500" />
                        <h2>الفئة المستهدفة</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { title: "طلاب وطالبات العلم", desc: "طلاب وطالبات العلم الشرعي بمختلف تخصصاتهم.", icon: GraduationCap },
                            { title: "الراغبون في الحفظ", desc: "كل من يطمح لضبط السنة النبوية وحفظها بإتقان.", icon: BookMarked },
                        ].map((a, i) => (
                            <div key={i} className="flex gap-4 items-center p-6 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 group hover:border-blue-500/30 transition-all">
                                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <a.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold">{a.title}</h3>
                                    <p className="text-sm text-muted-foreground">{a.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Footer Text */}
            <section className="text-center pt-10">
                <p className="text-muted-foreground italic">جميع الحقوق محفوظة - برنامج تحفيظ السنة النبوية بالمدينة النبوية</p>
            </section>

            {/* Fixed CTA for small screens */}
            <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden pointer-events-none">
                <Link href="/register" className="pointer-events-auto block w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-center shadow-2xl hover:scale-105 transition-transform">
                    سجل الآن في البرنامج
                </Link>
            </div>
        </motion.div>
    );
}
