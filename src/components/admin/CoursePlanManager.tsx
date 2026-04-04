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
    X,
    Hash,
    Target,
    Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { PlanDay, TierTask, PlanTemplate } from "@/types/plan";

interface CoursePlanManagerProps {
    courseId: string;
    backUrl: string;
}

export function CoursePlanManager({ courseId, backUrl }: CoursePlanManagerProps) {
    const [courseName, setCourseName] = useState("");
    const [plans, setPlans] = useState<PlanDay[]>([]);
    const [templates, setTemplates] = useState<PlanTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<PlanDay>>({
        weekIndex: 1,
        dayIndex: 1,
        tasks: [{ tierId: 'new', label: 'حفظ جديد', type: 'hadiths', start: "", end: "", notes: [] }]
    });
    const [saving, setSaving] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ 
        isOpen: false, 
        type: 'success' as 'success' | 'danger' | 'warning' | 'info', 
        title: '', 
        description: '', 
        onConfirm: null as any 
    });

    useEffect(() => {
        if (!courseId) return;
        const fetchCourse = async () => {
            const snap = await getDoc(doc(db, "courses", courseId));
            if (snap.exists()) setCourseName(snap.data().title || "دورة بدون اسم");
        };
        fetchCourse();

        const qTemplates = query(collection(db, "plan_templates"));
        onSnapshot(qTemplates, (snap) => {
            setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanTemplate[]);
        });

        const q = query(
            collection(db, "coursePlans", courseId, "coursePlans"),
            orderBy("weekIndex", "asc"),
            orderBy("dayIndex", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PlanDay[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [courseId]);

    const showDialog = (type: any, title: string, description: string, onConfirm?: any) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const handleAdd = () => {
        const lastPlan = plans[plans.length - 1];
        let nextWeek = 1, nextDay = 1;
        if (lastPlan) {
            if (lastPlan.dayIndex < 7) { nextWeek = lastPlan.weekIndex; nextDay = lastPlan.dayIndex + 1; }
            else { nextWeek = lastPlan.weekIndex + 1; nextDay = 1; }
        }
        setCurrentPlan({
            weekIndex: nextWeek,
            dayIndex: nextDay,
            tasks: [{ tierId: 'new', label: 'حفظ جديد', type: 'hadiths', start: "", end: "", notes: [] }]
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const planId = isEditing ? currentPlan.id! : doc(collection(db, "coursePlans", courseId, "coursePlans")).id;
            const data = { ...currentPlan, id: planId, updatedAt: serverTimestamp() };
            await setDoc(doc(db, "coursePlans", courseId, "coursePlans", planId), data, { merge: true });
            setIsModalOpen(false);
            showDialog('success', 'تم الحفظ', 'تم تحديث خطة اليوم بنجاح.');
        } catch (error) {
            showDialog('danger', 'خطأ', 'حدث خطأ أثناء الحفظ.');
        } finally { setSaving(false); }
    };

    const groupedPlans = plans.reduce((acc, plan) => {
        if (!acc[plan.weekIndex]) acc[plan.weekIndex] = [];
        acc[plan.weekIndex].push(plan);
        return acc;
    }, {} as Record<number, PlanDay[]>);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"><ArrowRight className="w-6 h-6" /></button>
                    <div><h1 className="text-2xl font-black">{courseName}</h1><p className="text-muted-foreground font-medium text-sm">توزيع المهام متعددة المستويات</p></div>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-[1.5rem] hover:bg-primary/90 transition-all font-bold shadow-xl shadow-primary/20"><Plus className="w-5 h-5" /> إضافة يوم للخطة</button>
            </div>

            <div className="space-y-12">
                {Object.keys(groupedPlans).map((weekIdx) => (
                    <div key={weekIdx} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg shadow-inner">{weekIdx}</div>
                            <h2 className="text-xl font-black">الأسبوع {weekIdx}</h2>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {groupedPlans[Number(weekIdx)].map((plan) => (
                                <GlassCard key={plan.id} className="p-6 hover:border-primary/30 transition-all group relative flex flex-col h-full bg-white/5 border-white/5 shadow-xl">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">اليوم {plan.dayIndex}</div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setCurrentPlan(plan); setIsEditing(true); setIsModalOpen(true); }} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-xl transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => showDialog('danger', 'حذف', 'هل أنت متأكد؟', async () => await deleteDoc(doc(db, "coursePlans", courseId, "coursePlans", plan.id)))} className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {plan.tasks?.map((task, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{task.label}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-bold pl-3">
                                                    {task.type === 'hadiths' ? <Hash className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                                    <span>{task.start} {task.end ? `- ${task.end}` : ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => { setCurrentPlan(plan); setIsEditing(true); setIsModalOpen(true); }} className="mt-6 w-full py-3 bg-white/5 hover:bg-primary/10 hover:text-primary rounded-2xl text-xs font-black transition-all">تعديل التفاصيل</button>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-primary/5">
                                <h2 className="text-xl font-black">{isEditing ? 'تعديل اليوم' : 'إضافة يوم جديد'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest px-2">الأسبوع</label><input required type="number" value={currentPlan.weekIndex} onChange={e => setCurrentPlan({...currentPlan, weekIndex: parseInt(e.target.value)})} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest px-2">اليوم</label><input required type="number" max="7" value={currentPlan.dayIndex} onChange={e => setCurrentPlan({...currentPlan, dayIndex: parseInt(e.target.value)})} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold" /></div>
                                </div>
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><Target className="w-4 h-4" /> مهام اليوم</h3><button type="button" onClick={() => setCurrentPlan({...currentPlan, tasks: [...(currentPlan.tasks || []), { tierId: 'custom', label: 'مهمة إضافية', type: 'hadiths', start: "", end: "" }]})} className="text-[10px] bg-primary/10 text-primary px-4 py-2 rounded-xl font-black">+ إضافة مهمة</button></div>
                                    <div className="space-y-4">
                                        {currentPlan.tasks?.map((task, idx) => (
                                            <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4 relative group/task">
                                                <button type="button" onClick={() => setCurrentPlan({...currentPlan, tasks: currentPlan.tasks?.filter((_, i) => i !== idx)})} className="absolute top-4 left-4 p-2 text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground/50 px-1">عنوان المهمة</label><input type="text" value={task.label} onChange={e => { const nt = [...(currentPlan.tasks || [])]; nt[idx].label = e.target.value; setCurrentPlan({...currentPlan, tasks: nt}); }} className="w-full p-3 bg-black/20 border border-white/5 rounded-xl font-bold text-sm" /></div>
                                                    <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground/50 px-1">النوع</label><select value={task.type} onChange={e => { const nt = [...(currentPlan.tasks || [])]; nt[idx].type = e.target.value as any; setCurrentPlan({...currentPlan, tasks: nt}); }} className="w-full p-3 bg-black/20 border border-white/5 rounded-xl text-xs font-bold"><option value="hadiths">أحاديث</option><option value="pages">صفحات</option><option value="volumes">مجلدات</option></select></div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground/50 px-1">من (البداية)</label><input required type="text" value={task.start} onChange={e => { const nt = [...(currentPlan.tasks || [])]; nt[idx].start = e.target.value; setCurrentPlan({...currentPlan, tasks: nt}); }} className="w-full p-3 bg-black/20 border border-white/5 rounded-xl font-bold text-sm" /></div>
                                                    <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground/50 px-1">إلى (اختياري)</label><input type="text" value={task.end} onChange={e => { const nt = [...(currentPlan.tasks || [])]; nt[idx].end = e.target.value; setCurrentPlan({...currentPlan, tasks: nt}); }} className="w-full p-3 bg-black/20 border border-white/5 rounded-xl font-bold text-sm" /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-black transition-all">إلغاء</button><button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} حفظ اليوم</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <EliteDialog isOpen={dialogConfig.isOpen} onClose={() => setDialogConfig({...dialogConfig, isOpen: false})} onConfirm={() => { if (dialogConfig.onConfirm) (dialogConfig.onConfirm as any)(); setDialogConfig({...dialogConfig, isOpen: false});}} title={dialogConfig.title} description={dialogConfig.description} type={dialogConfig.type as any} confirmText={dialogConfig.onConfirm ? "نعم، متأكد" : "حسناً"} />
        </div>
    );
}
