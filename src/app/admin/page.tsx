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
    Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

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
        href: "/admin/courses", // Placeholder
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-500/20"
    },
    {
        title: "مشاعر الطلاب",
        description: "إدارة انطباعات الطلاب وتفاعلاتهم",
        icon: MessageCircle,
        href: "/admin/testimonials", // Placeholder
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        borderColor: "border-pink-500/20"
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
                
                // For daily logs, we'd normally query today's logs specifically
                const todayStr = new Date().toISOString().split('T')[0];
                const logsSnap = await getDocs(query(collection(db, "daily_logs"), where("date", "==", todayStr)));

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

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">لوحة التحكم</h1>
                    <p className="text-muted-foreground mt-2 font-medium">أهلاً بك يا مدير النظام، إليك نظرة عامة على نشاط المنصة اليوم.</p>
                </div>
                {!loading && (
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl border border-primary/20 text-xs font-bold animate-pulse">
                        تحديث مباشر • {new Date().toLocaleTimeString('ar-SA')}
                    </div>
                )}
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={Users} color="bg-blue-500" />
                <StatCard label="الدورات المفعلة" value={stats.activeCourses} icon={GraduationCap} color="bg-indigo-500" />
                <StatCard label="الحلقات العلمية" value={stats.totalHalaqat} icon={BookOpen} color="bg-orange-500" />
                <StatCard label="إنجازات اليوم" value={stats.dailyLogsToday} icon={BarChart3} color="bg-green-500" />
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {adminCards.map((card, index) => (
                    <motion.div key={index} variants={item}>
                        <Link href={card.href} className="block h-full">
                            <GlassCard className="h-full hover:scale-[1.02] transition-transform p-3">
                                <div className={`p-6 rounded-2xl border ${card.borderColor} bg-white/50 dark:bg-black/20 h-full flex flex-col`}>
                                    <div className={`w-12 h-12 rounded-full ${card.bgColor} ${card.color} flex items-center justify-center mb-4`}>
                                        <card.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                                    <p className="text-sm text-muted-foreground">{card.description}</p>
                                </div>
                            </GlassCard>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <GlassCard className="p-6 relative overflow-hidden group border-white/5">
            <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] blur-3xl -mr-12 -mt-12 group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${color}/10 flex items-center justify-center text-white shadow-inner`}>
                    <Icon className={color.replace('bg-', 'text-')} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-0.5">{label}</p>
                    <h4 className="text-2xl font-black tracking-tight">{value}</h4>
                </div>
            </div>
        </GlassCard>
    );
}
