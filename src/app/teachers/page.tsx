"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users, Calendar, Clock, ChevronRight, Loader2, BookOpen, TrendingUp, Radio } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Monitor } from "lucide-react";

interface GroupModel {
    id: string;
    name: string;
    gender: 'male' | 'female';
    schedule: {
        recitationDays: string[];
        startTime: string;
        endTime: string;
    };
}

export default function TeacherDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [myGroups, setMyGroups] = useState<GroupModel[]>([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "groups"),
            where("supervisorId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GroupModel[];
            setMyGroups(data);

            // Fetch Stats for these groups
            if (data.length > 0) {
                try {
                    const groupIds = data.map(g => g.id);
                    // 1. Total Students
                    const studentsSnap = await getDocs(query(
                        collection(db, "users"),
                        where("role", "==", "student"),
                        where("groupId", "in", groupIds)
                    ));

                    setStats({
                        totalStudents: studentsSnap.size,
                    });
                } catch (error) {
                    console.error("Error fetching teacher stats:", error);
                }
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded-md" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">لوحة المعلم</h1>
                    <p className="text-muted-foreground mt-2 font-medium">مرحباً بك مجدداً، إليك حالة حلقاتك العلمية لهذا اليوم.</p>
                </div>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={Users} color="bg-blue-500" />
                <StatCard label="عدد الحلقات" value={myGroups.length} icon={BookOpen} color="bg-orange-500" />
                <StatCard label="تقدير عام" value="ممتاز" icon={TrendingUp} color="bg-green-500" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/teachers/recitation">
                    <GlassCard className="p-8 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest">
                                    <Radio className="w-4 h-4 animate-pulse" /> البث المباشر والتسميع
                                </div>
                                <h3 className="text-2xl font-black">غرفة التسميع الافتراضية</h3>
                                <p className="text-sm text-muted-foreground font-medium">ابدأ جلسة تسميع حية أو صوتية لطلابك الآن.</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-500/20 group-hover:scale-110 transition-transform">
                                <Monitor className="w-8 h-8" />
                            </div>
                        </div>
                    </GlassCard>
                </Link>
                <div className="p-8 border-dashed border-2 rounded-3xl flex items-center justify-center text-muted-foreground opacity-30 font-bold italic">
                    ميزة إضافية قادمة...
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" />
                    حلقاتي النشطة
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myGroups.map(group => (
                        <GlassCard key={group.id} className="group relative overflow-hidden transition-all hover:border-primary/50">
                            <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-xs font-bold text-white ${group.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                                {group.gender === 'male' ? 'بنين' : 'بنات'}
                            </div>

                            <div className="p-6 space-y-4">
                                <h3 className="text-xl font-bold mb-4">{group.name}</h3>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span>{group.schedule?.recitationDays?.join(" • ") || "لم يحدد أيام"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>{group.schedule?.startTime || "--:--"} - {group.schedule?.endTime || "--:--"}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                    <Link 
                                        href={`/teachers/halaqat/${group.id}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-colors font-medium text-sm"
                                    >
                                        <Users className="w-4 h-4" />
                                        <span>إدارة الطلاب</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>
                    ))}

                    {myGroups.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed">
                            لا توجد حلقات مسندة إليك حالياً.
                        </div>
                    )}
                </div>
            </div>
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
