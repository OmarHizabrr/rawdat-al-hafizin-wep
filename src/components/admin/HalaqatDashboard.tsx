"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    writeBatch,
    getDocs,
    query,
    where
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Calendar,
    Clock,
    UserCircle,
    X,
    Loader2,
    Eye,
    CheckCircle2,
    Lock,
    Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface GroupModel {
    id: string;
    name: string;
    supervisorId: string;
    gender: 'male' | 'female';
    schedule: {
        recitationDays: string[];
        reviewDays: string[];
        vacationDays: string[];
        startTime: string;
        endTime: string;
    };
    visibility?: 'public' | 'private';
}

interface TeacherModel {
    uid: string;
    displayName: string;
}

const initialGroupState: GroupModel = {
    id: "",
    name: "",
    supervisorId: "",
    gender: "male",
    schedule: {
        recitationDays: [],
        reviewDays: [],
        vacationDays: [],
        startTime: "",
        endTime: ""
    },
    visibility: 'public'
};

const DAYS = [
    'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'
];

interface HalaqatDashboardProps {
    readonly?: boolean;
    supervisorFilter?: string;
}

export function HalaqatDashboard({ readonly = false, supervisorFilter }: HalaqatDashboardProps) {
    const [groups, setGroups] = useState<GroupModel[]>([]);
    const [teachers, setTeachers] = useState<TeacherModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<GroupModel>(initialGroupState);
    const [isEditing, setIsEditing] = useState(false);
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

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "groups"), (snapshot) => {
            const groupsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as GroupModel[];
            setGroups(groupsData);
            setLoading(false);
        });

        const fetchTeachers = async () => {
            const q = query(collection(db, "users"), where("role", "==", "teacher"));
            const snap = await getDocs(q);
            const teachersData = snap.docs.map(d => ({ uid: d.id, displayName: d.data().displayName || d.id }));
            setTeachers(teachersData);
        };
        fetchTeachers();

        return () => unsubscribe();
    }, []);

    const showDialog = (type: 'success' | 'danger' | 'warning', title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const filteredGroups = groups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.supervisorId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSupervisor = supervisorFilter ? g.supervisorId === supervisorFilter : true;
        return matchesSearch && matchesSupervisor;
    });

    const handleAdd = () => {
        setCurrentGroup({ ...initialGroupState, id: doc(collection(db, "groups")).id });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (group: GroupModel) => {
        setCurrentGroup(group);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await updateDoc(doc(db, "groups", currentGroup.id), {
                    ...currentGroup,
                    updatedAt: serverTimestamp()
                } as any);
                showDialog('success', 'تم التحديث', `تم تحديث بيانات حلقة "${currentGroup.name}" بنجاح.`);
            } else {
                await setDoc(doc(db, "groups", currentGroup.id), {
                    ...currentGroup,
                    createdAt: serverTimestamp()
                });
                showDialog('success', 'تمت الإضافة', `تم إنشاء حلقة "${currentGroup.name}" الجديدة بنجاح.`);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving group:", error);
            showDialog('danger', 'فشل الحفظ', 'حدث خطأ غير متوقع أثناء محاولة حفظ بيانات الحلقة.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        showDialog('danger', 'حذف الحلقة نهائياً', `🚨 هل أنت متأكد تماماً من حذف حلقة "${name}"؟\nسيتم حذف جميع الأعضاء والتقييمات والسجلات المرتبطة بها نهائياً ولا يمكن التراجع عن ذلك.`, async () => {
            try {
                const batch = writeBatch(db);
                const membersSnap = await getDocs(collection(db, "members", id, "members"));
                membersSnap.forEach((doc) => batch.delete(doc.ref));
                const evaluationsSnap = await getDocs(collection(db, "evaluations", id, "evaluations"));
                evaluationsSnap.forEach((doc) => batch.delete(doc.ref));
                batch.delete(doc(db, "groups", id));
                await batch.commit();
                showDialog('success', 'تم الحذف الكامل', `تم حذف حلقة "${name}" وكافة ارتباطاتها بنجاح.`);
            } catch (error) {
                console.error("Error deleting group:", error);
                showDialog('danger', 'فشل الحذف الكامل', 'حدث خطأ أثناء محاولة مسح كافة البيانات المرتبطة.');
            }
        });
    };

    const toggleDay = (type: 'recitationDays' | 'reviewDays' | 'vacationDays', day: string) => {
        setCurrentGroup(prev => {
            const currentDays = prev.schedule[type] || [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            return {
                ...prev,
                schedule: {
                    ...prev.schedule,
                    [type]: newDays
                }
            };
        });
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">إدارة الحلقات</h1>
                    <p className="text-muted-foreground">تنظيم حلقات التحفيظ والمجموعات الخاصة بك</p>
                </div>
                {!readonly && (
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة حلقة جديدة</span>
                    </button>
                )}
            </div>

            <div className="relative group max-w-2xl">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="بحث عن حلقة أو معرف مشرف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredGroups.map((group, index) => (
                        <motion.div
                            key={group.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="group relative overflow-hidden transition-all hover:border-primary/30 h-full flex flex-col bg-white/5">
                                <div className="absolute top-0 right-0 p-0 rounded-bl-2xl overflow-hidden flex shadow-lg">
                                    <div className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-white ${group.gender === 'male' ? 'bg-blue-600' : 'bg-pink-600'}`}>
                                        {group.gender === 'male' ? 'قسم الرجال' : 'قسم النساء'}
                                    </div>
                                    {group.visibility === 'private' && (
                                        <div className="bg-amber-600 px-3 py-1.5 text-white flex items-center justify-center">
                                            <Lock className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 space-y-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-bold tracking-tight">{group.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium p-1 px-2.5 bg-gray-100 dark:bg-white/5 rounded-full w-fit">
                                                <UserCircle className="w-3.5 h-3.5 text-primary" />
                                                <span>المشرف: {teachers.find(t => t.uid === group.supervisorId)?.displayName || group.supervisorId || "غير محدد"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground/80 bg-white/5 p-3 rounded-2xl">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="font-medium text-xs truncate">{group.schedule.recitationDays?.join(" • ") || "لم يحدد أيام"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground/80 bg-white/5 p-3 rounded-2xl">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <span className="font-mono">{group.schedule.startTime || "--:--"} - {group.schedule.endTime || "--:--"}</span>
                                        </div>
                                    </div>

                                    {!readonly && (
                                        <div className="pt-6 flex justify-between items-center border-t border-white/5">
                                            <Link
                                                href={`/admin/halaqat/${group.id}/members`}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 rounded-xl text-primary font-bold text-xs transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                إدارة الأعضاء
                                            </Link>
                                            
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(group)}
                                                    className="p-2.5 hover:bg-blue-500/10 rounded-xl text-blue-500 transition-all hover:scale-110"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(group.id, group.name)}
                                                    className="p-2.5 hover:bg-red-500/10 rounded-xl text-red-500 transition-all hover:scale-110"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

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
                            className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden max-h-[95vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-primary/5">
                                <h2 className="text-xl font-bold">{isEditing ? 'تعديل بيانات الحلقة' : 'إنشاء حلقة جديدة'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <form id="groupForm" onSubmit={handleSave} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">اسم الحلقة</label>
                                            <input
                                                required
                                                type="text"
                                                value={currentGroup.name}
                                                onChange={e => setCurrentGroup({ ...currentGroup, name: e.target.value })}
                                                className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">معلم الحلقة (المشرف)</label>
                                            <select
                                                required
                                                value={currentGroup.supervisorId}
                                                onChange={e => setCurrentGroup({ ...currentGroup, supervisorId: e.target.value })}
                                                className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold appearance-none"
                                            >
                                                <option value="">اختر المعلم...</option>
                                                {teachers.map(teacher => (
                                                    <option key={teacher.uid} value={teacher.uid}>{teacher.displayName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">نوع وتصنيف الحلقة</label>
                                        <div className="flex flex-wrap gap-4 p-2 bg-white/5 rounded-2xl w-fit">
                                            <label className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all ${currentGroup.gender === 'male' ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-white/5 opacity-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value="male"
                                                    checked={currentGroup.gender === 'male'}
                                                    onChange={() => setCurrentGroup({ ...currentGroup, gender: 'male' })}
                                                    className="hidden"
                                                />
                                                <span className="font-bold">قسم الرجال</span>
                                            </label>
                                            <label className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all ${currentGroup.gender === 'female' ? 'bg-pink-500 text-white shadow-lg' : 'hover:bg-white/5 opacity-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value="female"
                                                    checked={currentGroup.gender === 'female'}
                                                    onChange={() => setCurrentGroup({ ...currentGroup, gender: 'female' })}
                                                    className="hidden"
                                                />
                                                <span className="font-bold">قسم النساء</span>
                                            </label>

                                            <div className="w-px h-10 bg-white/10 mx-2" />

                                            <label className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all ${currentGroup.visibility === 'public' ? 'bg-emerald-600 text-white shadow-lg font-bold' : 'hover:bg-white/5 opacity-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    value="public"
                                                    checked={currentGroup.visibility === 'public'}
                                                    onChange={() => setCurrentGroup({ ...currentGroup, visibility: 'public' })}
                                                    className="hidden"
                                                />
                                                <Globe className="w-4 h-4" />
                                                <span>عامة</span>
                                            </label>
                                            <label className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all ${currentGroup.visibility === 'private' ? 'bg-amber-600 text-white shadow-lg font-bold' : 'hover:bg-white/5 opacity-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    value="private"
                                                    checked={currentGroup.visibility === 'private'}
                                                    onChange={() => setCurrentGroup({ ...currentGroup, visibility: 'private' })}
                                                    className="hidden"
                                                />
                                                <Lock className="w-4 h-4" />
                                                <span>خاصة</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-6 border-t border-white/5 pt-8">
                                        <h3 className="flex items-center gap-2 font-bold text-lg">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            تنظيم الجدول الزمني
                                        </h3>
                                        {['recitationDays', 'reviewDays', 'vacationDays'].map((type) => (
                                            <div key={type} className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">
                                                    {type === 'recitationDays' ? 'أيام التسميع والحفظ' :
                                                        type === 'reviewDays' ? 'أيام المراجعة والضبط' : 'أيام الإجازة الرسمية'}
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {DAYS.map(day => {
                                                        const isSelected = (currentGroup.schedule as any)[type]?.includes(day);
                                                        return (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => toggleDay(type as any, day)}
                                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${isSelected
                                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                                                    : 'bg-background/50 border-white/10 opacity-40 hover:opacity-100'
                                                                    }`}
                                                            >
                                                                {day}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="grid grid-cols-2 gap-6 pt-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">وقت البدء</label>
                                                <input
                                                    type="time"
                                                    value={currentGroup.schedule.startTime || ""}
                                                    onChange={e => setCurrentGroup({
                                                        ...currentGroup,
                                                        schedule: { ...currentGroup.schedule, startTime: e.target.value }
                                                    })}
                                                    className="w-full p-4 rounded-2xl border bg-background/50 outline-none transition-all font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2">وقت الانتهاء</label>
                                                <input
                                                    type="time"
                                                    value={currentGroup.schedule.endTime || ""}
                                                    onChange={e => setCurrentGroup({
                                                        ...currentGroup,
                                                        schedule: { ...currentGroup.schedule, endTime: e.target.value }
                                                    })}
                                                    className="w-full p-4 rounded-2xl border bg-background/50 outline-none transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-bold transition-all">إلغاء</button>
                                <button
                                    form="groupForm"
                                    disabled={saving}
                                    type="submit"
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    <span>{isEditing ? 'حفظ التغييرات' : 'إنشاء الحلقة الآن'}</span>
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
