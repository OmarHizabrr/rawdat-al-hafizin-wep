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
        <div className="space-y-6 pb-20">
            <div className="pt-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">إحصائيات النظام</h1>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1 opacity-60">نظرة عامة على نشاط النظام وتوزيع المستخدمين.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="المستخدمين" value={stats.users} icon={Users} color="text-blue-500" bgColor="bg-blue-500/10" />
                <StatCard title="الطلاب" value={stats.students} icon={GraduationCap} color="text-green-500" bgColor="bg-green-500/10" />
                <StatCard title="المعلمين" value={stats.teachers} icon={School} color="text-orange-500" bgColor="bg-orange-500/10" />
                <StatCard title="الحلقات" value={stats.groups} icon={BookOpen} color="text-purple-500" bgColor="bg-purple-500/10" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <GlassCard className="p-4 md:p-5 space-y-5 rounded-2xl">
                    <h2 className="text-lg font-black px-1">توزيع الأدوار</h2>
                    <div className="space-y-3 px-1 pb-1">
                        <DistributionBar label="مشرفين" value={stats.admins} total={stats.users} color="bg-rose-500" />
                        <DistributionBar label="معلمين" value={stats.teachers} total={stats.users} color="bg-blue-500" />
                        <DistributionBar label="طلاب" value={stats.students} total={stats.users} color="bg-emerald-500" />
                    </div>
                </GlassCard>

                {/* Group Stats */}
                <GlassCard className="p-4 md:p-5 space-y-5 rounded-2xl">
                    <h2 className="text-lg font-black px-1">إحصائيات الحلقات</h2>
                    <div className="flex gap-4">
                        <div className="flex-1 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center space-y-1">
                            <p className="text-2xl md:text-3xl font-black text-blue-500">{stats.maleGroups}</p>
                            <p className="text-[10px] md:text-xs font-bold text-blue-500/60 uppercase tracking-widest">حلقات البنين</p>
                        </div>
                        <div className="flex-1 p-3.5 rounded-xl bg-pink-500/5 border border-pink-500/10 text-center space-y-1">
                            <p className="text-2xl md:text-3xl font-black text-pink-500">{stats.femaleGroups}</p>
                            <p className="text-[10px] md:text-xs font-bold text-pink-500/60 uppercase tracking-widest">حلقات البنات</p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: { title: string, value: number, icon: any, color: string, bgColor: string }) {
    return (
        <GlassCard className="p-3 md:p-4 flex flex-col items-center justify-center text-center gap-2 group hover:scale-[1.02] transition-all rounded-xl md:rounded-2xl border-white/5 bg-white/[0.01]">
            <div className={`p-2.5 rounded-xl ${bgColor} ${color} transition-transform group-hover:scale-110 shadow-inner`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xl md:text-2xl font-black tracking-tight">{value.toLocaleString()}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">{title}</p>
            </div>
        </GlassCard>
    );
}

function DistributionBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] md:text-xs">
                <span className="font-bold opacity-70">{label}</span>
                <span className="font-black">{value} <span className="opacity-30 font-medium ml-1">({percentage.toFixed(1)}%)</span></span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    className={`h-full rounded-full ${color} opacity-80 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                />
            </div>
        </div>
    );
}
