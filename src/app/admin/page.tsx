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
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">لوحة التحكم</h1>
                <p className="text-muted-foreground mt-2">أهلاً بك يا مدير النظام، إليك نظرة عامة على الإعدادات.</p>
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
