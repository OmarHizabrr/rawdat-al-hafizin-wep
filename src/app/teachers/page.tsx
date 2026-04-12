"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
    Users, 
    Calendar, 
    Clock, 
    ChevronRight, 
    Loader2, 
    BookOpen, 
    TrendingUp, 
    Radio, 
    GraduationCap, 
    Sparkles 
} from "lucide-react";
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 bg-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden card-shine">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex items-center gap-4 md:gap-5">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl md:rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-inner">
                        <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-elite-gradient leading-tight">منبر التوجيه</h1>
                        <p className="text-[10px] md:text-sm text-muted-foreground font-medium opacity-70 italic">مرحباً بك مجدداً يا ملقن الخير، إليك حالة حلقاتك العلمية لهذا اليوم.</p>
                    </div>
                </div>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={Users} color="bg-blue-500" />
                <StatCard label="عدد الحلقات" value={myGroups.length} icon={BookOpen} color="bg-orange-500" />
                <StatCard label="المستوى العام" value="نخبة" icon={TrendingUp} color="bg-green-500" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <Link href="/teachers/recitation">
                    <GlassCard className="p-6 md:p-8 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all group relative overflow-hidden card-shine rounded-[1.5rem] md:rounded-[2rem]">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-[70px] rounded-full -mr-20 -mt-20" />
                        <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 w-fit">
                                    <Radio className="w-3.5 h-3.5 animate-pulse" /> مباشر الآن
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight">قاعة التسميع الذكي</h3>
                                <p className="text-xs md:text-sm text-muted-foreground font-bold opacity-70 leading-relaxed max-w-[280px]">ابدأ جلسة تسميع حية لطلابك باستخدام تقنيات النخبة.</p>
                            </div>
                            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-red-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)] group-hover:scale-110 transition-all duration-700">
                                <Monitor className="w-7 h-7 md:w-10 md:h-10" />
                            </div>
                        </div>
                    </GlassCard>
                </Link>
                <div className="p-8 border-dashed border-2 border-white/5 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center text-muted-foreground/30 font-black relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="w-8 h-8 mb-3 opacity-20" />
                    <span className="text-sm md:text-lg tracking-[0.2em] uppercase italic">ميزة النخبة القادمة</span>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" />
                    حلقاتي النشطة
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myGroups.map(group => (
                        <GlassCard key={group.id} className="group relative overflow-hidden transition-all hover:border-primary/50 shadow-2xl card-shine rounded-[1.5rem] md:rounded-[2rem] p-0">
                            <div className={`absolute top-0 right-0 px-4 md:px-6 py-1.5 md:py-2 rounded-bl-xl md:rounded-bl-[1.5rem] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl ${group.gender === 'male' ? 'bg-blue-600' : 'bg-pink-600'}`}>
                                {group.gender === 'male' ? 'بنين' : 'بنات'}
                            </div>

                            <div className="p-6 md:p-8 pt-10 md:pt-12 space-y-4 md:space-y-6">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight">{group.name}</h3>
                                
                                <div className="space-y-2 md:space-y-3">
                                    <div className="flex items-center gap-2.5 md:gap-3 text-[11px] md:text-sm font-bold text-muted-foreground/80 bg-white/5 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
                                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        <span className="truncate">{group.schedule?.recitationDays?.join(" • ") || "جلسات مرنة"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 md:gap-3 text-[11px] md:text-sm font-bold text-muted-foreground/80 bg-white/5 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
                                        <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        <span className="dir-ltr">{group.schedule?.startTime || "--:--"} - {group.schedule?.endTime || "--:--"}</span>
                                    </div>
                                </div>

                                <div className="pt-4 md:pt-6 border-t border-white/10">
                                    <Link 
                                        href={`/teachers/halaqat/${group.id}`}
                                        className="btn-elite-primary w-full py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 font-black text-xs md:text-sm"
                                    >
                                        <Users className="w-4 h-4 md:w-5 md:h-5" />
                                        <span>إدارة المجموعة</span>
                                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-[-4px] transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>
                    ))}

                    {myGroups.length === 0 && (
                        <div className="col-span-full text-center py-24 text-muted-foreground bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                            <p className="text-xl font-black opacity-30">لا توجد حلقات مسندة لرعايتك العلمية حالياً.</p>
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
