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
    getDoc,
    serverTimestamp,
    writeBatch,
    query,
    orderBy
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Plus,
    Trash2,
    Calendar,
    BookOpen,
    Layers,
    ChevronRight,
    ArrowRight,
    Loader2,
    Save,
    LayoutGrid,
    CheckCircle2,
    X,
    Hash,
    Book,
    CopyPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface PlanItem {
    id: string;
    weekIndex: number;
    dayIndex: number;
    planType: 'hadiths' | 'pages' | 'volumes';
    startPoint: string;
    endPoint: string;
    tasks: string[];
}

interface CoursePlanManagerProps {
    courseId: string;
    backUrl: string;
}

export function CoursePlanManager({ courseId, backUrl }: CoursePlanManagerProps) {
    const [courseName, setCourseName] = useState("");
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<PlanItem>>({
        weekIndex: 1,
        dayIndex: 1,
        planType: 'hadiths',
        startPoint: "",
        endPoint: "",
        tasks: [""]
    });
    const [saving, setSaving] = useState(false);
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

    // 1. Fetch Course Info & Plans
    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            const snap = await getDoc(doc(db, "courses", courseId));
            if (snap.exists()) {
                setCourseName(snap.data().title || "دورة بدون اسم");
            }
        };
        fetchCourse();

        const q = query(
            collection(db, "coursePlans", courseId, "coursePlans"),
            orderBy("weekIndex", "asc"),
            orderBy("dayIndex", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const plansData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PlanItem[];
            setPlans(plansData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [courseId]);

    const showDialog = (type: 'success' | 'danger' | 'warning', title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const handleAdd = () => {
        // Try to guess next day/week
        const lastPlan = plans[plans.length - 1];
        let nextWeek = 1;
        let nextDay = 1;

        if (lastPlan) {
            if (lastPlan.dayIndex < 7) {
                nextWeek = lastPlan.weekIndex;
                nextDay = lastPlan.dayIndex + 1;
            } else {
                nextWeek = lastPlan.weekIndex + 1;
                nextDay = 1;
            }
        }

        setCurrentPlan({
            weekIndex: nextWeek,
            dayIndex: nextDay,
            planType: lastPlan?.planType || 'hadiths',
            startPoint: "",
            endPoint: "",
            tasks: [""]
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (plan: PlanItem) => {
        setCurrentPlan(plan);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const planId = isEditing ? currentPlan.id! : doc(collection(db, "coursePlans", courseId, "coursePlans")).id;
            const planData = {
                ...currentPlan,
                id: planId,
                updatedAt: serverTimestamp(),
                tasks: currentPlan.tasks?.filter(t => t.trim() !== "") || []
            };

            await setDoc(doc(db, "coursePlans", courseId, "coursePlans", planId), planData, { merge: true });
            
            showDialog('success', 'تم الحفظ', `تم حفظ خطة الأسبوع ${currentPlan.weekIndex} - اليوم ${currentPlan.dayIndex} بنجاح.`);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving plan:", error);
            showDialog('danger', 'فشل الحفظ', 'حدث خطأ أثناء محاولة حفظ الخطة.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, week: number, day: number) => {
        showDialog('danger', 'حذف الخطة', `هل أنت متأكد من حذف خطة اليوم ${day} من الأسبوع ${week}؟`, async () => {
            try {
                await deleteDoc(doc(db, "coursePlans", courseId, "coursePlans", id));
            } catch (error) {
                console.error("Error deleting plan:", error);
                showDialog('danger', 'فشل الحذف', 'تعذر حذف الخطة.');
            }
        });
    };

    const groupedPlans = plans.reduce((acc, plan) => {
        if (!acc[plan.weekIndex]) acc[plan.weekIndex] = [];
        acc[plan.weekIndex].push(plan);
        return acc;
    }, {} as Record<number, PlanItem[]>);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={backUrl} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <ArrowRight className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{courseName}</h1>
                        <p className="text-muted-foreground">تخطيط المنهج الدراسي وتوزيع المهام</p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة يوم للخطة</span>
                </button>
            </div>

            {/* Weeks List */}
            <div className="space-y-12">
                {Object.keys(groupedPlans).map((weekIdx) => (
                    <div key={weekIdx} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                                {weekIdx}
                            </div>
                            <h2 className="text-xl font-bold">الأسبوع {weekIdx}</h2>
                            <div className="h-px flex-1 bg-gray-100 dark:bg-white/5 ml-4" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupedPlans[Number(weekIdx)].map((plan) => (
                                <GlassCard key={plan.id} className="p-5 hover:border-primary/30 transition-all group relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="bg-secondary/50 text-secondary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
                                            اليوم {plan.dayIndex}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(plan)} className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-500">
                                                <X className="w-3.5 h-3.5 rotate-45" /> {/* Edit represented by rotatign X or just placeholder */}
                                                <LayoutGrid className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(plan.id, plan.weekIndex, plan.dayIndex)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            {plan.planType === 'hadiths' ? <Hash className="w-4 h-4 text-primary" /> : plan.planType === 'pages' ? <BookOpen className="w-4 h-4 text-primary" /> : <Layers className="w-4 h-4 text-primary" />}
                                            <span>
                                                {plan.planType === 'hadiths' ? 'أحاديث' : plan.planType === 'pages' ? 'صفحات' : 'مجلدات'} 
                                                {' '} {plan.startPoint} {plan.endPoint ? ` - ${plan.endPoint}` : ''}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 min-h-[60px]">
                                            {plan.tasks.slice(0, 3).map((task, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                    <div className="w-1 h-1 rounded-full bg-primary/40 mt-1.5" />
                                                    <span className="truncate">{task}</span>
                                                </div>
                                            ))}
                                            {plan.tasks.length > 3 && (
                                                <p className="text-[10px] text-primary font-bold">+{plan.tasks.length - 3} مهام أخرى</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleEdit(plan)}
                                        className="mt-4 w-full py-2 bg-gray-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary rounded-xl text-xs font-bold transition-all"
                                    >
                                        تعديل التفاصيل
                                    </button>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                ))}

                {plans.length === 0 && (
                    <div className="text-center py-20 border border-dashed rounded-[2.5rem] opacity-50">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>لا توجد خطة دراسية مضافة بعد لهذه الدورة.</p>
                        <button onClick={handleAdd} className="mt-4 text-primary font-bold hover:underline">أضف أول يوم الآن</button>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden max-h-[95vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold">{isEditing ? 'تعديل يوم في الخطة' : 'إضافة يوم للخطة'}</h2>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <form id="planForm" onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">الأسبوع</label>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                value={currentPlan.weekIndex}
                                                onChange={e => setCurrentPlan({ ...currentPlan, weekIndex: parseInt(e.target.value) })}
                                                className="w-full p-4 rounded-2xl border bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">اليوم</label>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                max="7"
                                                value={currentPlan.dayIndex}
                                                onChange={e => setCurrentPlan({ ...currentPlan, dayIndex: parseInt(e.target.value) })}
                                                className="w-full p-4 rounded-2xl border bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">نوع المحتوى</label>
                                        <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl">
                                            {(['hadiths', 'pages', 'volumes'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setCurrentPlan({ ...currentPlan, planType: type })}
                                                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                                                        currentPlan.planType === type ? 'bg-primary text-white shadow-lg' : 'hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    {type === 'hadiths' ? 'أحاديث' : type === 'pages' ? 'صفحات' : 'مجلدات'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">من (البداية)</label>
                                            <input
                                                required
                                                type="text"
                                                value={currentPlan.startPoint}
                                                onChange={e => setCurrentPlan({ ...currentPlan, startPoint: e.target.value })}
                                                className="w-full p-4 rounded-2xl border bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                placeholder="مثلاً: 1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">إلى (النهاية - اختياري)</label>
                                            <input
                                                type="text"
                                                value={currentPlan.endPoint}
                                                onChange={e => setCurrentPlan({ ...currentPlan, endPoint: e.target.value })}
                                                className="w-full p-4 rounded-2xl border bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                placeholder="مثلاً: 10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 border-t border-white/5 pt-6">
                                        <div className="flex items-center justify-between px-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 text-right">قائمة المهام اليومية</label>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPlan({ ...currentPlan, tasks: [...(currentPlan.tasks || []), ""] })}
                                                className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg font-bold hover:bg-primary/20 transition-colors"
                                            >
                                                + إضافة مهمة
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {currentPlan.tasks?.map((task, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={task}
                                                        onChange={e => {
                                                            const newTasks = [...(currentPlan.tasks || [])];
                                                            newTasks[idx] = e.target.value;
                                                            setCurrentPlan({ ...currentPlan, tasks: newTasks });
                                                        }}
                                                        className="flex-1 p-3 rounded-xl border bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                                        placeholder={`المهمة ${idx + 1}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newTasks = currentPlan.tasks?.filter((_, i) => i !== idx);
                                                            setCurrentPlan({ ...currentPlan, tasks: newTasks });
                                                        }}
                                                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                                <button
                                    form="planForm"
                                    disabled={saving}
                                    type="submit"
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>حفظ الخطة</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
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
