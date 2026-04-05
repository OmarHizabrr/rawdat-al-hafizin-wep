"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs, orderBy, Timestamp, collectionGroup } from "firebase/firestore";
import { createRecitationSession, endRecitationSession, getSessionAttendance, RecitationSession } from "@/lib/recitation-service";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
    Video, 
    Mic, 
    Plus, 
    X, 
    Users, 
    ExternalLink, 
    Clock, 
    Radio, 
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    ChevronLeft,
    Monitor,
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Group {
    id: string;
    name: string;
}

export default function TeacherRecitationManagement() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<RecitationSession[]>([]);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Create Form State
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState<'video' | 'audio'>('video');
    const [targetGroup, setTargetGroup] = useState("");
    const [targetType, setTargetType] = useState<'group' | 'individual'>('group');
    const [groupStudents, setGroupStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    
    // Attendance Report State
    const [reportSession, setReportSession] = useState<RecitationSession | null>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Fetch Teacher's Groups
        const fetchGroups = async () => {
            const q = query(collection(db, "groups"), where("supervisorId", "==", user.uid));
            const snap = await getDocs(q);
            setMyGroups(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        };
        fetchGroups();

        // Fetch Teacher's Sessions using Collection Group to follow nested path pattern
        const qSessions = query(
            collectionGroup(db, "recitation_sessions"),
            where("creatorId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(qSessions, (snapshot) => {
            setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecitationSession)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch Students when group changes
    useEffect(() => {
        if (!targetGroup) {
            setGroupStudents([]);
            return;
        }
        
        const fetchStudents = async () => {
            setLoadingStudents(true);
            const q = query(collection(db, "users"), where("groupId", "==", targetGroup), where("role", "==", "student"));
            const snap = await getDocs(q);
            setGroupStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingStudents(false);
        };
        fetchStudents();
    }, [targetGroup]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !url || !targetGroup) return;
        setSaving(true);
        try {
            await createRecitationSession({
                title,
                url,
                type,
                creatorId: user.uid,
                creatorName: user.displayName || "معلم",
                targetType: targetType,
                targetId: targetGroup,
                targetStudentIds: targetType === 'individual' ? selectedStudentIds : []
            });
            setIsModalOpen(false);
            setTitle(""); setUrl(""); setTargetGroup(""); setSelectedStudentIds([]); setTargetType('group');
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleEnd = async (parentId: string, id: string) => {
        if (confirm("هل تريد إغلاق هذه الجلسة؟ لن تظهر للطلاب بعد الآن.")) {
            await endRecitationSession(parentId, id);
        }
    };

    const handleViewReport = async (session: RecitationSession) => {
        setReportSession(session);
        setLoadingReport(true);
        try {
            const logs = await getSessionAttendance(session.id!);
            setAttendance(logs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingReport(false);
        }
    };

    const activeSessions = sessions.filter(s => s.status === 'active');
    const pastSessions = sessions.filter(s => s.status === 'ended');

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-10 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Link href="/teachers" className="p-2 hover:bg-primary/10 rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></Link>
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">النظام الذكي للتسميع</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
                        إدارة التسميع المباشر
                        <span className="px-4 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-full border border-red-500/20 animate-pulse">BETA LIVE</span>
                    </h1>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-6 h-6" />
                    إنشاء جلسة جديدة
                </button>
            </div>

            {/* Active Sessions Grid */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                    <h2 className="text-xl font-black">الجلسات النشطة حالياً ({activeSessions.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map(session => (
                        <SessionCard 
                            key={session.id} 
                            session={session} 
                            onEnd={() => handleEnd(session.parentId, session.id!)} 
                            onReport={() => handleViewReport(session)}
                            isActive
                        />
                    ))}
                    {activeSessions.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[2.5rem] opacity-30">
                            <p className="text-sm font-bold">لا توجد جلسات مفتوحة حالياً. ابدأ بإنشاء جلسة للطلاب.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Past Sessions Table */}
            {pastSessions.length > 0 && (
                <section className="space-y-6 pt-10">
                    <div className="flex items-center gap-3 px-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-xl font-black">أرشيف الجلسات السابقة</h2>
                    </div>
                    <GlassCard className="overflow-hidden border-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest opacity-40">عنوان الجلسة</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest opacity-40">المجموعة المستهدفة</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest opacity-40">التاريخ والوقت</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest opacity-40">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pastSessions.map(session => (
                                        <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 font-bold">{session.title}</td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20">
                                                    {myGroups.find(g => g.id === session.targetId)?.name || session.targetType}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-medium opacity-60">
                                                {session.createdAt.toDate().toLocaleString('ar-EG')}
                                            </td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => handleViewReport(session)}
                                                    className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                                                >
                                                    <Users className="w-4 h-4" /> عرض سجل المشاركة
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </section>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-background rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <h3 className="text-2xl font-black flex items-center gap-3"><Radio className="w-6 h-6 text-red-500" /> إنشاء جلسة تسميع حية</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black opacity-60 px-1">عنوان الجلسة</label>
                                    <input 
                                        required value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="مثلاً: تسميع مفردات البخاري - الفترة المسائية"
                                        className="w-full p-4 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black opacity-60 px-1">رابط الاجتماع (Google Meet / Zoom / etc.)</label>
                                    <div className="relative">
                                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                        <input 
                                            required type="url" value={url} onChange={e => setUrl(e.target.value)}
                                            placeholder="https://meet.google.com/..."
                                            className="w-full pl-6 pr-12 py-4 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none font-bold ltr text-right"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black opacity-60 px-1">نوع الجلسة</label>
                                        <div className="flex gap-2">
                                            <button 
                                                type="button" onClick={() => setType('video')}
                                                className={cn("flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all", type === 'video' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}
                                            >
                                                <Video className="w-4 h-4" /> فيديو
                                            </button>
                                            <button 
                                                type="button" onClick={() => setType('audio')}
                                                className={cn("flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all", type === 'audio' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}
                                            >
                                                <Mic className="w-4 h-4" /> صوتي
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black opacity-60 px-1">الحلقة المستهدفة</label>
                                        <select 
                                            required value={targetGroup} onChange={e => setTargetGroup(e.target.value)}
                                            className="w-full p-4 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                        >
                                            <option value="">-- اختر الحلقة --</option>
                                            {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black opacity-60 px-1">طريقة التوجيه</label>
                                        <div className="flex gap-2">
                                            <button 
                                                type="button" onClick={() => setTargetType('group')}
                                                className={cn("flex-1 p-3 rounded-xl border font-bold transition-all", targetType === 'group' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}
                                            >
                                                جميع طلاب الحلقة
                                            </button>
                                            <button 
                                                type="button" onClick={() => setTargetType('individual')}
                                                className={cn("flex-1 p-3 rounded-xl border font-bold transition-all", targetType === 'individual' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}
                                            >
                                                طلاب محددون
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {targetType === 'individual' && targetGroup && (
                                    <div className="space-y-3 p-4 bg-white/5 rounded-[2rem] border border-white/5">
                                        <label className="text-sm font-black opacity-60 px-1 block mb-2">اختر الطلاب ({selectedStudentIds.length})</label>
                                        {loadingStudents ? (
                                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {groupStudents.map(student => (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedStudentIds(prev => 
                                                                prev.includes(student.id) 
                                                                ? prev.filter(id => id !== student.id)
                                                                : [...prev, student.id]
                                                            )
                                                        }}
                                                        className={cn(
                                                            "p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all group/btn",
                                                            selectedStudentIds.includes(student.id) 
                                                                ? "bg-primary/20 border-primary text-primary" 
                                                                : "bg-white/5 border-white/10 hover:border-white/30"
                                                        )}
                                                    >
                                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]", selectedStudentIds.includes(student.id) ? "bg-primary text-white" : "bg-white/10 opacity-40")}>
                                                            {selectedStudentIds.includes(student.id) ? <CheckCircle2 className="w-3 h-3" /> : student.displayName?.[0]}
                                                        </div>
                                                        <span className="truncate">{student.displayName}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button 
                                    disabled={saving} type="submit"
                                    className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                                    تفعيل الجلسة فوراً
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Attendance Report Modal */}
            <AnimatePresence>
                {reportSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setReportSession(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-background rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black">تقرير المشاركة والحضور</h3>
                                    <p className="text-sm text-primary font-bold">{reportSession.title}</p>
                                </div>
                                <button onClick={() => setReportSession(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="p-8 max-h-[60vh] overflow-y-auto">
                                {loadingReport ? (
                                    <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto opacity-20" /></div>
                                ) : attendance.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-2xl border border-primary/20 mb-6">
                                            <span className="font-bold flex items-center gap-2"><Users className="w-5 h-5" /> إجمالي المشاركين</span>
                                            <span className="text-2xl font-black">{attendance.length}</span>
                                        </div>
                                        <div className="grid gap-3">
                                            {attendance.map((log, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/20">
                                                            {log.userName[0]}
                                                        </div>
                                                        <span className="font-bold">{log.userName}</span>
                                                    </div>
                                                    <div className="text-xs font-bold opacity-40 flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        {log.joinedAt.toDate().toLocaleTimeString('ar-EG')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4 opacity-40">
                                        <AlertCircle className="w-12 h-12 mx-auto" />
                                        <p className="font-bold">لم يتم تسجيل أي حضور لهذه الجلسة بعد.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SessionCard({ session, onEnd, onReport, isActive }: { session: RecitationSession, onEnd?: () => void, onReport?: () => void, isActive?: boolean }) {
    return (
        <GlassCard className={cn(
            "p-8 space-y-6 group transition-all relative overflow-hidden",
            isActive ? "border-red-500/30 bg-red-500/5" : "border-white/5"
        )}>
            {isActive && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
            )}
            
            <div className="flex items-start justify-between relative z-10">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    session.type === 'video' ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-purple-500"
                )}>
                    {session.type === 'video' ? <Video className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </div>
                <div className="text-left">
                    <span className={cn(
                        "px-3 py-1 text-[10px] font-black rounded-full border tracking-widest uppercase",
                        isActive ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                        {isActive ? "بث مباشر" : "منتهية"}
                    </span>
                </div>
            </div>

            <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-black group-hover:text-primary transition-colors line-clamp-1">{session.title}</h3>
                <p className="text-xs font-bold opacity-40 flex items-center gap-2">
                    <Monitor className="w-3 h-3" /> {session.type === 'video' ? "تسميع مرئي" : "تسميع صوتي"}
                </p>
            </div>

            <div className="grid gap-3 relative z-10 pt-4">
                <a 
                    href={session.url} target="_blank" rel="noopener noreferrer"
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                >
                    <ExternalLink className="w-4 h-4" /> فتح الرابط الأصلي
                </a>
                <div className="flex gap-2">
                    <button 
                        onClick={onReport}
                        className="flex-1 py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                    >
                        <Users className="w-4 h-4" /> السجل
                    </button>
                    {isActive && (
                        <button 
                            onClick={onEnd}
                            className="flex-1 py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                        >
                            <X className="w-4 h-4" /> إنهاء
                        </button>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
