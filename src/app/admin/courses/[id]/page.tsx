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
    getDoc
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
    ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

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

    useEffect(() => {
        if (!id) return;

        // Fetch Course Info
        const fetchCourse = async () => {
            const snap = await getDoc(doc(db, "courses", id));
            if (snap.exists()) {
                setCourse({ id: snap.id, ...snap.data() } as CourseModel);
            }
        };
        fetchCourse();

        // Realtime Levels
        const unsubscribe = onSnapshot(collection(db, "courses", id, "levels"), (snapshot) => {
            const levelsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as LevelModel[];
            setLevels(levelsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);

    const handleAddLevel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLevel.name) return;
        setSaving(true);
        try {
            const levelId = doc(collection(db, "courses", id, "levels")).id;
            await setDoc(doc(db, "courses", id, "levels", levelId), {
                ...currentLevel,
                resources: []
            });
            setIsLevelModalOpen(false);
            setCurrentLevel({ name: "" });
        } catch (e) {
            console.error("Error adding level:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLevel = async (levelId: string) => {
        if (confirm("هل أنت متأكد من حذف هذا المستوى؟")) {
            try {
                await deleteDoc(doc(db, "courses", id, "levels", levelId));
            } catch (e) {
                console.error(e);
            }
        }
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
            const levelRef = doc(db, "courses", id, "levels", selectedLevelId);
            const levelDoc = levels.find(l => l.id === selectedLevelId);
            if (!levelDoc) return;

            const newResource = {
                id: Date.now().toString(),
                title: currentResource.title,
                url: currentResource.url,
                type: currentResource.type,
                addedAt: new Date().toISOString()
            };

            const updatedResources = [...(levelDoc.resources || []), newResource];

            await updateDoc(levelRef, {
                resources: updatedResources
            });

            setIsResourceModalOpen(false);
        } catch (e) {
            console.error("Error adding resource:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteResource = async (levelId: string, resourceId: string) => {
        if (!confirm("حذف هذا المورد؟")) return;
        try {
            const levelRef = doc(db, "courses", id, "levels", levelId);
            const levelDoc = levels.find(l => l.id === levelId);
            if (!levelDoc) return;

            const updatedResources = levelDoc.resources.filter(r => r.id !== resourceId);
            await updateDoc(levelRef, { resources: updatedResources });
        } catch (e) {
            console.error(e);
        }
    };

    const iconMap = {
        pdf: FileText,
        video: Video,
        audio: Mic,
        link: LinkIcon
    };

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return "";
        return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/courses" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowRight className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{course?.title || "تحميل..."}</h1>
                    <p className="text-muted-foreground">إدارة المستويات والموارد التعليمية</p>
                </div>
            </div>

            {/* Levels List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" />
                        المستويات
                    </h2>
                    <button
                        onClick={() => setIsLevelModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة مستوى
                    </button>
                </div>

                <div className="grid gap-6">
                    {levels.map(level => (
                        <GlassCard key={level.id} className="p-6 space-y-4">
                            <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/5 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{level.name}</h3>
                                    {level.startDate && level.endDate && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatDate(level.startDate)} - {formatDate(level.endDate)}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteLevel(level.id)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Resources */}
                            <div className="space-y-3">
                                {level.resources?.map(resource => {
                                    const Icon = iconMap[resource.type || 'link'];
                                    return (
                                        <div key={resource.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-lg bg-white dark:bg-black/20 text-primary shadow-sm`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{resource.title}</p>
                                                    <Link href={resource.url} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                        {resource.url}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteResource(level.id, resource.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={() => handleOpenResourceModal(level.id)}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة مورد جديد
                                </button>
                            </div>
                        </GlassCard>
                    ))}

                    {levels.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed">
                            لا توجد مستويات مضافة بعد.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Level Modal */}
            <AnimatePresence>
                {isLevelModalOpen && (
                    <Modal title="إضافة مستوى جديد" onClose={() => setIsLevelModalOpen(false)}>
                        <form onSubmit={handleAddLevel} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">اسم المستوى</label>
                                <input
                                    autoFocus
                                    required
                                    value={currentLevel.name}
                                    onChange={e => setCurrentLevel({ ...currentLevel, name: e.target.value })}
                                    className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="المستوى الأول..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">تاريخ البدء</label>
                                    <input
                                        type="date"
                                        value={currentLevel.startDate ? formatDate(currentLevel.startDate) : ""}
                                        onChange={e => setCurrentLevel({ ...currentLevel, startDate: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined })}
                                        className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">تاريخ الانتهاء</label>
                                    <input
                                        type="date"
                                        value={currentLevel.endDate ? formatDate(currentLevel.endDate) : ""}
                                        onChange={e => setCurrentLevel({ ...currentLevel, endDate: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined })}
                                        className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsLevelModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100">إلغاء</button>
                                <button disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    إضافة
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Add Resource Modal */}
            <AnimatePresence>
                {isResourceModalOpen && (
                    <Modal title="إضافة مورد جديد" onClose={() => setIsResourceModalOpen(false)}>
                        <form onSubmit={handleAddResource} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">عنوان المورد</label>
                                <input
                                    required
                                    value={currentResource.title}
                                    onChange={e => setCurrentResource({ ...currentResource, title: e.target.value })}
                                    className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="كتاب التجويد..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">نوع المورد</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['pdf', 'video', 'audio', 'link'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setCurrentResource({ ...currentResource, type: type as any })}
                                            className={`p-2 rounded-lg border text-sm capitalize ${currentResource.type === type ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">الرابط (URL)</label>
                                <input
                                    required
                                    type="url"
                                    value={currentResource.url}
                                    onChange={e => setCurrentResource({ ...currentResource, url: e.target.value })}
                                    className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 dir-ltr"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsResourceModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100">إلغاء</button>
                                <button disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    إضافة
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-background rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
