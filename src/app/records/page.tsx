"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, collectionGroup, Timestamp } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
    FileText, 
    Calendar, 
    Award, 
    TrendingUp, 
    Coins, 
    CheckCircle2, 
    Clock, 
    Download,
    Trophy,
    BookOpen,
    Filter,
    Loader2,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RecordsPage() {
    const { user, userData } = useAuth();
    const [activeTab, setActiveTab] = useState<'attendance' | 'points' | 'badges'>('attendance');
    const [loading, setLoading] = useState(true);
    
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [pointsLogs, setPointsLogs] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchFullHistory = async () => {
            setLoading(true);
            try {
                // 1. Fetch Evaluations (using collectionGroup for all groups the student belongs to)
                const evalQuery = query(
                    collectionGroup(db, "evaluations"),
                    where("studentId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const evalSnap = await getDocs(evalQuery);
                setEvaluations(evalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // 2. Fetch Points Logs
                const pointsQuery = query(
                    collection(db, "points_logs", user.uid, "points_logs"),
                    orderBy("timestamp", "desc")
                );
                const pointsSnap = await getDocs(pointsQuery);
                setPointsLogs(pointsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // 3. Fetch Badges
                const badgesRef = collection(db, "badges", user.uid, "badges");
                const badgesSnap = await getDocs(badgesRef);
                setBadges(badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error fetching student records:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFullHistory();
    }, [user]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-20">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="font-black text-lg">جاري استرجاع السجل الأكاديمي...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-32">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
                        السجل الأكاديمي الشامل
                        <div className="px-4 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full border border-primary/20">ELITE ARCHIVE</div>
                    </h1>
                    <p className="text-muted-foreground font-medium">توثيق كامل لمسيرتك العلمية وتفاعلك مع المنصة.</p>
                </div>
                
                <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-[2rem]">
                    {[
                        { id: 'attendance', label: 'التقييمات والحضور', icon: Calendar },
                        { id: 'points', label: 'ميزانية النقاط', icon: Coins },
                        { id: 'badges', label: 'الإنجازات الملكية', icon: Trophy }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 py-3 px-6 rounded-[1.8rem] text-sm font-black transition-all",
                                activeTab === tab.id ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <SummaryCard label="إجمالي النقاط" value={userData?.totalPoints || 0} icon={Coins} color="bg-amber-500" />
                <SummaryCard label="الأوسمة المحققة" value={badges.length} icon={Trophy} color="bg-primary" />
                <SummaryCard label="سجل التقييمات" value={evaluations.length} icon={FileText} color="bg-blue-500" />
                <SummaryCard label="المعدل التقديري" value="ممتاز" icon={TrendingUp} color="bg-emerald-500" />
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                >
                    {activeTab === 'attendance' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-2xl font-black flex items-center gap-3"><Clock className="w-6 h-6 text-blue-500" /> أرشيف التقييمات والمتابعة</h3>
                                <button className="flex items-center gap-2 text-xs font-black opacity-40 hover:opacity-100 transition-opacity"><Download className="w-4 h-4" /> تصدير السجل</button>
                            </div>
                            <TableLayout headers={["الجلسة / الحلقة", "النوع", "الدرجة", "الملاحظات", "التاريخ"]}>
                                {evaluations.map(evalItem => (
                                    <tr key={evalItem.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black"><BookOpen className="w-5 h-5" /></div>
                                                <div className="font-black">{evalItem.groupName || evalItem.courseTitle}</div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={cn(
                                                "px-4 py-1 rounded-lg text-[10px] font-black border",
                                                evalItem.type === 'attendance' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                                                evalItem.type === 'test' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                                "bg-green-500/10 text-green-500 border-green-500/20"
                                            )}>
                                                {evalItem.type === 'attendance' ? 'حضور' : evalItem.type === 'test' ? 'اختبار' : 'تسميع'}
                                            </span>
                                        </td>
                                        <td className="p-6"><div className="w-16 py-1.5 bg-white/5 rounded-xl text-center font-black text-sm border border-white/5">{evalItem.mark}</div></td>
                                        <td className="p-6 text-xs text-muted-foreground italic font-medium">{evalItem.notes || '-- لا توجد ملاحظات --'}</td>
                                        <td className="p-6 text-xs font-black opacity-30">{new Date(evalItem.createdAt?.toDate ? evalItem.createdAt.toDate() : evalItem.date).toLocaleDateString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </TableLayout>
                        </div>
                    )}

                    {activeTab === 'points' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black flex items-center gap-3 px-4"><Coins className="w-6 h-6 text-amber-500" /> دفتر الأستاذ (سجل النقاط)</h3>
                            <TableLayout headers={["العملية", "المصدر", "المقدار", "البيان النقدي", "التاريخ"]}>
                                {pointsLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                                                log.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            )}>{log.amount > 0 ? `+${log.amount}` : log.amount}</div>
                                        </td>
                                        <td className="p-6 font-black text-sm">{log.reason}</td>
                                        <td className="p-6 font-black text-xs opacity-60 uppercase tracking-widest">{log.source || 'نظام تقائي'}</td>
                                        <td className="p-6">
                                            <div className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black inline-block", log.type === 'reward' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                                {log.type === 'reward' ? 'مكافأة تميز' : 'خصم إداري'}
                                            </div>
                                        </td>
                                        <td className="p-6 text-xs font-black opacity-30">{log.timestamp?.toDate().toLocaleDateString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </TableLayout>
                        </div>
                    )}

                    {activeTab === 'badges' && (
                        <div className="space-y-10">
                            <h3 className="text-2xl font-black flex items-center gap-3 px-4"><Trophy className="w-6 h-6 text-primary" /> خزانة الإنجازات الملكية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {badges.map(badge => (
                                    <GlassCard key={badge.id} className="p-10 flex flex-col items-center text-center gap-6 group hover:-translate-y-2 transition-all duration-500">
                                        <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white bg-gradient-to-br shadow-2xl relative overflow-hidden", badge.color)}>
                                            <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Award className="w-12 h-12 relative z-10 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-black tracking-tight">{badge.name}</h4>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">{badge.description || 'تم منح هذا الوسام تقديراً لتميز الطالب وجهوده.'}</p>
                                        </div>
                                        <div className="pt-6 border-t border-white/5 w-full flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">تاريخ الاستحقاق</span>
                                            <span className="text-xs font-bold">{badge.earnedAt?.toDate().toLocaleDateString('ar-EG') || '--/--/----'}</span>
                                        </div>
                                    </GlassCard>
                                ))}
                                {badges.length === 0 && (
                                    <div className="col-span-full py-20 text-center space-y-6 opacity-30grayscale">
                                        <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-10 animate-pulse" />
                                        <p className="font-black italic text-lg">بانتظار أن تُزيّن هذه الخزانة بأول أوسمتك...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color }: any) {
    return (
        <GlassCard className="p-8 border-white/5 bg-white/[0.01] group hover:bg-white/[0.03] transition-all">
            <div className="flex items-center gap-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform", color)}>
                    <Icon className="w-7 h-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">{label}</p>
                    <p className="text-3xl font-black tracking-tighter">{value}</p>
                </div>
            </div>
        </GlassCard>
    );
}

function TableLayout({ headers, children }: { headers: string[], children: React.ReactNode }) {
    return (
        <GlassCard className="overflow-hidden border-white/5 bg-white/[0.01]">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-white/[0.03] border-b border-white/5">
                            {headers.map(h => (
                                <th key={h} className="p-6 text-xs font-black uppercase tracking-widest opacity-40">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {children}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}
