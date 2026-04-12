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
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EliteModal } from "@/components/ui/EliteModal";
import { EliteDialog } from "@/components/ui/EliteDialog";
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
    Globe,
    Users,
    Activity
} from "lucide-react";

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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-inner">
                        <Activity className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-elite-gradient">إدارة الحلقات</h1>
                        <p className="text-sm md:text-base text-muted-foreground font-medium opacity-70">تنظيم مسارات التحفيظ والمجموعات العلمية</p>
                    </div>
                </div>
                {!readonly && (
                    <button
                        onClick={handleAdd}
                        className="btn-elite-primary px-8 py-4 rounded-2xl flex items-center gap-3 text-lg"
                    >
                        <Plus className="w-6 h-6" />
                        <span>إضافة حلقة جديدة</span>
                    </button>
                )}
            </div>

            <div className="relative group max-w-2xl mx-auto md:mx-0">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                <input
                    type="text"
                    placeholder="بحث عن حلقة، مشرف، أو مادة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-6 pr-12 py-5 rounded-[1.5rem] border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-bold text-sm md:text-base placeholder:opacity-30"
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

                                <div className="p-5 md:p-8 space-y-5 md:space-y-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-bold tracking-tight">{group.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium p-1 px-2.5 bg-gray-100 dark:bg-white/5 rounded-full w-fit">
                                                <UserCircle className="w-3.5 h-3.5 text-primary" />
                                                <span>المشرف: {teachers.find(t => t.uid === group.supervisorId)?.displayName || group.supervisorId || "غير محدد"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground/80 bg-white/[0.03] p-4 rounded-2xl border border-white/5 group-hover:border-primary/10 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Calendar className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">أيام الانعقاد</p>
                                                <span className="font-bold text-xs line-clamp-1">{group.schedule.recitationDays?.join(" • ") || "لم يحدد أيام"}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground/80 bg-white/[0.03] p-4 rounded-2xl border border-white/5 group-hover:border-primary/10 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Clock className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">توقيت الحلقة</p>
                                                <span className="font-black text-xs">{group.schedule.startTime || "--:--"} - {group.schedule.endTime || "--:--"}</span>
                                            </div>
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

            <EliteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'تعديل بيانات الحلقة' : 'إنشاء حلقة جديدة'}
                description="إعداد وتخصيص مسار الحلقة وجدولها الزمني"
                maxWidth="3xl"
                footer={(
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-bold transition-all">إلغاء</button>
                        <button
                            form="groupForm"
                            disabled={saving}
                            type="submit"
                            className="flex-[2] btn-elite-primary py-4 rounded-2xl flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            <span>{isEditing ? 'حفظ التغييرات' : 'إنشاء الحلقة الآن'}</span>
                        </button>
                    </>
                )}
            >
                <form id="groupForm" onSubmit={handleSave} className="space-y-10 py-2">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> اسم الحلقة الصفي
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="مثال: حلقة الإمام البخاري"
                                value={currentGroup.name}
                                onChange={e => setCurrentGroup({ ...currentGroup, name: e.target.value })}
                                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-2 flex items-center gap-2">
                                <UserCircle className="w-3 h-3" /> معلم الحلقة المشرف
                            </label>
                            <select
                                required
                                value={currentGroup.supervisorId}
                                onChange={e => setCurrentGroup({ ...currentGroup, supervisorId: e.target.value })}
                                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-bold appearance-none"
                            >
                                <option value="">اختر المعلم...</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.uid} value={teacher.uid}>{teacher.displayName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-2 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> نوع وتصنيف الحلقة
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/5">
                            <label className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl cursor-pointer transition-all border ${currentGroup.gender === 'male' ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20 active:scale-95' : 'bg-transparent border-transparent hover:bg-white/5 opacity-50'}`}>
                                <input type="radio" value="male" checked={currentGroup.gender === 'male'} onChange={() => setCurrentGroup({ ...currentGroup, gender: 'male' })} className="hidden" />
                                <span className="font-black text-xs">قسم الرجال</span>
                            </label>
                            <label className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl cursor-pointer transition-all border ${currentGroup.gender === 'female' ? 'bg-pink-500 border-pink-400 text-white shadow-xl shadow-pink-600/20 active:scale-95' : 'bg-transparent border-transparent hover:bg-white/5 opacity-50'}`}>
                                <input type="radio" value="female" checked={currentGroup.gender === 'female'} onChange={() => setCurrentGroup({ ...currentGroup, gender: 'female' })} className="hidden" />
                                <span className="font-black text-xs">قسم النساء</span>
                            </label>
                            <label className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl cursor-pointer transition-all border ${currentGroup.visibility === 'public' ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-600/20 font-bold active:scale-95' : 'bg-transparent border-transparent hover:bg-white/5 opacity-50'}`}>
                                <input type="radio" value="public" checked={currentGroup.visibility === 'public'} onChange={() => setCurrentGroup({ ...currentGroup, visibility: 'public' })} className="hidden" />
                                <Globe className="w-4 h-4" />
                                <span className="text-xs font-black">عامة</span>
                            </label>
                            <label className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl cursor-pointer transition-all border ${currentGroup.visibility === 'private' ? 'bg-amber-600 border-amber-400 text-white shadow-xl shadow-amber-600/20 font-bold active:scale-95' : 'bg-transparent border-transparent hover:bg-white/5 opacity-50'}`}>
                                <input type="radio" value="private" checked={currentGroup.visibility === 'private'} onChange={() => setCurrentGroup({ ...currentGroup, visibility: 'private' })} className="hidden" />
                                <Lock className="w-4 h-4" />
                                <span className="text-xs font-black">خاصة</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-8 border-t border-white/5 pt-10">
                        <h3 className="flex items-center gap-3 font-black text-2xl tracking-tighter">
                            <Calendar className="w-6 h-6 text-primary" />
                            تنظيم الجدول الزمني
                        </h3>
                        {['recitationDays', 'reviewDays', 'vacationDays'].map((type) => (
                            <div key={type} className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-2">
                                    {type === 'recitationDays' ? 'أيام التسميع والحفظ الجديد' :
                                        type === 'reviewDays' ? 'أيام المراجعة والضبط المكثف' : 'أيام الإجازة والراحة'}
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {DAYS.map(day => {
                                        const isSelected = (currentGroup.schedule as any)[type]?.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(type as any, day)}
                                                className={`px-5 py-3 rounded-xl text-xs font-black border transition-all active:scale-90 ${isSelected
                                                    ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105'
                                                    : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> وقت بدء الحلقة
                                </label>
                                <input
                                    type="time"
                                    value={currentGroup.schedule.startTime || ""}
                                    onChange={e => setCurrentGroup({
                                        ...currentGroup,
                                        schedule: { ...currentGroup.schedule, startTime: e.target.value }
                                    })}
                                    className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 outline-none transition-all font-black text-xl text-center"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> وقت انصراف الحلقة
                                </label>
                                <input
                                    type="time"
                                    value={currentGroup.schedule.endTime || ""}
                                    onChange={e => setCurrentGroup({
                                        ...currentGroup,
                                        schedule: { ...currentGroup.schedule, endTime: e.target.value }
                                    })}
                                    className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 outline-none transition-all font-black text-xl text-center"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </EliteModal>

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
