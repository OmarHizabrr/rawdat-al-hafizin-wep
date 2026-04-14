"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    getDoc,
    writeBatch,
    getDocs
} from "firebase/firestore";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Plus,
    Trash2,
    ArrowRight,
    Layers,
    Calendar,
    FileText,
    Video,
    Mic,
    Link as LinkIcon,
    X,
    Loader2,
    ExternalLink,
    CheckCircle2,
    BookOpen,
    Info,
    Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { getTargetActiveRecitationSessions, RecitationSession } from "@/lib/recitation-service";
import { CoursePlanTrack, DEFAULT_COURSE_TRACKS } from "@/lib/daily-wird";

interface Resource {
    id: string;
    title: string;
    url: string;
    type: 'pdf' | 'audio' | 'video' | 'link';
    addedAt: string;
}

interface LevelModel {
    id: string;
    name: string;
    startDate?: Timestamp;
    endDate?: Timestamp;
    resources: Resource[];
}

interface CourseModel {
    id: string;
    title: string;
    dailyMinPages?: number;
    dailyTargetMode?: "pages" | "range" | "both";
    planTracks?: CoursePlanTrack[];
}

export default function CourseDetailsManagement() {
    const { id } = useParams() as { id: string };
    const [course, setCourse] = useState<CourseModel | null>(null);
    const [levels, setLevels] = useState<LevelModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    // Level Modal State
    const [currentLevel, setCurrentLevel] = useState<Partial<LevelModel>>({ name: "" });

    // Resource Modal State
    const [currentResource, setCurrentResource] = useState<Partial<Resource>>({ type: 'pdf', title: "", url: "" });
    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [recitationSessions, setRecitationSessions] = useState<RecitationSession[]>([]);
    const [loadingRecitations, setLoadingRecitations] = useState(true);
    const [dailyMinPages, setDailyMinPages] = useState<number>(1);
    const [planTracks, setPlanTracks] = useState<CoursePlanTrack[]>([]);

    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'warning';
        title: string;
        description: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        description: ''
    });

    useEffect(() => {
        if (!id) return;

        // Fetch Course Info
        const fetchCourse = async () => {
            const snap = await getDoc(doc(db, "courses", id));
            if (snap.exists()) {
                const courseData = { id: snap.id, ...snap.data() } as CourseModel;
                setCourse(courseData);
                setDailyMinPages(courseData.dailyMinPages || 1);
                setPlanTracks(courseData.planTracks?.length ? courseData.planTracks : []);
            }
        };
        fetchCourse();

        // Realtime Levels
        const unsubscribe = onSnapshot(collection(db, "levels", id, "levels"), (snapshot) => {
            const levelsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as LevelModel[];
            setLevels(levelsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const loadRecitations = async () => {
            setLoadingRecitations(true);
            try {
                const sessions = await getTargetActiveRecitationSessions(id, "course");
                setRecitationSessions(sessions);
            } finally {
                setLoadingRecitations(false);
            }
        };
        void loadRecitations();
    }, [id]);

    const showDialog = (type: 'success' | 'danger' | 'warning', title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const handleLoadDefaultTracks = () => {
        setPlanTracks(DEFAULT_COURSE_TRACKS);
        if (dailyMinPages < 1) setDailyMinPages(1);
    };

    const handleTrackField = (index: number, field: "title" | "totalPages", value: string | number) => {
        setPlanTracks(prev => prev.map((track, idx) => {
            if (idx !== index) return track;
            if (field === "title") return { ...track, title: String(value) };
            return { ...track, totalPages: Number(value) || 0 };
        }));
    };

    const handleAddTrack = () => {
        setPlanTracks(prev => [...prev, {
            id: `track-${Date.now()}`,
            title: "",
            totalPages: 0
        }]);
    };

    const handleRemoveTrack = (index: number) => {
        setPlanTracks(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleSaveDailyPlan = async () => {
        if (!course) return;
        const validTracks = planTracks
            .map(track => ({ ...track, title: track.title.trim(), totalPages: Number(track.totalPages) || 0 }))
            .filter(track => track.title && track.totalPages > 0);

        if (validTracks.length === 0) {
            showDialog("warning", "لا توجد بيانات كافية", "أضف مسار حفظ واحداً على الأقل بعنوان وعدد صفحات صالح.");
            return;
        }

        setSaving(true);
        try {
            await updateDoc(doc(db, "courses", id), {
                dailyMinPages: Math.max(1, Number(dailyMinPages) || 1),
                dailyTargetMode: "both",
                planTracks: validTracks,
                updatedAt: serverTimestamp()
            });
            showDialog("success", "تم حفظ الخطة", "تم تحديث الحد الأدنى اليومي وخطة مجلدات الحفظ بنجاح.");
        } catch (error) {
            console.error(error);
            showDialog("danger", "تعذر الحفظ", "حدث خطأ أثناء حفظ إعدادات الخطة.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddLevel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLevel.name) return;
        setSaving(true);
        try {
            const levelId = doc(collection(db, "levels", id, "levels")).id;
            await setDoc(doc(db, "levels", id, "levels", levelId), {
                ...currentLevel,
                createdAt: serverTimestamp()
            });
            setIsLevelModalOpen(false);
            setCurrentLevel({ name: "" });
            showDialog('success', 'تمت الإضافة', `تم إنشاء المستوى "${currentLevel.name}" بنجاح.`);
        } catch (e) {
            console.error("Error adding level:", e);
            showDialog('danger', 'فشل الإضافة', 'حدث خطأ أثناء محاولة إنشاء المستوى.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLevel = async (levelId: string, name: string) => {
        showDialog('danger', 'حذف المستوى', `هل أنت متأكد من حذف مستوى "${name}"؟ سيتم حذف جميع الموارد التعليمية بداخله.`, async () => {
            try {
                const batch = writeBatch(db);
                
                // 1. Fetch and delete resources: levels/{courseId}/levels/{levelId}/resources
                const resSnap = await getDocs(collection(db, "levels", id, "levels", levelId, "resources"));
                resSnap.forEach((res: any) => batch.delete(res.ref));
                
                // 2. Delete level doc
                batch.delete(doc(db, "levels", id, "levels", levelId));
                
                await batch.commit();
                showDialog('success', 'تم الحذف', `تم حذف المستوى "${name}" وكافة موارده بنجاح.`);
            } catch (e) {
                console.error(e);
                showDialog('danger', 'فشل الحذف', 'حدث خطأ أثناء محاولة حذف المستوى.');
            }
        });
    };

    const handleOpenResourceModal = (levelId: string) => {
        setSelectedLevelId(levelId);
        setCurrentResource({ type: 'pdf', title: "", url: "" });
        setIsResourceModalOpen(true);
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLevelId || !currentResource.title || !currentResource.url) return;
        setSaving(true);

        try {
            const resourceId = doc(collection(db, "levels", id, "levels", selectedLevelId, "resources")).id;
            const resRef = doc(db, "levels", id, "levels", selectedLevelId, "resources", resourceId);
            
            await setDoc(resRef, {
                id: resourceId,
                title: currentResource.title,
                url: currentResource.url,
                type: currentResource.type,
                addedAt: serverTimestamp()
            });

            setIsResourceModalOpen(false);
            showDialog('success', 'تم الحفظ', `تمت إضافة المورد "${currentResource.title}" بنجاح.`);
        } catch (e) {
            console.error("Error adding resource:", e);
            showDialog('danger', 'فشل الحفظ', 'حدث خطأ أثناء إضافة المورد التعليمي.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteResource = async (levelId: string, resourceId: string, title: string) => {
        showDialog('warning', 'حذف المورد', `هل تريد حذف المورد "${title}"؟`, async () => {
            try {
                const resRef = doc(db, "levels", id, "levels", levelId, "resources", resourceId);
                await deleteDoc(resRef);
            } catch (e) {
                console.error(e);
            }
        });
    };

    const iconMap = {
        pdf: FileText,
        video: Video,
        audio: Mic,
        link: LinkIcon
    };

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return "";
        return new Date(timestamp.seconds * 1000).toLocaleDateString('ar-EG');
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-8 pb-20 px-4 max-w-6xl mx-auto">
            {/* Header section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md"
            >
                <Link 
                    href="/admin/courses" 
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all hover:scale-110 shadow-sm border border-white/5"
                >
                    <ArrowRight className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{course?.title || "تحميل..."}</h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Layout className="w-4 h-4 text-primary" />
                        هيكلية المستويات والمحتوى الرقمي
                    </p>
                </div>
            </motion.div>

            <GlassCard className="p-6 md:p-8 space-y-6 border-primary/20 bg-primary/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> إعداد خطة الورد اليومي</h2>
                        <p className="text-xs text-muted-foreground mt-1">الطالب يلتزم بالحد الأدنى اليومي ويمكنه الإنجاز أكثر.</p>
                    </div>
                    <button onClick={handleLoadDefaultTracks} className="px-4 py-2 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-colors">
                        تحميل المجلدات المتفق عليها
                    </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black opacity-60">الحد الأدنى اليومي (صفحات)</label>
                        <input type="number" min={1} value={dailyMinPages} onChange={(e) => setDailyMinPages(Number(e.target.value) || 1)} className="w-full p-3 rounded-xl border bg-background/60 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black opacity-60">وضع إدخال الطالب</label>
                        <div className="p-3 rounded-xl border bg-background/60 text-xs font-bold">الطريقتان معًا (عدد صفحات + من/إلى)</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black">مجلدات/مسارات الحفظ</h3>
                        <button onClick={handleAddTrack} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs font-bold hover:bg-white/20 transition-colors">إضافة مسار</button>
                    </div>
                    <div className="grid gap-3">
                        {planTracks.map((track, index) => (
                            <div key={track.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_44px] gap-2 items-center p-3 rounded-xl border border-white/10 bg-white/5">
                                <input
                                    value={track.title}
                                    onChange={(e) => handleTrackField(index, "title", e.target.value)}
                                    placeholder="اسم المجلد"
                                    className="w-full p-2.5 rounded-lg border bg-background/60 text-sm font-bold"
                                />
                                <input
                                    type="number"
                                    min={1}
                                    value={track.totalPages}
                                    onChange={(e) => handleTrackField(index, "totalPages", Number(e.target.value))}
                                    placeholder="عدد الصفحات"
                                    className="w-full p-2.5 rounded-lg border bg-background/60 text-sm font-bold"
                                />
                                <button onClick={() => handleRemoveTrack(index)} className="w-11 h-11 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {planTracks.length === 0 && (
                            <p className="text-xs opacity-60 p-4 rounded-xl border border-dashed border-white/10">لا توجد مسارات بعد. حمّل القائمة الافتراضية أو أضف يدويًا.</p>
                        )}
                    </div>
                </div>

                <button disabled={saving} onClick={handleSaveDailyPlan} className="w-full py-3.5 rounded-xl bg-primary text-white font-black text-sm shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {saving ? "جارٍ الحفظ..." : "حفظ إعدادات خطة الورد"}
                </button>
            </GlassCard>

            <GlassCard className="p-6 space-y-4 border-red-500/20 bg-red-500/5">
                <h2 className="text-lg font-black flex items-center gap-2 text-red-500">
                    <Video className="w-5 h-5" />
                    جلسات التسميع المرتبطة
                </h2>
                {loadingRecitations ? (
                    <div className="text-xs opacity-60 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحميل...</div>
                ) : recitationSessions.length === 0 ? (
                    <p className="text-sm opacity-60">لا توجد جلسات نشطة حالياً.</p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {recitationSessions.map((session) => (
                            <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-black text-sm truncate">{session.title}</p>
                                    <p className="text-[11px] opacity-60 mt-1">{session.creatorName}</p>
                                </div>
                                <a href={session.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-black text-white flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    فتح
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Levels Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Layers className="w-6 h-6 text-primary" />
                        مستويات الفهرس الرأسي
                    </h2>
                    <button
                        onClick={() => setIsLevelModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        إضافة مستوى جديد
                    </button>
                </div>

                <div className="grid gap-8">
                    <AnimatePresence mode="popLayout">
                        {levels.map((level, index) => (
                            <motion.div
                                key={level.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <GlassCard className="p-0 overflow-hidden group border-white/10 hover:border-primary/30 transition-all shadow-2xl bg-white/5">
                                    <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-start justify-between gap-6 bg-white/[0.02]">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold tracking-tight">{level.name}</h3>
                                            {level.startDate && level.endDate && (
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground/70 font-medium px-3 py-1.5 bg-white/5 rounded-full w-fit border border-white/5">
                                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                                    <span>الفترة: {formatDate(level.startDate)} إلى {formatDate(level.endDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteLevel(level.id, level.name)}
                                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all hover:text-white"
                                            title="حذف المستوى"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {/* Resources Section */}
                                    <LevelResources 
                                        courseId={id} 
                                        levelId={level.id} 
                                        handleDeleteResource={handleDeleteResource}
                                        handleOpenResourceModal={handleOpenResourceModal}
                                    />
                                </GlassCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {levels.length === 0 && !loading && (
                        <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                            <Layers className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
                            <p className="text-muted-foreground text-xl font-bold">لا توجد مستويات مضافة لهذا المسار حتى الآن.</p>
                            <button 
                                onClick={() => setIsLevelModalOpen(true)}
                                className="mt-6 px-8 py-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary text-white transition-all font-bold"
                            >
                                اضف المستوى الأول الآن
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals with AnimatePresence */}
            <AnimatePresence>
                {isLevelModalOpen && (
                    <Modal title="بناء مستوى علمي جديد" onClose={() => setIsLevelModalOpen(false)}>
                        <form onSubmit={handleAddLevel} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2 flex items-center gap-2">
                                    <Info className="w-3 h-3" />
                                    مسمى المستوى
                                </label>
                                <input
                                    autoFocus
                                    required
                                    value={currentLevel.name}
                                    onChange={e => setCurrentLevel({ ...currentLevel, name: e.target.value })}
                                    className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                    placeholder="مثلاً: المستوى التأسيسي"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">تحد تاريخ البدء</label>
                                    <input
                                        type="date"
                                        value={currentLevel.startDate ? formatDate(currentLevel.startDate).split('/').reverse().join('-') : ""}
                                        onChange={e => setCurrentLevel({ ...currentLevel, startDate: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined })}
                                        className="w-full p-3 rounded-xl border bg-background/50 font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">تحدد تاريخ الكتم</label>
                                    <input
                                        type="date"
                                        value={currentLevel.endDate ? formatDate(currentLevel.endDate).split('/').reverse().join('-') : ""}
                                        onChange={e => setCurrentLevel({ ...currentLevel, endDate: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined })}
                                        className="w-full p-3 rounded-xl border bg-background/50 font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsLevelModalOpen(false)} className="flex-1 py-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl font-bold transition-all">إلغاء</button>
                                <button 
                                    disabled={saving} 
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    تأكيد الإضافة
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {isResourceModalOpen && (
                    <Modal title="إضافة مورد رقمي" onClose={() => setIsResourceModalOpen(false)}>
                        <form onSubmit={handleAddResource} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">عنوان المورد</label>
                                <input
                                    required
                                    value={currentResource.title}
                                    onChange={e => setCurrentResource({ ...currentResource, title: e.target.value })}
                                    className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                    placeholder="ادخل عنوان المادة..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">نوع المحتوى</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['pdf', 'video', 'audio', 'link'] as const).map(type => {
                                        const Icon = iconMap[type];
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setCurrentResource({ ...currentResource, type: type })}
                                                className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${currentResource.type === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-background/50 hover:bg-white/5 opacity-60'}`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{type}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">الرابط المباشر (Direct URL)</label>
                                <input
                                    required
                                    type="url"
                                    value={currentResource.url}
                                    onChange={e => setCurrentResource({ ...currentResource, url: e.target.value })}
                                    className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all dir-ltr font-mono text-sm"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsResourceModalOpen(false)} className="flex-1 py-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl font-bold transition-all">إلغاء</button>
                                <button 
                                    disabled={saving} 
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    إدراج المورد
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            <EliteDialog
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
                onConfirm={() => {
                    if (dialogConfig.onConfirm) dialogConfig.onConfirm();
                    setDialogConfig({ ...dialogConfig, isOpen: false });
                }}
                title={dialogConfig.title}
                description={dialogConfig.description}
                type={dialogConfig.type as any}
                confirmText={dialogConfig.onConfirm ? "نعم، متأكد" : "حسناً"}
            />
        </div>
    );
}

function LevelResources({ courseId, levelId, handleDeleteResource, handleOpenResourceModal }: { 
    courseId: string, 
    levelId: string, 
    handleDeleteResource: (lId: string, rId: string, t: string) => void,
    handleOpenResourceModal: (lId: string) => void
}) {
    const [resources, setResources] = useState<Resource[]>([]);
    
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "levels", courseId, "levels", levelId, "resources"), (snap) => {
            setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource)));
        });
        return () => unsubscribe();
    }, [courseId, levelId]);

    const iconMap = {
        pdf: FileText,
        video: Video,
        audio: Mic,
        link: LinkIcon
    };

    return (
        <div className="p-8 bg-white/[0.01] space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                {resources.map(resource => {
                    const Icon = iconMap[resource.type || 'link'];
                    return (
                        <motion.div 
                            key={resource.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group/res hover:border-primary/20 transition-all"
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner border border-primary/10">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{resource.title}</p>
                                    <Link href={resource.url} target="_blank" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-mono tracking-tighter opacity-70 group-hover/res:opacity-100 transition-opacity">
                                        <ExternalLink className="w-3 h-3" />
                                        {resource.url.length > 30 ? resource.url.substring(0, 30) + '...' : resource.url}
                                    </Link>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteResource(levelId, resource.id, resource.title)}
                                className="opacity-0 group-hover/res:opacity-100 p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all hover:scale-110"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            <button
                onClick={() => handleOpenResourceModal(levelId)}
                className="w-full py-5 border-2 border-dashed border-white/10 rounded-[2rem] flex items-center justify-center gap-3 text-muted-foreground/60 hover:border-primary/40 hover:text-primary transition-all hover:bg-primary/5 font-bold"
            >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                </div>
                إضافة مورد تعليمي جديد (ملف، فيديو، صوت)
            </button>
        </div>
    );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-primary/5">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
