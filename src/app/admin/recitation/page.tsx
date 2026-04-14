"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs, orderBy, collectionGroup } from "firebase/firestore";
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
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    ChevronLeft,
    Monitor,
    Shield,
    GraduationCap,
    Globe,
    BookOpen,
    Pencil,
    Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { detectMeetingProvider, meetingProviderOptions, normalizeMeetingUrl } from "@/lib/meeting-links";
import { deleteRecitationSession, updateRecitationSession } from "@/lib/recitation-service";
import { Timestamp } from "firebase/firestore";

interface Target {
    id: string;
    name: string;
}

interface StudentOption {
    id: string;
    displayName?: string;
    email?: string;
}

interface AttendanceLog {
    id?: string;
    userName: string;
    joinedAt: Timestamp;
}

export default function AdminRecitationManagement() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<RecitationSession[]>([]);
    const [groups, setGroups] = useState<Target[]>([]);
    const [courses, setCourses] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState<'video' | 'audio'>('video');
    const [targetType, setTargetType] = useState<'group' | 'course' | 'individual' | 'all'>('group');
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    
    // Students handling
    const [groupStudents, setGroupStudents] = useState<StudentOption[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearchQ, setStudentSearchQ] = useState("");
    const [urlFeedback, setUrlFeedback] = useState("");
    const [editingSession, setEditingSession] = useState<RecitationSession | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [editType, setEditType] = useState<'video' | 'audio'>('video');
    
    // Attendance Report State
    const [reportSession, setReportSession] = useState<RecitationSession | null>(null);
    const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        // Fetch All Groups & Courses
        const fetchData = async () => {
            const [gSnap, cSnap] = await Promise.all([
                getDocs(collection(db, "groups")),
                getDocs(collection(db, "courses"))
            ]);
            setGroups(gSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
            setCourses(cSnap.docs.map(doc => ({ id: doc.id, name: doc.data().title })));
        };
        fetchData();

        // Fetch All Sessions (using Collection Group to see teacher sessions too)
        const qSessions = query(
            collectionGroup(db, "recitation_sessions"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(qSessions, (snapshot) => {
            setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecitationSession)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Students when targetType is individual (fetch all globally for admin)
    useEffect(() => {
        if (targetType !== 'individual') {
            setGroupStudents([]);
            return;
        }
        
        const fetchStudents = async () => {
            setLoadingStudents(true);
            // Limit 500 to avoid crash, fetching all students
            const q = query(collection(db, "users"), where("role", "==", "student"));
            const snap = await getDocs(q);
            setGroupStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingStudents(false);
        };
        fetchStudents();
    }, [targetType]);

    // Derived state for searching students locally
    const filteredStudents = groupStudents.filter(s => 
        (s.displayName || "").toLowerCase().includes(studentSearchQ.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(studentSearchQ.toLowerCase())
    ).slice(0, 50); // Show max 50 for UI performance

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
                if (targetType === 'course') selectedCourseIds.forEach(id => selectedTargets.push({id, type: 'course'}));
                if (targetType === 'individual') selectedStudentIds.forEach(id => selectedTargets.push({id, type: 'individual'}));

                await createRecitationSession({
                    title,
                    url: normalizedUrl.normalized,
                    type,
                    creatorId: user.uid,
                    creatorName: user.displayName || "المشرف العام",
                    targetType
                }, selectedTargets);
                setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setTitle(""); setUrl(""); setTargetType('group'); setSelectedGroupIds([]); setSelectedCourseIds([]); setSelectedStudentIds([]); setStudentSearchQ("");
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

    const handleDelete = async (parentId: string, id: string) => {
        if (confirm("هل تريد حذف الجلسة نهائياً؟ سيتم حذف السجل المرتبط بها.")) {
            await deleteRecitationSession(parentId, id);
        }
    };

    const openEditModal = (session: RecitationSession) => {
        setEditingSession(session);
        setEditTitle(session.title);
        setEditUrl(session.url);
        setEditType(session.type);
    };

    const handleUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSession?.id || !editTitle || !editUrl) return;
        const normalized = normalizeMeetingUrl(editUrl);
        if (normalized.error) {
            setUrlFeedback(normalized.error);
            return;
        }
        setSaving(true);
        try {
            await updateRecitationSession(editingSession.parentId, editingSession.id, {
                title: editTitle,
                url: normalized.normalized,
                type: editType
            });
            setEditingSession(null);
            setUrlFeedback("");
        } finally {
            setSaving(false);
        }
    };

    const handleViewReport = async (session: RecitationSession) => {
        setReportSession(session);
        setLoadingReport(true);
        try {
            const data = await getSessionAttendance(session.id!);
            setAttendance(data);
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
        <div className="space-y-10 pb-24 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Link href="/admin" className="p-2 hover:bg-primary/10 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 ltr:rotate-180" /></Link>
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">غرفة التحكم والعمليات</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
                        الرقابة العامة على التسميع
                        <span className="px-4 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full border border-primary/20">ADMIN HUB</span>
                    </h1>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-6 h-6" />
                    بدء جلسة إشرافية عامة
                </button>
            </div>

            {/* Active Sessions Grid */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <h2 className="text-xl font-black italic">الجلسات الجارية عبر المنصة ({activeSessions.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map(session => (
                        <AdminSessionCard 
                            key={session.id} 
                            session={session} 
                            onEnd={() => handleEnd(session.parentId, session.id!)} 
                            onDelete={() => handleDelete(session.parentId, session.id!)}
                            onEdit={() => openEditModal(session)}
                            onReport={() => handleViewReport(session)}
                            isActive
                        />
                    ))}
                    {activeSessions.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[2.5rem] opacity-30 grayscale">
                            <p className="text-sm font-bold">لا توجد جلسات نشطة حالياً تحت المراقبة.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Past Sessions Table */}
            {pastSessions.length > 0 && (
                <section className="space-y-6 pt-10">
                    <div className="flex items-center gap-3 px-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-xl font-black italic opacity-60 px-2">أرشيف الجلسات والفعاليات السابقة</h2>
                    </div>
                    <GlassCard className="overflow-hidden border-white/5 bg-white/[0.01]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest opacity-40">الجلسة</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest opacity-40">بواسطة</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest opacity-40">الهدف</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest opacity-40">التوقيت</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest opacity-40">التقارير</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pastSessions.map(session => (
                                        <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-5 font-bold">
                                                <div className="flex items-center gap-3">
                                                    {session.type === 'video' ? <Video className="w-4 h-4 text-blue-500" /> : <Mic className="w-4 h-4 text-purple-500" />}
                                                    {session.title}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-sm font-bold opacity-80">{session.creatorName}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20">
                                                    {targetTypeLabel(session)}
                                                </span>
                                            </td>
                                            <td className="p-5 text-xs font-bold opacity-40">
                                                {session.createdAt.toDate().toLocaleString('ar-EG')}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => handleViewReport(session)}
                                                        className="flex items-center gap-2 text-primary font-black text-xs hover:underline decoration-2 underline-offset-4"
                                                    >
                                                        <Users className="w-3 h-3" /> سجل الحضور
                                                    </button>
                                                    <button onClick={() => openEditModal(session)} className="text-amber-500"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(session.parentId, session.id!)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
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
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full min-h-0 flex-col overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-background shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:max-h-[min(88dvh,calc(100dvh-2rem))] sm:rounded-[3rem] max-w-2xl"
                        >
                            <div className="flex shrink-0 items-center justify-between border-b border-white/5 p-6 md:p-10">
                                <div className="min-w-0 flex-1 space-y-1 pe-3">
                                    <h3 className="text-2xl font-black md:text-3xl">جلسة إشرافية جديدة</h3>
                                    <p className="text-xs text-primary font-bold tracking-widest uppercase">Global Recitation Control</p>
                                </div>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 transition-all hover:bg-red-500/10 hover:text-red-500"><X className="h-6 w-6" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
                            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-6 md:space-y-8 md:p-10 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black opacity-40 px-1 uppercase tracking-widest">عنوان البرمجة</label>
                                        <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الجلسة" className="w-full p-4 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black opacity-40 px-1 uppercase tracking-widest">نمط البث</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setType('video')} className={cn("flex-1 py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-sm transition-all", type === 'video' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10 opacity-40")}><Video className="w-4 h-4" /> فيديو</button>
                                            <button type="button" onClick={() => setType('audio')} className={cn("flex-1 py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-sm transition-all", type === 'audio' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10 opacity-40")}><Mic className="w-4 h-4" /> صوتي</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black opacity-40 px-1 uppercase tracking-widest">رابط البث (URL)</label>
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
                                    <input
                                        required
                                        type="text"
                                        value={url}
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
                                        placeholder="https://..."
                                        className="w-full p-4 rounded-2xl border bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none font-bold ltr text-right"
                                    />
                                    {urlFeedback && <p className="text-xs font-bold text-amber-500 px-1">{urlFeedback}</p>}
                                    {!urlFeedback && url && (
                                        <p className="text-[11px] font-bold text-primary/80 px-1">
                                            المنصة: {detectMeetingProvider(url) === "google-meet" ? "Google Meet" : detectMeetingProvider(url) === "zoom" ? "Zoom" : detectMeetingProvider(url) === "teams" ? "Microsoft Teams" : "رابط عام"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <label className="text-xs font-black opacity-40 px-1 uppercase tracking-widest">توجيه الاستهداف</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            {id: 'all', label: 'الكل', icon: Globe},
                                            {id: 'group', label: 'حلقة', icon: BookOpen},
                                            {id: 'course', label: 'دورة', icon: GraduationCap},
                                            {id: 'individual', label: 'طلاب', icon: Users}
                                        ].map(target => (
                                            <button
                                                key={target.id} type="button" onClick={() => { setTargetType(target.id as 'group' | 'course' | 'individual' | 'all'); setSelectedGroupIds([]); setSelectedCourseIds([]); setSelectedStudentIds([]); setStudentSearchQ(""); }}
                                                className={cn(
                                                    "py-4 rounded-2xl border flex flex-col items-center justify-center gap-2 font-black text-xs transition-all",
                                                    targetType === target.id ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 opacity-40"
                                                )}
                                            >
                                                <target.icon className="w-6 h-6" />
                                                {target.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {targetType === 'course' && (
                                    <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                                        <label className="text-xs font-black opacity-60 uppercase flex justify-between">
                                            <span>أشر لعدة دورات</span>
                                            <span>المحدد: {selectedCourseIds.length}</span>
                                        </label>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {courses.map(course => (
                                                <button
                                                    key={course.id} type="button"
                                                    onClick={() => setSelectedCourseIds(prev => prev.includes(course.id) ? prev.filter(id => id !== course.id) : [...prev, course.id])}
                                                    className={cn("p-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all", selectedCourseIds.includes(course.id) ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10 hover:border-white/30")}
                                                >
                                                    <span className="truncate">{course.name}</span>
                                                    {selectedCourseIds.includes(course.id) && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {targetType === 'group' && (
                                    <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                                        <label className="text-xs font-black opacity-60 uppercase flex justify-between">
                                            <span>أشر لعدة حلقات</span>
                                            <span>المحدد: {selectedGroupIds.length}</span>
                                        </label>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {groups.map(group => (
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

                                {targetType === 'individual' && (
                                    <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10">
                                        <div className="flex items-center justify-between gap-4">
                                            <input 
                                                type="text" placeholder="ابحث عن اسم الطالب من كافة الحلقات..." value={studentSearchQ} onChange={e => setStudentSearchQ(e.target.value)}
                                                className="flex-1 p-3 rounded-2xl border bg-black/10 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                                            />
                                            <span className="text-[10px] font-black opacity-60 uppercase shrink-0">المحدد: {selectedStudentIds.length}</span>
                                        </div>
                                        {loadingStudents ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {filteredStudents.map(student => (
                                                    <button
                                                        key={student.id} type="button" onClick={() => setSelectedStudentIds(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])}
                                                        className={cn("p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all", selectedStudentIds.includes(student.id) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 hover:border-white/30")}
                                                    >
                                                        <span className="truncate">{student.displayName}</span>
                                                        {selectedStudentIds.includes(student.id) && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                                    </button>
                                                ))}
                                                {filteredStudents.length === 0 && (
                                                    <p className="col-span-full py-8 text-center text-xs opacity-40 font-bold">لم يتم العثور على طالب يطابق البحث...</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                                <div className="shrink-0 border-t border-white/5 bg-background/95 p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:p-10 md:pt-6">
                                <button 
                                    disabled={saving} type="submit"
                                    className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary py-6 font-black text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Shield className="h-6 w-6" />}
                                    تنشيط البث فوراً عبر النظام
                                </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Same Attendance Modal... (Consider putting this in a shared component if needed) */}
            <AttendanceModal reportSession={reportSession} attendance={attendance} loading={loadingReport} onClose={() => setReportSession(null)} />
            <AnimatePresence>
                {editingSession && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingSession(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative z-10 flex w-full max-w-xl min-h-0 flex-col overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-background shadow-2xl sm:rounded-[2rem]">
                            <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/5 p-5 md:p-8">
                                <h3 className="text-xl font-black">تعديل جلسة التسميع</h3>
                                <button type="button" onClick={() => setEditingSession(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleUpdateSession} className="space-y-4 p-6 md:p-8">
                                <input required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-4 rounded-2xl border bg-white/5 outline-none" />
                                <input required value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full p-4 rounded-2xl border bg-white/5 outline-none ltr text-right" />
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setEditType('video')} className={cn("p-3 rounded-xl border font-bold", editType === 'video' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}>فيديو</button>
                                    <button type="button" onClick={() => setEditType('audio')} className={cn("p-3 rounded-xl border font-bold", editType === 'audio' ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10")}>صوتي</button>
                                </div>
                                <button disabled={saving} type="submit" className="w-full py-4 rounded-2xl bg-primary text-white font-black">{saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function targetTypeLabel(session: RecitationSession) {
    if (session.targetType === 'all') return "الكل (Global)";
    if (session.targetType === 'individual') return "طلاب مخصصين";
    if (session.targetType === 'group') return `تحديد حلقات`;
    if (session.targetType === 'course') return `تحديد دورات`;
    return session.targetType;
}

function AdminSessionCard({ session, onEnd, onReport, onEdit, onDelete, isActive }: { session: RecitationSession, onEnd?: () => void, onReport?: () => void, onEdit?: () => void, onDelete?: () => void, isActive?: boolean }) {
    return (
        <GlassCard className={cn(
            "p-10 space-y-8 group transition-all relative overflow-hidden",
            isActive ? "border-primary/40 bg-primary/[0.03]" : "border-white/5"
        )}>
            <div className="flex items-center justify-between relative z-10">
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.1)]", session.type === 'video' ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-purple-500")}>
                    {session.type === 'video' ? <Video className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </div>
                <div className="bg-white/5 rounded-2xl p-2 px-4 border border-white/5">
                    <span className="text-[10px] font-black uppercase opacity-40">مشرف الجلسة:</span>
                    <p className="text-xs font-black text-primary">{session.creatorName}</p>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-black group-hover:tracking-wider transition-all line-clamp-1">{session.title}</h3>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black flex items-center gap-2">
                        <Monitor className="w-3 h-3" /> {session.type === 'video' ? 'مرئي' : 'صوتي'}
                    </span>
                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-bold">
                        {session.targetType === 'all' ? 'عام' : session.targetType === 'group' ? 'حلقة' : 'مخصص'}
                    </span>
                </div>
            </div>

            <div className="grid gap-3 relative z-10 pt-6">
                <div className="flex gap-3">
                    <button onClick={onReport} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-sm flex items-center justify-center gap-3 border border-white/10 transition-all"><Users className="w-5 h-5" /> التقارير</button>
                    <button onClick={onEnd} className="flex-1 py-4 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 transition-all"><X className="w-5 h-5" /> إغلاق</button>
                </div>
                <div className="flex gap-3">
                    <button onClick={onEdit} className="flex-1 py-3 bg-amber-500/10 text-amber-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"><Pencil className="w-4 h-4" /> تعديل</button>
                    <button onClick={onDelete} className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"><Trash2 className="w-4 h-4" /> حذف</button>
                </div>
                <a href={session.url} target="_blank" className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all">فتح الرابط المباشر <ExternalLink className="w-5 h-5" /></a>
            </div>
        </GlassCard>
    );
}

function AttendanceModal({ reportSession, attendance, loading, onClose }: { reportSession: RecitationSession | null; attendance: AttendanceLog[]; loading: boolean; onClose: () => void }) {
    return (
        <AnimatePresence>
            {reportSession && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full min-h-0 flex-col overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-background shadow-2xl sm:max-h-[min(88dvh,calc(100dvh-2rem))] sm:rounded-[3rem] max-w-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-white/5 p-6 md:p-10">
                            <h3 className="text-xl font-black md:text-2xl">سجل التفاعل الحي</h3>
                            <button type="button" onClick={onClose} className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"><X className="h-6 w-6" /></button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 md:p-10 custom-scrollbar">
                            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div> : attendance.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10 mb-8">
                                        <span className="font-bold flex items-center gap-3"><Users className="w-6 h-6 text-primary" /> عدد المنضمين</span>
                                        <span className="text-3xl font-black">{attendance.length}</span>
                                    </div>
                                    <div className="grid gap-3">
                                        {attendance.map((log, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">{log.userName[0]}</div>
                                                    <span className="font-bold">{log.userName}</span>
                                                </div>
                                                <div className="text-[10px] font-black opacity-30 flex items-center gap-2 uppercase tracking-widest"><Clock className="w-3 h-3" /> {log.joinedAt.toDate().toLocaleTimeString('ar-EG')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4 opacity-40"><AlertCircle className="w-12 h-12 mx-auto" /><p className="font-black italic text-lg">لا توجد بيانات مشاركة حالية.</p></div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
