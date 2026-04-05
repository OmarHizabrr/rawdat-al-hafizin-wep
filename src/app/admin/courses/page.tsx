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
    Library
} from "lucide-react";
import { SUNNAH_VOLUMES } from "@/lib/volumes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

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
    whatsappLink?: string;
    conditions?: string[];
    visibility?: 'public' | 'private';
    folderId?: string;
}

const initialCourseState: Partial<CourseModel> = {
    title: "",
    description: "",
    mechanism: "",
    features: [],
    whatsappLink: "",
    conditions: [""],
    visibility: 'public',
    folderId: "",
};

export default function CoursesDashboard() {
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<Partial<CourseModel>>(initialCourseState);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // Temporary state for inputs
    const [featuresInput, setFeaturesInput] = useState<string[]>([""]);
    const [conditionsInput, setConditionsInput] = useState<string[]>([""]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
            const coursesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CourseModel[];
            setCourses(coursesData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentCourse.features) {
            setFeaturesInput(currentCourse.features.length > 0 ? currentCourse.features : [""]);
        }
        if (currentCourse.conditions) {
            setConditionsInput(currentCourse.conditions.length > 0 ? currentCourse.conditions : [""]);
        }
    }, [currentCourse]);

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setCurrentCourse({ ...initialCourseState, id: doc(collection(db, "courses")).id });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (course: CourseModel) => {
        setCurrentCourse(course);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return "";
        return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
    };

    const handleDateChange = (field: keyof CourseModel, value: string) => {
        const date = value ? Timestamp.fromDate(new Date(value)) : null;
        setCurrentCourse(prev => ({ ...prev, [field]: date }));
    };

    const calculateDuration = (start?: Timestamp, end?: Timestamp): string => {
        if (!start || !end) return "";
        const diffTime = Math.abs(end.seconds - start.seconds);
        const diffDays = Math.ceil(diffTime / (60 * 60 * 24)) + 1; // Include start day
        
        if (diffDays >= 30) {
            const months = Math.floor(diffDays / 30);
            const remainingDays = diffDays % 30;
            if (remainingDays === 0) return `${months} شهر`;
            return `${months} شهر و ${remainingDays} يوم`;
        }
        return `${diffDays} يوم`;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        // Filter empty features
        const validFeatures = featuresInput.filter(f => f.trim().length > 0);

        try {
            const courseData = {
                ...currentCourse,
                features: validFeatures,
                conditions: conditionsInput.filter(c => c.trim().length > 0),
                updatedAt: serverTimestamp()
            };

            if (isEditing && currentCourse.id) {
                await updateDoc(doc(db, "courses", currentCourse.id), courseData);
            } else if (currentCourse.id) {
                await setDoc(doc(db, "courses", currentCourse.id), courseData);
            }
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

                // 1. Fetch and delete levels: levels/{id}/levels
                const levelsSnap = await getDocs(collection(db, "levels", id, "levels"));
                levelsSnap.forEach((doc) => batch.delete(doc.ref));

                // 2. Fetch and delete enrollments: enrollments/{id}/enrollments
                const enrollmentsSnap = await getDocs(collection(db, "enrollments", id, "enrollments"));
                enrollmentsSnap.forEach((doc) => batch.delete(doc.ref));

                // 3. Fetch and delete members: members/{id}/members
                const membersSnap = await getDocs(collection(db, "members", id, "members"));
                membersSnap.forEach((doc) => batch.delete(doc.ref));

                // 4. Fetch and delete daily_logs: daily_logs/{id}/daily_logs
                const logsSnap = await getDocs(collection(db, "daily_logs", id, "daily_logs"));
                logsSnap.forEach((doc) => batch.delete(doc.ref));

                // 5. Fetch and delete exams: exams/{id}/exams
                const examsSnap = await getDocs(collection(db, "exams", id, "exams"));
                examsSnap.forEach((doc) => batch.delete(doc.ref));

                // 6. Fetch and delete coursePlans: coursePlans/{id}/coursePlans
                const plansSnap = await getDocs(collection(db, "coursePlans", id, "coursePlans"));
                plansSnap.forEach((doc) => batch.delete(doc.ref));

                // 7. Delete the main course document
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

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">إدارة الدورات</h1>
                    <p className="text-muted-foreground">إنشاء وتعديل الدورات التدريبية ومستوياتها</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة دورة جديدة</span>
                </button>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="بحث عن دورة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            <div className="grid gap-4">
                {filteredCourses.map(course => (
                    <GlassCard key={course.id} className="p-0 overflow-hidden hover:border-primary/50 transition-colors">
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{course.title}</h3>
                                        {course.visibility === 'private' && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20 uppercase tracking-widest">
                                                <Lock className="w-3 h-3" /> خاص
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/courses/${course.id}/members`}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-primary"
                                            title="عرض وإدارة الأعضاء"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/courses/${course.id}/plan`}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-amber-500"
                                            title="الخطة الدراسية"
                                        >
                                            <Calendar className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-blue-500"
                                            title="تعديل"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(course.id)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-muted-foreground line-clamp-2">{course.description}</p>

                                <div className="flex flex-wrap gap-4 pt-2 text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(course.startDate)} - {formatDate(course.endDate)}</span>
                                        <span className="text-primary font-bold">({calculateDuration(course.startDate, course.endDate)})</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <BookOpen className="w-4 h-4" />
                                        <span>التسجيل: {calculateDuration(course.registrationStart, course.registrationEnd) || "غير محدد"}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <DollarSign className="w-4 h-4" />
                                        <span>{course.cost}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Monitor className="w-4 h-4" />
                                        <span>{course.mechanism}</span>
                                    </div>
                                    {course.folderId && (
                                        <div className="flex items-center gap-1 text-primary font-bold">
                                            <Library className="w-4 h-4" />
                                            <span>{SUNNAH_VOLUMES.find(v => v.id === course.folderId)?.title}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end border-t md:border-t-0 md:border-r border-gray-100 dark:border-white/5 pt-4 md:pt-0 md:pr-6">
                                <Link
                                    href={`/admin/courses/${course.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-xl transition-colors"
                                >
                                    <Layers className="w-4 h-4" />
                                    <span>إدارة المستويات والموارد</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </GlassCard>
                ))}
                {filteredCourses.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        لا توجد دورات حالياً.
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-bold">{isEditing ? 'تعديل الدورة' : 'إضافة دورة جديدة'}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <form id="courseForm" onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">عنوان الدورة</label>
                                        <input
                                            required
                                            type="text"
                                            value={currentCourse.title}
                                            onChange={e => setCurrentCourse({ ...currentCourse, title: e.target.value })}
                                            className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الوصف</label>
                                        <textarea
                                            required
                                            value={currentCourse.description}
                                            onChange={e => setCurrentCourse({ ...currentCourse, description: e.target.value })}
                                            className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                                        />
                                    </div>
                                    
                                    <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <label className="text-sm font-bold block mb-2 flex items-center gap-2">
                                            <Library className="w-4 h-4 text-primary" /> الربط بالمجلد الأكاديمي
                                        </label>
                                        <select
                                            value={currentCourse.folderId || ""}
                                            onChange={e => setCurrentCourse({ ...currentCourse, folderId: e.target.value })}
                                            className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                                        >
                                            <option value="">-- اختر المجلد المرتبط (اختياري) --</option>
                                            {SUNNAH_VOLUMES.map(volume => (
                                                <option key={volume.id} value={volume.id}>
                                                    {volume.title} ({volume.totalPages} صفحة)
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-muted-foreground px-1">سيتم احتساب تقدم الطالب في هذا المجلد بناءً على صفحات هذه الدورة.</p>
                                    </div>

                                    <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <label className="text-sm font-bold block mb-2">إعدادات الرؤية والخصوصية</label>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentCourse({ ...currentCourse, visibility: 'public' })}
                                                className={cn(
                                                    "flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                                    currentCourse.visibility === 'public'
                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                        : "bg-background border-white/10 opacity-60 grayscale"
                                                )}
                                            >
                                                <Globe className="w-5 h-5" />
                                                <div className="text-center">
                                                    <p className="text-xs font-black uppercase tracking-widest">دورة عامة</p>
                                                    <p className="text-[10px] opacity-70">تظهر للجميع للاكتشاف</p>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentCourse({ ...currentCourse, visibility: 'private' })}
                                                className={cn(
                                                    "flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                                    currentCourse.visibility === 'private'
                                                        ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20 scale-105"
                                                        : "bg-background border-white/10 opacity-60 grayscale"
                                                )}
                                            >
                                                <Lock className="w-5 h-5" />
                                                <div className="text-center">
                                                    <p className="text-xs font-black uppercase tracking-widest">دورة خاصة</p>
                                                    <p className="text-[10px] opacity-70">يتم الإضافة يدوياً فقط</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">التكلفة</label>
                                            <input
                                                type="text"
                                                value={currentCourse.cost}
                                                onChange={e => setCurrentCourse({ ...currentCourse, cost: e.target.value })}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="مثلاً: مجاناً"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">الآلية</label>
                                            <input
                                                type="text"
                                                value={currentCourse.mechanism}
                                                onChange={e => setCurrentCourse({ ...currentCourse, mechanism: e.target.value })}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="مثلاً: عن بعد"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">بداية التسجيل</label>
                                            <input
                                                type="date"
                                                value={formatDate(currentCourse.registrationStart)}
                                                onChange={e => handleDateChange('registrationStart', e.target.value)}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">نهاية التسجيل</label>
                                            <input
                                                type="date"
                                                value={formatDate(currentCourse.registrationEnd)}
                                                onChange={e => handleDateChange('registrationEnd', e.target.value)}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                            />
                                        </div>
                                        <div className="col-span-2 text-xs text-primary font-bold px-2">
                                            مدة التسجيل: {calculateDuration(currentCourse.registrationStart, currentCourse.registrationEnd) || "---"}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">بداية الدورة</label>
                                            <input
                                                type="date"
                                                value={formatDate(currentCourse.startDate)}
                                                onChange={e => handleDateChange('startDate', e.target.value)}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">نهاية الدورة</label>
                                            <input
                                                type="date"
                                                value={formatDate(currentCourse.endDate)}
                                                onChange={e => handleDateChange('endDate', e.target.value)}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                            />
                                        </div>
                                        <div className="col-span-2 text-xs text-primary font-bold px-2">
                                            مدة الدورة: {calculateDuration(currentCourse.startDate, currentCourse.endDate) || "---"}
                                        </div>
                                    </div>

                                    <div className="space-y-1 border-t pt-4">
                                        <label className="text-sm font-medium">رابط مجموعة الواتساب</label>
                                        <input
                                            type="url"
                                            value={currentCourse.whatsappLink || ""}
                                            onChange={e => setCurrentCourse({ ...currentCourse, whatsappLink: e.target.value })}
                                            className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="https://chat.whatsapp.com/..."
                                        />
                                    </div>

                                    <div className="space-y-2 border-t pt-4">
                                        <label className="text-sm font-medium block">شروط التسجيل في الدورة</label>
                                        {conditionsInput.map((condition, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={condition}
                                                    onChange={e => {
                                                        const newConditions = [...conditionsInput];
                                                        newConditions[index] = e.target.value;
                                                        setConditionsInput(newConditions);
                                                    }}
                                                    className="flex-1 p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                                    placeholder={`شرط ${index + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newConditions = conditionsInput.filter((_, i) => i !== index);
                                                        setConditionsInput(newConditions);
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setConditionsInput([...conditionsInput, ""])}
                                            className="text-sm text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            إضافة شرط
                                        </button>
                                    </div>

                                    <div className="space-y-2 border-t pt-4">
                                        <label className="text-sm font-medium block">مميزات الدورة</label>
                                        {featuresInput.map((feature, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={feature}
                                                    onChange={e => {
                                                        const newFeatures = [...featuresInput];
                                                        newFeatures[index] = e.target.value;
                                                        setFeaturesInput(newFeatures);
                                                    }}
                                                    className="flex-1 p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                                    placeholder={`ميزة ${index + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newFeatures = featuresInput.filter((_, i) => i !== index);
                                                        setFeaturesInput(newFeatures);
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFeaturesInput([...featuresInput, ""])}
                                            className="text-sm text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            إضافة ميزة
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    form="courseForm"
                                    disabled={saving}
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>حفظ</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
