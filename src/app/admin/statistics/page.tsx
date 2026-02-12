"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Users,
    GraduationCap,
    BookOpen,
    School,
    UserCheck,
    User
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminStatistics() {
    const [stats, setStats] = useState({
        users: 0,
        students: 0,
        teachers: 0,
        admins: 0,
        groups: 0,
        maleGroups: 0,
        femaleGroups: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Realtime listeners for users and groups
        const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
            const docs = snap.docs.map(d => d.data());
            setStats(prev => ({
                ...prev,
                users: docs.length,
                students: docs.filter(d => d.role === 'student').length,
                teachers: docs.filter(d => d.role === 'teacher').length,
                admins: docs.filter(d => d.role === 'admin').length,
            }));
        });

        const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
            const docs = snap.docs.map(d => d.data());
            setStats(prev => ({
                ...prev,
                groups: docs.length,
                maleGroups: docs.filter(d => d.gender === 'male').length,
                femaleGroups: docs.filter(d => d.gender === 'female').length,
            }));
            setLoading(false);
        });

        return () => {
            unsubUsers();
            unsubGroups();
        };
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">جاري تحميل الإحصائيات...</div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold">إحصائيات النظام</h1>
                <p className="text-muted-foreground mt-2">نظرة عامة على نشاط النظام وتوزيع المستخدمين.</p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="المستخدمين" value={stats.users} icon={Users} color="text-blue-500" bgColor="bg-blue-500/10" />
                <StatCard title="الطلاب" value={stats.students} icon={GraduationCap} color="text-green-500" bgColor="bg-green-500/10" />
                <StatCard title="المعلمين" value={stats.teachers} icon={School} color="text-orange-500" bgColor="bg-orange-500/10" />
                <StatCard title="الحلقات" value={stats.groups} icon={BookOpen} color="text-purple-500" bgColor="bg-purple-500/10" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <GlassCard className="p-6 space-y-6">
                    <h2 className="text-xl font-bold">توزيع الأدوار</h2>
                    <div className="space-y-4">
                        <DistributionBar label="مشرفين" value={stats.admins} total={stats.users} color="bg-red-500" />
                        <DistributionBar label="معلمين" value={stats.teachers} total={stats.users} color="bg-blue-500" />
                        <DistributionBar label="طلاب" value={stats.students} total={stats.users} color="bg-green-500" />
                    </div>
                </GlassCard>

                {/* Group Stats */}
                <GlassCard className="p-6 space-y-6">
                    <h2 className="text-xl font-bold">إحصائيات الحلقات</h2>
                    <div className="flex gap-4">
                        <div className="flex-1 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center space-y-2">
                            <p className="text-3xl font-bold text-blue-600">{stats.maleGroups}</p>
                            <p className="text-sm text-blue-600/80">حلقات البنين</p>
                        </div>
                        <div className="flex-1 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center space-y-2">
                            <p className="text-3xl font-bold text-pink-600">{stats.femaleGroups}</p>
                            <p className="text-sm text-pink-600/80">حلقات البنات</p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: { title: string, value: number, icon: any, color: string, bgColor: string }) {
    return (
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center gap-3 hover:scale-[1.02] transition-transform">
            <div className={`p-3 rounded-full ${bgColor} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{title}</p>
            </div>
        </GlassCard>
    );
}

function DistributionBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-bold">{value} <span className="text-muted-foreground text-xs font-normal">({percentage.toFixed(1)}%)</span></span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    );
}
