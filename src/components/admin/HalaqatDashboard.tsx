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
    serverTimestamp
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
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    }
};

const DAYS = [
    'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'
];

interface HalaqatDashboardProps {
    readonly?: boolean; // If true, disable editing/adding
    supervisorFilter?: string; // If provided, only show groups for this supervisor
}

export function HalaqatDashboard({ readonly = false, supervisorFilter }: HalaqatDashboardProps) {
    const [groups, setGroups] = useState<GroupModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<GroupModel>(initialGroupState);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "groups"), (snapshot) => {
            const groupsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as GroupModel[];
            setGroups(groupsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
            } else {
                await setDoc(doc(db, "groups", currentGroup.id), currentGroup);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving group:", error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
            try {
                await deleteDoc(doc(db, "groups", id));
            } catch (error) {
                console.error("Error deleting group:", error);
            }
        }
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

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">إدارة الحلقات</h1>
                    <p className="text-muted-foreground">تنظيم حلقات التحفيظ والمجموعات</p>
                </div>
                {!readonly && (
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة حلقة جديدة</span>
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="بحث عن حلقة أو مشرف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => (
                    <GlassCard key={group.id} className="group relative overflow-hidden transition-all hover:scale-[1.02]">
                        <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-xs font-bold text-white ${group.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                            {group.gender === 'male' ? 'رجال' : 'نساء'}
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{group.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <UserCircle className="w-4 h-4" />
                                        <span>{group.supervisorId || "غير محدد"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{group.schedule.recitationDays?.join(" • ") || "لم يحدد أيام"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{group.schedule.startTime || "--:--"} - {group.schedule.endTime || "--:--"}</span>
                                </div>
                            </div>

                            {!readonly && (
                                <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-white/5">
                                    <button
                                        onClick={() => handleEdit(group)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-blue-500"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(group.id)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}
                {filteredGroups.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        لا توجد حلقات مطابقة للبحث.
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
                                <h2 className="text-xl font-bold">{isEditing ? 'تعديل الحلقة' : 'إضافة حلقة جديدة'}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <form id="groupForm" onSubmit={handleSave} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">اسم الحلقة</label>
                                            <input
                                                required
                                                type="text"
                                                value={currentGroup.name}
                                                onChange={e => setCurrentGroup({ ...currentGroup, name: e.target.value })}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">معرف المشرف (ID)</label>
                                            <input
                                                required
                                                type="text"
                                                value={currentGroup.supervisorId}
                                                onChange={e => setCurrentGroup({ ...currentGroup, supervisorId: e.target.value })}
                                                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">نوع الحلقة</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value="male"
                                                    checked={currentGroup.gender === 'male'}
                                                    onChange={() => setCurrentGroup({ ...currentGroup, gender: 'male' })}
                                                    className="w-4 h-4 text-blue-500"
                                                />
                                                <span>رجال</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value="female"
                                                    checked={currentGroup.gender === 'female'}
                                                    onChange={() => setCurrentGroup({ ...currentGroup, gender: 'female' })}
                                                    className="w-4 h-4 text-pink-500"
                                                />
                                                <span>نساء</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            الجدول الزمني
                                        </h3>

                                        {['recitationDays', 'reviewDays', 'vacationDays'].map((type) => (
                                            <div key={type} className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    {type === 'recitationDays' ? 'أيام التسميع' :
                                                        type === 'reviewDays' ? 'أيام المراجعة' : 'أيام الإجازة'}
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {DAYS.map(day => {
                                                        const isSelected = (currentGroup.schedule as any)[type]?.includes(day);
                                                        return (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => toggleDay(type as any, day)}
                                                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${isSelected
                                                                    ? 'bg-primary text-white border-primary'
                                                                    : 'bg-transparent border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                {day}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">وقت البدء</label>
                                                <input
                                                    type="time"
                                                    value={currentGroup.schedule.startTime || ""}
                                                    onChange={e => setCurrentGroup({
                                                        ...currentGroup,
                                                        schedule: { ...currentGroup.schedule, startTime: e.target.value }
                                                    })}
                                                    className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">وقت الانتهاء</label>
                                                <input
                                                    type="time"
                                                    value={currentGroup.schedule.endTime || ""}
                                                    onChange={e => setCurrentGroup({
                                                        ...currentGroup,
                                                        schedule: { ...currentGroup.schedule, endTime: e.target.value }
                                                    })}
                                                    className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
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
                                    form="groupForm"
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
