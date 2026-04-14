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
import { detectMeetingProvider, meetingProviderOptions, normalizeMeetingUrl } from "@/lib/meeting-links";

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
    const [targetType, setTargetType] = useState<'group' | 'individual'>('group');
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    
    const [groupStudents, setGroupStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearchQ, setStudentSearchQ] = useState("");
    const [urlFeedback, setUrlFeedback] = useState("");
    
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

    // Fetch Students of ALL Teacher's Groups
    useEffect(() => {
        if (targetType !== 'individual' || myGroups.length === 0) {
            setGroupStudents([]);
            return;
        }
        
        const fetchStudents = async () => {
            setLoadingStudents(true);
            const myGroupIds = myGroups.map(g => g.id).slice(0, 10); // Firestore max 10 for 'in'
            if (myGroupIds.length > 0) {
                const q = query(collection(db, "users"), where("groupId", "in", myGroupIds), where("role", "==", "student"));
                const snap = await getDocs(q);
                setGroupStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
            setLoadingStudents(false);
        };
        fetchStudents();
    }, [targetType, myGroups]);

    const filteredStudents = groupStudents.filter(s => 
        (s.displayName || "").toLowerCase().includes(studentSearchQ.toLowerCase())
    ).slice(0, 50);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !url) return;
        const normalizedUrl = normalizeMeetingUrl(url);
        if (normalizedUrl.error) {
            setUrlFeedback(normalizedUrl.error);
            return;
        }
        setSaving(true);
        try {
            const selectedTargets: {id: string, type: 'group'|'course'|'individual'}[] = [];
            if (targetType === 'group') selectedGroupIds.forEach(id => selectedTargets.push({id, type: 'group'}));
            if (targetType === 'individual') selectedStudentIds.forEach(id => selectedTargets.push({id, type: 'individual'}));

            await createRecitationSession({
                title,
                url: normalizedUrl.normalized,
                type,
                creatorId: user.uid,
                creatorName: user.displayName || "معلم",
                targetType: targetType
            }, selectedTargets);
            setIsModalOpen(false);
            setTitle(""); setUrl(""); setSelectedGroupIds([]); setSelectedStudentIds([]); setTargetType('group'); setStudentSearchQ("");
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handlePasteFromClipboard = async () => {
        if (!navigator.clipboard) {
            setUrlFeedback("المتصفح لا يدعم القراءة من الحافظة.");
            return;
        }
        try {
            const clipboardText = await navigator.clipboard.readText();
            const normalized = normalizeMeetingUrl(clipboardText);
            if (normalized.error) {
                setUrlFeedback("لم يتم العثور على رابط صالح في الحافظة.");
                return;
            }
            setUrl(normalized.normalized);
            setUrlFeedback("تم جلب الرابط من الحافظة بنجاح.");
        } catch {
            setUrlFeedback("تعذر الوصول للحافظة. اسمح بالإذن أو الصق يدوياً.");
        }
    };

    const handleProviderClick = async (providerUrl: string) => {
        window.open(providerUrl, "_blank", "noopener,noreferrer");
        await handlePasteFromClipboard();
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-4 md:p-8 rounded-[1.5rem] md:rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary mb-1 md:mb-2">
                        <Link href="/teachers" className="p-1.5 md:p-2 hover:bg-primary/10 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /></Link>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60">النظام الذكي للتسميع</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-3 md:gap-4">
                        إدارة التسميع المباشر
                        <span className="px-3 py-0.5 md:px-4 md:py-1 bg-red-500/10 text-red-500 text-[8px] md:text-[10px] font-black rounded-full border border-red-500/20 animate-pulse">BETA LIVE</span>
                    </h1>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 md:px-8 md:py-4 bg-primary text-white text-sm md:text-base font-black rounded-xl md:rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 md:gap-3 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
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
                                        <th className="p-3 md:p-4 text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40">عنوان الجلسة</th>
                                        <th className="p-3 md:p-4 text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40">المستهدف</th>
                                        <th className="p-3 md:p-4 text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40">التاريخ</th>
                                        <th className="p-3 md:p-4 text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pastSessions.map(session => (
                                        <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-3 md:p-4 font-bold text-sm md:text-base">{session.title}</td>
                                            <td className="p-3 md:p-4">
                                                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-primary/10 text-primary text-[8px] md:text-[10px] font-black rounded-md md:rounded-lg border border-primary/20">
                                                    {session.targetType === 'individual' ? 'طلاب' : `حلقات`}
                                                </span>
                                            </td>
                                            <td className="p-3 md:p-4 text-[10px] md:text-sm font-medium opacity-60">
                                                {session.createdAt.toDate().toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="p-3 md:p-4">
                                                <button 
                                                    onClick={() => handleViewReport(session)}
                                                    className="flex items-center gap-1.5 md:gap-2 text-primary font-bold text-[10px] md:text-sm hover:underline"
                                                >
                                                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4" /> السجل
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
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                         <motion.div 
                             initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                             className="relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full min-h-0 flex-col overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-background shadow-2xl sm:max-h-[min(88dvh,calc(100dvh-2rem))] sm:rounded-[2rem] md:rounded-[2.5rem] max-w-xl"
                         >
                             <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/5 p-5 md:p-8">
                                 <h3 className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3"><Radio className="w-5 h-5 md:w-6 md:h-6 text-red-500" /> إنشاء جلسة تسميع</h3>
                                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
                             </div>
                             <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
                             <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 md:p-8 space-y-5 md:space-y-6 custom-scrollbar">
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
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {meetingProviderOptions.map((provider) => (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                onClick={() => handleProviderClick(provider.createUrl)}
                                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold transition-colors hover:border-primary/40 hover:bg-primary/10"
                                            >
                                                {provider.label}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handlePasteFromClipboard}
                                            className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-primary/20"
                                        >
                                            جلب من الحافظة
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                        <input 
                                            required type="text" value={url}
                                            onChange={e => { setUrl(e.target.value); setUrlFeedback(""); }}
                                            onBlur={() => {
                                                if (!url.trim()) return;
                                                const normalized = normalizeMeetingUrl(url);
                                                if (normalized.error) {
                                                    setUrlFeedback(normalized.error);
                                                    return;
                                                }
                                                setUrl(normalized.normalized);
                                                setUrlFeedback("");
                                            }}
                                            placeholder="https://meet.google.com/..."
                                            className="w-full pl-6 pr-12 py-4 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none font-bold ltr text-right"
                                        />
                                    </div>
                                    {urlFeedback && <p className="text-xs font-bold text-amber-500 px-1">{urlFeedback}</p>}
                                    {!urlFeedback && url && (
                                        <p className="text-[11px] font-bold text-primary/80 px-1">
                                            المنصة: {detectMeetingProvider(url) === "google-meet" ? "Google Meet" : detectMeetingProvider(url) === "zoom" ? "Zoom" : detectMeetingProvider(url) === "teams" ? "Microsoft Teams" : "رابط عام"}
                                        </p>
                                    )}
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
                                </div>

                                {targetType === 'group' && (
                                    <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                                        <label className="text-xs font-black opacity-60 uppercase flex justify-between">
                                            <span>استهداف حلقات محددة</span>
                                            <span>المحدد: {selectedGroupIds.length}</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {myGroups.map(group => (
                                                <button
                                                    key={group.id} type="button"
                                                    onClick={() => setSelectedGroupIds(prev => prev.includes(group.id) ? prev.filter(id => id !== group.id) : [...prev, group.id])}
                                                    className={cn("p-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all", selectedGroupIds.includes(group.id) ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10 hover:border-white/30")}
                                                >
                                                    <span className="truncate">{group.name}</span>
                                                    {selectedGroupIds.includes(group.id) && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-sm font-black opacity-60 px-1">طريقة التوجيه</label>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" onClick={() => { setTargetType('group'); setSelectedGroupIds([]); setSelectedStudentIds([]); }}
                                            className={cn("flex-1 p-3 rounded-xl border font-bold transition-all", targetType === 'group' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}
                                        >
                                            طلاب حلقات معينة
                                        </button>
                                        <button 
                                            type="button" onClick={() => { setTargetType('individual'); setSelectedGroupIds([]); setSelectedStudentIds([]); setStudentSearchQ(""); }}
                                            className={cn("flex-1 p-3 rounded-xl border font-bold transition-all", targetType === 'individual' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}
                                        >
                                            طلاب محددون
                                        </button>
                                    </div>
                                </div>

                                {targetType === 'individual' && (
                                    <div className="space-y-4 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                                            <label className="text-sm font-black opacity-60 px-1 block">اختر الطلاب ({selectedStudentIds.length})</label>
                                            <input 
                                                type="text" placeholder="ابحث عن أسمائهم..." value={studentSearchQ} onChange={e => setStudentSearchQ(e.target.value)}
                                                className="w-full sm:w-auto flex-1 p-2 px-4 rounded-xl border bg-black/10 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-xs"
                                            />
                                        </div>
                                        {loadingStudents ? (
                                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {filteredStudents.map(student => (
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
                                                            "p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all group/btn",
                                                            selectedStudentIds.includes(student.id) 
                                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                                                : "bg-white/5 border-white/10 hover:border-white/30"
                                                        )}
                                                    >
                                                        <span className="truncate">{student.displayName}</span>
                                                        {selectedStudentIds.includes(student.id) && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                                    </button>
                                                ))}
                                                {filteredStudents.length === 0 && (
                                                    <p className="col-span-full py-6 text-center text-xs opacity-40 font-bold">لم يتم العثور على طالب يطابق البحث.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                                <div className="shrink-0 border-t border-white/5 bg-background/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8 md:pt-5 backdrop-blur-sm">
                                <button 
                                    disabled={saving} type="submit"
                                    className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                                    تفعيل الجلسة فوراً
                                </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Attendance Report Modal */}
            <AnimatePresence>
                {reportSession && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setReportSession(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full min-h-0 flex-col overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-background shadow-2xl sm:max-h-[min(88dvh,calc(100dvh-2rem))] sm:rounded-[2.5rem] max-w-2xl"
                        >
                             <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/5 p-5 md:p-8">
                                 <div className="space-y-0.5 md:space-y-1 min-w-0 pe-2">
                                     <h3 className="text-xl md:text-2xl font-black">تقرير المشاركة والحضور</h3>
                                     <p className="text-xs md:text-sm text-primary font-bold truncate">{reportSession.title}</p>
                                 </div>
                                 <button type="button" onClick={() => setReportSession(null)} className="shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
                             </div>
                             <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 md:p-8 custom-scrollbar">
                                 {loadingReport ? (
                                     <div className="py-16 md:py-20 text-center"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin mx-auto opacity-20" /></div>
                                 ) : attendance.length > 0 ? (
                                     <div className="space-y-4">
                                         <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl md:rounded-2xl border border-primary/20 mb-4 md:mb-6">
                                             <span className="font-bold text-sm md:text-base flex items-center gap-2"><Users className="w-4 h-4 md:w-5 md:h-5" /> إجمالي المشاركين</span>
                                             <span className="text-xl md:text-2xl font-black">{attendance.length}</span>
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
             "p-5 md:p-8 space-y-5 md:space-y-6 group transition-all relative overflow-hidden",
             isActive ? "border-red-500/30 bg-red-500/5" : "border-white/5"
         )}>
            {isActive && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
            )}
            
             <div className="flex items-start justify-between relative z-10">
                 <div className={cn(
                     "w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] md:rounded-2xl flex items-center justify-center shadow-lg",
                     session.type === 'video' ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-purple-500"
                 )}>
                     {session.type === 'video' ? <Video className="w-6 h-6 md:w-7 md:h-7" /> : <Mic className="w-6 h-6 md:w-7 md:h-7" />}
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
