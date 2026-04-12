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
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 px-2">
                <div className="space-y-1 text-center md:text-right">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight flex flex-col md:flex-row items-center gap-3">
                        السجل الأكاديمي الشامل
                        <div className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-full border border-primary/20 w-fit">ELITE ARCHIVE</div>
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium opacity-60">توثيق كامل لمسيرتك العلمية وتفاعلك مع المنصة.</p>
                </div>
                
                <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl">
                    {[
                        { id: 'attendance', label: 'التقييمات', icon: Calendar },
                        { id: 'points', label: 'النقاط', icon: Coins },
                        { id: 'badges', label: 'أوسمتي', icon: Trophy }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 py-2 px-4 md:px-6 rounded-lg md:rounded-xl text-[11px] md:text-xs font-black transition-all whitespace-nowrap",
                                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                <SummaryCard label="إجمالي النقاط" value={userData?.totalPoints || 0} icon={Coins} color="bg-amber-500" />
                <SummaryCard label="الأوسمة" value={badges.length} icon={Trophy} color="bg-primary" />
                <SummaryCard label="التقييمات" value={evaluations.length} icon={FileText} color="bg-blue-500" />
                <SummaryCard label="المعدل" value="ممتاز" icon={TrendingUp} color="bg-emerald-500" />
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
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg md:text-xl font-black flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /> أرشيف السجلات</h3>
                                <button className="flex items-center gap-2 text-[10px] font-black opacity-30 hover:opacity-100 transition-opacity"><Download className="w-3.5 h-3.5" /> تصدير PDF</button>
                            </div>
                            <TableLayout headers={["الجلسة", "النوع", "الدرجة", "الملاحظات", "التاريخ"]}>
                                {evaluations.map(evalItem => (
                                    <tr key={evalItem.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-3 md:p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black"><BookOpen className="w-4 h-4" /></div>
                                                <div className="font-black text-[13px]">{evalItem.groupName || evalItem.courseTitle}</div>
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-md text-[9px] font-black border",
                                                evalItem.type === 'attendance' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                                                evalItem.type === 'test' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                                "bg-green-500/10 text-green-500 border-green-500/20"
                                            )}>
                                                {evalItem.type === 'attendance' ? 'حضور' : evalItem.type === 'test' ? 'اختبار' : 'تسميع'}
                                            </span>
                                        </td>
                                        <td className="p-3 md:p-4"><div className="w-14 py-1 bg-white/5 rounded-lg text-center font-black text-xs border border-white/5">{evalItem.mark}</div></td>
                                        <td className="p-3 md:p-4 text-[11px] text-muted-foreground italic font-medium max-w-[200px] truncate">{evalItem.notes || '-- لا توجد ملاحظات --'}</td>
                                        <td className="p-3 md:p-4 text-[10px] font-black opacity-20">{new Date(evalItem.createdAt?.toDate ? evalItem.createdAt.toDate() : evalItem.date).toLocaleDateString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </TableLayout>
                        </div>
                    )}

                    {activeTab === 'points' && (
                        <div className="space-y-4">
                            <h3 className="text-lg md:text-xl font-black flex items-center gap-2 px-2"><Coins className="w-5 h-5 text-amber-500" /> كشف النقاط</h3>
                            <TableLayout headers={["المعالجة", "السبب", "المستوى", "النوع", "التاريخ"]}>
                                {pointsLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3 md:p-4">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black",
                                                log.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            )}>{log.amount > 0 ? `+${log.amount}` : log.amount}</div>
                                        </td>
                                        <td className="p-3 md:p-4 font-black text-xs">{log.reason}</td>
                                        <td className="p-3 md:p-4 font-black text-[10px] opacity-40 uppercase tracking-tighter">{log.source || 'SYS'}</td>
                                        <td className="p-3 md:p-4">
                                            <div className={cn("px-3 py-1 rounded-md text-[9px] font-black inline-block", log.type === 'reward' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                                {log.type === 'reward' ? 'تميز' : 'خصم'}
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-4 text-[10px] font-black opacity-20">{log.timestamp?.toDate().toLocaleDateString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </TableLayout>
                        </div>
                    )}

                    {activeTab === 'badges' && (
                        <div className="space-y-8">
                            <h3 className="text-lg md:text-xl font-black flex items-center gap-2 px-2"><Trophy className="w-5 h-5 text-primary" /> خزانة الإنجازات</h3>
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {badges.map(badge => (
                                    <GlassCard key={badge.id} className="p-5 md:p-8 flex flex-col items-center text-center gap-4 group hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                                        <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white bg-gradient-to-br shadow-xl relative overflow-hidden", badge.color)}>
                                            <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Award className="w-8 h-8 md:w-10 md:h-10 relative z-10 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-base md:text-lg font-black tracking-tight">{badge.name}</h4>
                                            <p className="text-[10px] text-muted-foreground font-medium leading-tight opacity-70 line-clamp-2 px-2">{badge.description || 'وسام تقدير لتميز الطالب.'}</p>
                                        </div>
                                        <div className="pt-4 border-t border-white/5 w-full flex justify-between items-center px-2">
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-20">الاستحقاق</span>
                                            <span className="text-[10px] font-bold opacity-60">{badge.earnedAt?.toDate().toLocaleDateString('ar-EG') || '--/--'}</span>
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
        <GlassCard className="p-4 md:p-6 border-white/5 bg-white/[0.01] group hover:bg-white/[0.03] transition-all rounded-xl md:rounded-2xl">
            <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", color)}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] opacity-40 mb-0.5">{label}</p>
                    <p className="text-xl md:text-2xl font-black tracking-tighter">{value}</p>
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
                                <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest opacity-30">{h}</th>
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
