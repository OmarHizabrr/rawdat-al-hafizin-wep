"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import {
    Users,
    Key,
    BarChart3,
    GraduationCap,
    BookOpen,
    MessageCircle,
    DownloadCloud,
    Settings,
    UserCheck,
    Sparkles,
    ArrowRight,
    Radio,
    Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, collectionGroup } from "firebase/firestore";

const adminCards = [
    {
        title: "إدارة رموز الوصول",
        description: "تعديل رموز الدخول للأدمن والمستخدمين",
        icon: Key,
        href: "/admin/access-codes",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20"
    },
    {
        title: "تحديثات التطبيق",
        description: "إدارة إصدارات البرنامج وروابط التحميل",
        icon: DownloadCloud, // System update icon
        href: "/admin/updates", // Placeholder
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20"
    },
    {
        title: "إدارة المستخدمين",
        description: "مشاهدة وتعديل بيانات المسجلين",
        icon: Users,
        href: "/admin/users",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20"
    },
    {
        title: "إدارة الحلقات",
        description: "تنظيم حلقات التحفيظ وإدارة المجموعات",
        icon: BookOpen,
        href: "/admin/halaqat", // Placeholder
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20"
    },
    {
        title: "إحصائيات النظام",
        description: "نظرة عامة على نشاط النظام",
        icon: BarChart3,
        href: "/admin/statistics",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20"
    },
    {
        title: "إدارة الدورات",
        description: "إدارة البرامج التدريبية والمحتوى",
        icon: GraduationCap,
        href: "/admin/courses",
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-500/20"
    },
    {
        title: "طلبات الالتحاق",
        description: "مراجعة واعتماد المتقدمين الجدد للمنصة",
        icon: UserCheck,
        href: "/admin/applicants",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20"
    },
    {
        title: "مشاعر الطلاب",
        description: "إدارة انطباعات الطلاب وتفاعلاتهم",
        icon: MessageCircle,
        href: "/admin/testimonials",
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        borderColor: "border-pink-500/20"
    },
    {
        title: "إدارة التسميع المباشر",
        description: "مراقبة وإنشاء جلسات التسميع الحية والمشرفة",
        icon: Radio,
        href: "/admin/recitation",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20"
    },
    {
        title: "نظام التميز والمحفزات",
        description: "إدارة النقاط، الأوسمة، وشروط المكافآت الذكية",
        icon: Trophy,
        href: "/admin/gamification",
        color: "text-amber-500",
        bgColor: "bg-amber-500/20",
        borderColor: "border-amber-500/30",
        isNew: true
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeCourses: 0,
        dailyLogsToday: 0,
        totalHalaqat: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
                const coursesSnap = await getDocs(collection(db, "courses"));
                const halaqatSnap = await getDocs(collection(db, "groups"));
                const todayStr = new Date().toISOString().split('T')[0];
                const logsSnap = await getDocs(query(collectionGroup(db, "daily_logs"), where("date", "==", todayStr)));

                setStats({
                    totalStudents: usersSnap.size,
                    activeCourses: coursesSnap.size,
                    dailyLogsToday: logsSnap.size,
                    totalHalaqat: halaqatSnap.size
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const categories = [
        { name: "الإدارة الأكاديمية", cards: adminCards.filter(c => [4, 6, 7].includes(adminCards.indexOf(c))) },
        { name: "إدارة المنظومة", cards: adminCards.filter(c => [0, 2, 5].includes(adminCards.indexOf(c))) },
        { name: "المحتوى والإعدادات", cards: adminCards.filter(c => [1, 3].includes(adminCards.indexOf(c))) }
    ];

    // Map for actual card indices based on types:
    // 0: Access Codes, 1: Updates, 2: Users, 3: Groups (Halaqat), 4: Stats, 5: Courses, 6: Applicants, 7: Testimonials
    const categorizedCards = [
        { 
            title: "الشؤون التعليمية والرقابة", 
            icon: GraduationCap,
            color: "text-primary",
            items: adminCards.filter(c => ["إدارة الدورات", "إدارة الحلقات", "طلبات الالتحاق", "إدارة التسميع المباشر"].includes(c.title))
        },
        { 
            title: "إدارة التميز والطلاب", 
            icon: Trophy,
            color: "text-amber-500",
            items: adminCards.filter(c => ["نظام التميز والمحفزات", "إدارة المستخدمين", "مشاعر الطلاب"].includes(c.title))
        },
        { 
            title: "إعدادات المنصة والنظام", 
            icon: Settings,
            color: "text-blue-500",
            items: adminCards.filter(c => ["إدارة رموز الوصول", "تحديثات التطبيق", "إحصائيات النظام"].includes(c.title))
        }
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pt-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">غرفة التحكم والعمليات</h1>
                    <p className="text-[11px] md:text-xs text-muted-foreground font-medium flex items-center gap-2 opacity-60">
                        <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                        نظرة شاملة وتحليلية لأداء المنصة والنشاط الحالي.
                    </p>
                </div>
                {!loading && (
                    <div className="bg-primary/5 text-primary px-4 py-2 rounded-xl border border-primary/10 text-[10px] font-black flex items-center gap-3 shadow-lg backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        تحديث مباشر • {new Date().toLocaleTimeString('ar-SA')}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-1">
                <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={Users} color="from-blue-500 to-cyan-500" />
                <StatCard label="الدورات" value={stats.activeCourses} icon={GraduationCap} color="from-indigo-500 to-purple-500" />
                <StatCard label="الحلقات" value={stats.totalHalaqat} icon={BookOpen} color="from-orange-500 to-amber-500" />
                <StatCard label="إنجازات اليوم" value={stats.dailyLogsToday} icon={BarChart3} color="from-emerald-500 to-teal-500" />
            </div>

            <div className="space-y-12">
                {categorizedCards.map((category, catIdx) => (
                    <section key={catIdx} className="space-y-5 md:space-y-6">
                        <div className="flex items-center gap-3 px-1 md:px-2">
                            <div className={cn("p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner", category.color)}>
                                <category.icon className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <h2 className="text-lg md:text-xl font-black">{category.title}</h2>
                            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent mx-2 md:mx-4 opacity-50" />
                        </div>

                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {category.items.map((card, index) => (
                                <motion.div key={index} variants={item}>
                                    <Link href={card.href} className="block h-full group">
                                        <GlassCard className="h-full group-hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-2xl bg-white/[0.01] border-white/5 rounded-2xl">
                                            <div className="p-4 md:p-5 flex flex-col h-full space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", card.bgColor.replace('/10', ''))}>
                                                        <card.icon className="w-5 h-5 md:w-6 md:h-6" />
                                                    </div>
                                                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-0 group-hover:opacity-40 transition-all -translate-x-2 group-hover:translate-x-0 rtl:rotate-180" />
                                                </div>
                                                <div className="space-y-1.5 flex-1">
                                                    <h3 className="text-base font-black group-hover:text-primary transition-colors leading-tight">{card.title}</h3>
                                                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed font-medium opacity-70">{card.description}</p>
                                                </div>
                                                <div className="pt-3 border-t border-white/5 flex justify-end">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/40 group-hover:text-primary transition-colors">إدارة القسم</span>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <GlassCard className="p-4 md:p-5 relative overflow-hidden group border-white/5 transition-all hover:border-primary/20 rounded-xl md:rounded-2xl">
            <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 blur-2xl -mr-12 -mt-12 group-hover:opacity-15 transition-opacity", color)} />
            <div className="flex items-center gap-4 relative z-10">
                <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", color)}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground opacity-40 mb-0.5">{label}</p>
                    <h4 className="text-xl md:text-2xl font-black tracking-tighter">{value.toLocaleString()}</h4>
                </div>
            </div>
            <div className={cn("h-0.5 w-8 rounded-full absolute bottom-3 left-6 transition-all group-hover:w-16 bg-gradient-to-r opacity-20", color)} />
        </GlassCard>
    );
}
