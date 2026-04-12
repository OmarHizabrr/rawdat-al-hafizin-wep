"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    writeBatch,
    getDocs,
    query
} from "firebase/firestore";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { EliteModal } from "@/components/ui/EliteModal";
import { 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    BookOpen, 
    Calendar, 
    DollarSign, 
    Monitor, 
    X, 
    Loader2, 
    ChevronRight, 
    Layers, 
    Eye, 
    Lock, 
    Globe,
    Library,
    Info,
    CheckCircle2,
    Check,
} from "lucide-react";
import { SUNNAH_VOLUMES } from "@/lib/volumes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PlanTemplate } from "@/types/plan";

interface CourseModel {
    id: string;
    title: string;
    description: string;
    cost: string;
    mechanism: string;
    features: string[];
    startDate?: Timestamp;
    endDate?: Timestamp;
    registrationStart?: Timestamp;
    registrationEnd?: Timestamp;
    socialLinks?: { type: 'whatsapp' | 'telegram' | 'facebook' | 'other', url: string, label?: string }[];
    conditions?: string[];
    visibility?: 'public' | 'private';
    folderId?: string; // Legacy field for compatibility
    selectedVolumeIds?: string[];
    planTemplateId?: string;
}

const initialCourseState: Partial<CourseModel> = {
    title: "",
    description: "",
    mechanism: "",
    features: [],
    socialLinks: [{ type: 'whatsapp', url: '', label: 'مجموعة الواتساب' }],
    conditions: [""],
    visibility: 'public',
    selectedVolumeIds: [],
};

export default function CoursesDashboard() {
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<Partial<CourseModel>>(initialCourseState);
    const [templates, setTemplates] = useState<PlanTemplate[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // Temporary state for inputs
    const [featuresInput, setFeaturesInput] = useState<string[]>([""]);
    const [conditionsInput, setConditionsInput] = useState<string[]>([""]);
    const [socialLinksInput, setSocialLinksInput] = useState<CourseModel['socialLinks']>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
            const coursesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CourseModel[];
            setCourses(coursesData);
            setLoading(false);
        });

        // Fetch Plan Templates
        const unsubTemplates = onSnapshot(collection(db, "plan_templates"), (snap) => {
            setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanTemplate[]);
        });

        return () => {
            unsubscribe();
            unsubTemplates();
        };
    }, []);

    useEffect(() => {
        if (currentCourse.features) {
            setFeaturesInput(currentCourse.features.length > 0 ? currentCourse.features : [""]);
        }
        if (currentCourse.conditions) {
            setConditionsInput(currentCourse.conditions.length > 0 ? currentCourse.conditions : [""]);
        }
        if (currentCourse.socialLinks) {
            setSocialLinksInput(currentCourse.socialLinks.length > 0 ? currentCourse.socialLinks : [{ type: 'whatsapp', url: '', label: 'مجموعة الواتساب' }]);
        }
    }, [currentCourse]);

    const handleAdd = () => {
        setCurrentCourse({ ...initialCourseState, id: doc(collection(db, "courses")).id });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = async (course: CourseModel) => {
        setSaving(true);
        try {
            const volsSnap = await getDocs(collection(db, "course_volumes", course.id, "course_volumes"));
            const vols = volsSnap.docs.map(d => d.data().volumeId);
            setCurrentCourse({ ...course, selectedVolumeIds: vols });
            setIsEditing(true);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error fetching course volumes:", error);
            setCurrentCourse(course);
            setIsEditing(true);
            setIsModalOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return "";
        return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
    };

    const handleDateChange = (field: keyof CourseModel, value: string) => {
        const date = value ? Timestamp.fromDate(new Date(value)) : null;
        setCurrentCourse(prev => ({ ...prev, [field]: date }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const validFeatures = featuresInput.filter(f => f.trim().length > 0);

        try {
            const courseData = {
                ...currentCourse,
                features: validFeatures,
                conditions: conditionsInput.filter(c => c.trim().length > 0),
                socialLinks: socialLinksInput?.filter(s => s.url.trim().length > 0),
                updatedAt: serverTimestamp()
            };

            const batch = writeBatch(db);
            const courseId = isEditing && currentCourse.id ? currentCourse.id : doc(collection(db, "courses")).id;
            
            const mainCourseRef = doc(db, "courses", courseId);
            batch.set(mainCourseRef, {
                ...courseData,
                id: courseId,
                selectedVolumeIds: null 
            }, { merge: true });

            if (isEditing) {
                const oldVols = await getDocs(collection(db, "course_volumes", courseId, "course_volumes"));
                oldVols.forEach(v => batch.delete(v.ref));
            }

            if (currentCourse.selectedVolumeIds) {
                currentCourse.selectedVolumeIds.forEach(vid => {
                    const volRef = doc(db, "course_volumes", courseId, "course_volumes", vid);
                    batch.set(volRef, { courseId, volumeId: vid, createdAt: serverTimestamp() });
                });
            }

            await batch.commit();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving course:", error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("🚨 هل أنت متأكد تماماً من حذف هذه الدورة؟\nسيتم حذف جميع المستويات، الموارد، التسجيلات، وقائمة الأعضاء المرتبطة بها نهائياً ولا يمكن التراجع عن ذلك.")) {
            try {
                const batch = writeBatch(db);

                const levelsSnap = await getDocs(collection(db, "levels", id, "levels"));
                for (const levelDoc of levelsSnap.docs) {
                    const resSnap = await getDocs(collection(db, "levels", id, "levels", levelDoc.id, "resources"));
                    resSnap.forEach((res) => batch.delete(res.ref));
                    batch.delete(levelDoc.ref);
                }

                const enrollmentsSnap = await getDocs(collection(db, "enrollments", id, "enrollments"));
                enrollmentsSnap.forEach((doc) => batch.delete(doc.ref));

                const membersSnap = await getDocs(collection(db, "members", id, "members"));
                membersSnap.forEach((doc) => batch.delete(doc.ref));

                const logsSnap = await getDocs(collection(db, "daily_logs", id, "daily_logs"));
                logsSnap.forEach((doc) => batch.delete(doc.ref));

                const examsSnap = await getDocs(collection(db, "exams", id, "exams"));
                examsSnap.forEach((doc) => batch.delete(doc.ref));

                const plansSnap = await getDocs(collection(db, "course_plans", id, "course_plans"));
                plansSnap.forEach((doc) => batch.delete(doc.ref));

                const volumesSnap = await getDocs(collection(db, "course_volumes", id, "course_volumes"));
                volumesSnap.forEach((doc) => batch.delete(doc.ref));

                batch.delete(doc(db, "courses", id));

                await batch.commit();
                alert("تم حذف الدورة وكافة ارتباطاتها بنجاح.");
            } catch (error) {
                console.error("Error deleting course and its associations:", error);
                alert("حدث خطأ أثناء محاولة الحذف الكامل.");
            }
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden card-shine">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-[1rem] flex items-center justify-center border border-primary/20 shadow-inner">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-elite-gradient">منارات المعرفة</h1>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium opacity-70 italic">هندسة المسارات التعليمية وإدارة المحتوى الأكاديمي للدورات</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 relative z-10">
                    <div className="relative group min-w-[280px]">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                        <input
                            type="text"
                            placeholder="بحث عن مسار..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-6 pr-12 py-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-bold text-sm"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="btn-elite-primary px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm shadow-2xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إنشاء مسار جديد</span>
                    </button>
                </div>
            </div>

            {/* Courses List */}
            <div className="grid gap-4">
                {filteredCourses.map(course => (
                    <GlassCard key={course.id} className="p-0 overflow-hidden hover:border-primary/40 transition-all duration-500 border-white/5 card-shine group rounded-[1.5rem]">
                        <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-inner">
                                            <BookOpen className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight">{course.title}</h3>
                                            <div className="flex gap-1.5 mt-0.5">
                                                {course.visibility === 'private' && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black border border-amber-500/20 uppercase tracking-widest shadow-lg shadow-amber-500/5">
                                                        <Lock className="w-2.5 h-2.5" /> مسار خاص
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black border border-primary/20 uppercase tracking-widest shadow-lg shadow-primary/5">
                                                    <Info className="w-2.5 h-2.5" /> {course.mechanism}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 shadow-inner">
                                        <Link
                                            href={`/admin/courses/${course.id}/members`}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-xl text-primary transition-all border border-transparent hover:border-primary/20"
                                            title="الأعضاء"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Link>
                                        <Link
                                            href={`/admin/courses/${course.id}/plan`}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-amber-500/10 rounded-xl text-amber-500 transition-all border border-transparent hover:border-amber-500/20"
                                            title="الخطة"
                                        >
                                            <Calendar className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-blue-500/10 rounded-xl text-blue-500 transition-all border border-transparent hover:border-blue-500/20"
                                            title="تعديل"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(course.id)}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-red-500/10 rounded-xl text-red-500 transition-all border border-transparent hover:border-red-500/20"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-muted-foreground line-clamp-3 text-base font-medium opacity-80 leading-relaxed font-arabic">{course.description}</p>
 
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-3 text-arabic">
                                    <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <Calendar className="w-4 h-4 text-primary opacity-60" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">الفترة الزمنية</span>
                                            <span className="text-xs font-bold">{formatDate(course.startDate)} - {formatDate(course.endDate)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <Library className="w-4 h-4 text-primary opacity-60" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">المجلدات المرتبطة</span>
                                            <span className="text-xs font-bold">
                                                {course.selectedVolumeIds?.length 
                                                    ? `${course.selectedVolumeIds.length} مجلدات`
                                                    : SUNNAH_VOLUMES.find(v => v.id === course.folderId)?.title || "لا يوجد ربط"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <DollarSign className="w-4 h-4 text-primary opacity-60" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">تكلفة الانضمام</span>
                                            <span className="text-xs font-bold text-elite-gradient">{course.cost}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
 
                            <div className="flex items-center justify-center lg:justify-end border-t lg:border-t-0 lg:border-r border-white/10 pt-6 lg:pt-0 lg:pr-8">
                                <Link
                                    href={`/admin/courses/${course.id}`}
                                    className="btn-elite px-8 py-4 rounded-[1.2rem] flex items-center justify-center gap-3 font-black text-xs group/btn w-full lg:w-fit"
                                >
                                    <Layers className="w-5 h-5" />
                                    <span>المستويات والموارد</span>
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-[-3px] transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Modal */}
            <EliteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'تعديل المسار التعليمي' : 'إنشاء مسار تعليمي جديد'}
                description="تحديد الخصائص، الفترة الزمنية، وبنية المسار الأكاديمي"
                maxWidth="3xl"
                footer={(
                    <>
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)} 
                            className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-black transition-all text-sm text-arabic"
                        >
                            إلغاء المعاملة
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            form="courseForm"
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 btn-elite text-sm text-arabic"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                            <span>حفظ واعتماد المسار</span>
                        </button>
                    </>
                )}
            >
                <div className="p-2 overflow-y-auto max-h-[65vh] custom-scrollbar text-arabic">
                    <form id="courseForm" onSubmit={handleSave} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">مسمى المسار</label>
                                <input
                                    required
                                    type="text"
                                    value={currentCourse.title}
                                    onChange={e => setCurrentCourse({ ...currentCourse, title: e.target.value })}
                                    className="w-full p-5 rounded-[1.5rem] border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-black text-lg"
                                    placeholder="مثلاً: دورة معالم السنن 1"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">الوصف الأكاديمي</label>
                                <textarea
                                    required
                                    value={currentCourse.description}
                                    onChange={e => setCurrentCourse({ ...currentCourse, description: e.target.value })}
                                    className="w-full h-32 p-5 rounded-[1.5rem] border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all resize-none font-bold text-sm"
                                    placeholder="اكتب وصفاً جذاباً وشاملاً للمحيط التعليمي..."
                                />
                            </div>
                            
                            <div className="space-y-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/20 md:col-span-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                <label className="text-[11px] font-black flex items-center gap-2 relative z-10">
                                    <Library className="w-4 h-4 text-primary" /> الربط بالمجلدات العلمية
                                </label>
                                
                                <div className="relative group/multiselect z-10">
                                    <div className="flex flex-wrap gap-2 p-4 bg-slate-900/50 border border-white/10 rounded-2xl min-h-[64px] focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                                        {(currentCourse.selectedVolumeIds || []).length ? (
                                            (currentCourse.selectedVolumeIds || []).map(vId => {
                                                const vol = SUNNAH_VOLUMES.find(v => v.id === vId);
                                                return (
                                                    <div key={vId} className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-xl text-[10px] font-black shadow-lg">
                                                        <span>{vol?.title}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const next = (currentCourse.selectedVolumeIds || []).filter(id => id !== vId);
                                                                setCurrentCourse({ ...currentCourse, selectedVolumeIds: next });
                                                            }}
                                                            className="hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-xs text-muted-foreground/40 self-center px-1 font-bold">لم يتم اختيار أي مجلدات بعد...</span>
                                        )}
                                    </div>
                                    
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-black/40 border border-white/10 rounded-2xl custom-scrollbar">
                                        {SUNNAH_VOLUMES.map(vol => {
                                            const isSelected = currentCourse.selectedVolumeIds?.includes(vol.id) || false;
                                            return (
                                                <button
                                                    key={vol.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const selected = currentCourse.selectedVolumeIds || [];
                                                        if (isSelected) {
                                                            setCurrentCourse({ ...currentCourse, selectedVolumeIds: selected.filter(id => id !== vol.id) });
                                                        } else {
                                                            setCurrentCourse({ ...currentCourse, selectedVolumeIds: [...selected, vol.id] });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl text-right transition-all border",
                                                        isSelected ? "bg-primary/20 border-primary text-white shadow-xl shadow-primary/10" : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn("w-5 h-5 rounded-lg border flex items-center justify-center shrink-0", isSelected ? "border-primary bg-primary text-white shadow-lg" : "border-white/20")}>
                                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black">{vol.title}</span>
                                                        <span className="text-[10px] opacity-40 font-bold">{vol.totalPages} صفحة مباركة</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
 
                            <div className="space-y-4 p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 md:col-span-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                <div className="flex items-center justify-between relative z-10">
                                    <label className="text-[11px] font-black flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-amber-500" /> ربط قالب الخطة (Plan Template)
                                    </label>
                                    {currentCourse.planTemplateId && (
                                        <div className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase tracking-tighter shadow-lg shadow-amber-500/20">قالب نشط</div>
                                    )}
                                </div>
                                <select
                                    value={currentCourse.planTemplateId || ""}
                                    onChange={e => setCurrentCourse({ ...currentCourse, planTemplateId: e.target.value })}
                                    className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl focus:ring-8 focus:ring-amber-500/5 outline-none transition-all font-black text-sm appearance-none relative z-10"
                                >
                                    <option value="">-- اختر قالب الخطة الذهبية (اختياري) --</option>
                                    {templates.map(tpl => (
                                        <option key={tpl.id} value={tpl.id}>
                                            {tpl.name} ({tpl.tiers.length} طبقات)
                                        </option>
                                    ))}
                                </select>
                            </div>
 
                            <div className="space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/10 md:col-span-2">
                                <label className="text-[11px] font-black block mb-4 uppercase tracking-widest text-muted-foreground px-2">إعدادات الخصوصية</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentCourse({ ...currentCourse, visibility: 'public' })}
                                        className={cn(
                                            "flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                                            currentCourse.visibility === 'public'
                                                ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-105"
                                                : "bg-background border-white/5 opacity-40 grayscale"
                                        )}
                                    >
                                        <Globe className="w-6 h-6" />
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase tracking-widest">مسار عام للجميع</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentCourse({ ...currentCourse, visibility: 'private' })}
                                        className={cn(
                                            "flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                                            currentCourse.visibility === 'private'
                                                ? "bg-amber-600 text-white border-amber-600 shadow-2xl shadow-amber-600/20 scale-105"
                                                : "bg-background border-white/5 opacity-40 grayscale"
                                        )}
                                    >
                                        <Lock className="w-6 h-6" />
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase tracking-widest">مسار خاص للطلاب</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
 
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">تكلفة المسار</label>
                                <input
                                    type="text"
                                    value={currentCourse.cost}
                                    onChange={e => setCurrentCourse({ ...currentCourse, cost: e.target.value })}
                                    className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-black"
                                    placeholder="مثلاً: مجانية مهدى من الروضة"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">آلية الحضور</label>
                                <input
                                    type="text"
                                    value={currentCourse.mechanism}
                                    onChange={e => setCurrentCourse({ ...currentCourse, mechanism: e.target.value })}
                                    className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-black"
                                    placeholder="مثلاً: تعليم عن بُعد ذكي"
                                />
                            </div>
 
                            <div className="grid grid-cols-2 gap-4 md:col-span-2 border-t border-white/10 pt-8 mt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">انطلاق التسجيل</label>
                                    <input
                                        type="date"
                                        value={formatDate(currentCourse.registrationStart)}
                                        onChange={e => handleDateChange('registrationStart', e.target.value)}
                                        className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 font-black text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">إغلاق التسجيل</label>
                                    <input
                                        type="date"
                                        value={formatDate(currentCourse.registrationEnd)}
                                        onChange={e => handleDateChange('registrationEnd', e.target.value)}
                                        className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 font-black text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">بداية الدراسة</label>
                                    <input
                                        type="date"
                                        value={formatDate(currentCourse.startDate)}
                                        onChange={e => handleDateChange('startDate', e.target.value)}
                                        className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 font-black text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">انتهاء الدراسة</label>
                                    <input
                                        type="date"
                                        value={formatDate(currentCourse.endDate)}
                                        onChange={e => handleDateChange('endDate', e.target.value)}
                                        className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 font-black text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 border-t border-white/10 pt-8">
                            <label className="text-base font-black flex items-center gap-3">
                                <Globe className="w-5 h-5 text-primary" /> قنوات التواصل والشبكات
                            </label>
                            <div className="space-y-4">
                                {socialLinksInput?.map((link, index) => (
                                    <div key={index} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4 relative group/link shadow-xl">
                                        <button 
                                            type="button" 
                                            onClick={() => setSocialLinksInput(socialLinksInput.filter((_, i) => i !== index))}
                                            className="absolute top-4 left-4 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <select
                                                value={link.type}
                                                onChange={e => {
                                                    const update = [...(socialLinksInput || [])];
                                                    update[index].type = e.target.value as any;
                                                    setSocialLinksInput(update);
                                                }}
                                                className="p-4 rounded-xl border border-white/10 bg-slate-900 text-xs font-black uppercase tracking-widest"
                                            >
                                                <option value="whatsapp">مجموعة الواتساب</option>
                                                <option value="telegram">قناة التلجرام</option>
                                                <option value="facebook">صفحة الفيسبوك</option>
                                                <option value="other">رابط خارجي</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="تسمية الرابط"
                                                value={link.label || ""}
                                                onChange={e => {
                                                    const update = [...(socialLinksInput || [])];
                                                    update[index].label = e.target.value;
                                                    setSocialLinksInput(update);
                                                }}
                                                className="p-4 rounded-xl border border-white/10 bg-slate-900 text-xs font-black uppercase tracking-widest"
                                            />
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={link.url}
                                            onChange={e => {
                                                const update = [...(socialLinksInput || [])];
                                                update[index].url = e.target.value;
                                                setSocialLinksInput(update);
                                            }}
                                            className="w-full p-4 rounded-xl border border-white/10 bg-slate-900 text-xs font-bold font-mono tracking-tighter"
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setSocialLinksInput([...(socialLinksInput || []), { type: 'whatsapp', url: '', label: '' }])}
                                    className="w-full py-4 rounded-2xl border border-dashed border-white/20 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-3"
                                >
                                    <Plus className="w-5 h-5" /> إضافة رابط تواصل
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </EliteModal>
        </div>
    );
}
