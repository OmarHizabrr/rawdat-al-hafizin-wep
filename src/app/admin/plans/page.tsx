"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, onSnapshot, doc, setDoc, 
    updateDoc, deleteDoc, serverTimestamp, 
    query, orderBy 
} from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, Edit, Trash2, Search, Loader2, 
    X, Layout, Sparkles, Target, Layers, 
    ChevronRight, Info, CheckCircle2, 
    Settings2, BookOpen, Hash, Book,
    AlertCircle, ChevronDown
} from "lucide-react";
import { SUNNAH_VOLUMES } from "@/lib/volumes";
import { GlassCard } from "@/components/ui/GlassCard";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { cn } from "@/lib/utils";
import { PlanTemplate, PlanTierDefinition } from "@/types/plan";

const CATEGORY_MAP: any = {
    memorization: { label: 'حفظ', color: 'text-primary bg-primary/10' },
    revision: { label: 'مراجعة', color: 'text-amber-600 bg-amber-500/10' },
    mixed: { label: 'مشترك', color: 'text-purple-600 bg-purple-500/10' }
};

const DEFAULT_TIER: PlanTierDefinition = {
    id: 'hifz_new',
    label: 'حفظ جديد',
    color: '#A855F7',
    targetType: 'hadiths'
};

export default function PlansDashboard() {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<PlanTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<Partial<PlanTemplate>>({
        name: "",
        category: 'memorization',
        description: "",
        tiers: [{ ...DEFAULT_TIER }]
    });
    const [saving, setSaving] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ 
        isOpen: false, 
        type: 'success' as 'success'|'danger'|'warning'|'info', 
        title: '', 
        description: '',
        onConfirm: null as any
    });

    useEffect(() => {
        const q = query(collection(db, "plan_templates"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PlanTemplate[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            const templateId = isEditing ? currentTemplate.id! : doc(collection(db, "plan_templates")).id;
            const data = {
                ...currentTemplate,
                id: templateId,
                createdBy: user.uid,
                updatedAt: serverTimestamp(),
                createdAt: isEditing ? currentTemplate.createdAt : serverTimestamp()
            };
            await setDoc(doc(db, "plan_templates", templateId), data);
            setIsModalOpen(false);
            setDialogConfig({ isOpen: true, type: 'success', title: 'تم الحفظ', description: 'تم تحديث قالب الخطة بنجاح.', onConfirm: null });
        } catch (error) {
            setDialogConfig({ isOpen: true, type: 'danger', title: 'خطأ', description: 'حدث خطأ أثناء محاولة الحفظ.', onConfirm: null });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        setDialogConfig({ 
            isOpen: true, 
            type: 'warning', 
            title: 'حذف الخطة', 
            description: `هل أنت متأكد من حذف قالب "${name}"؟`,
            onConfirm: () => confirmDelete(id)
        });
    };

    const confirmDelete = async (id: string) => {
        await deleteDoc(doc(db, "plan_templates", id));
        setDialogConfig({ isOpen: false, type: 'success', title: '', description: '', onConfirm: null });
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>;

    const filtered = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 pb-24 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight">قوالب الخطط الذهبية</h1>
                    <p className="text-muted-foreground font-medium">إدارة استراتيجيات الحفظ والمراجعة المتطورة</p>
                </div>
                <button 
                    onClick={() => {
                        setCurrentTemplate({ name: "", category: 'memorization', description: "", tiers: [{ ...DEFAULT_TIER }] });
                        setIsEditing(false);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-[1.5rem] hover:bg-primary/90 transition-all font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>إنشاء استراتيجية جديدة</span>
                </button>
            </div>

            {/* Search */}
            <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="ابحث عن استراتيجية..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full py-5 pr-14 pl-6 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold placeholder:text-muted-foreground/50"
                />
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(template => (
                    <motion.div key={template.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <GlassCard className="p-0 overflow-hidden flex flex-col h-full hover:border-primary/30 transition-all group shadow-xl">
                            <div className="p-8 space-y-6 flex-1">
                                <div className="flex items-start justify-between">
                                    <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", CATEGORY_MAP[template.category].color)}>
                                        {CATEGORY_MAP[template.category].label}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setCurrentTemplate(template); setIsEditing(true); setIsModalOpen(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(template.id, template.name)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold tracking-tight line-clamp-1">{template.name}</h3>
                                    <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">{template.description}</p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">مستويات الخطة ({template.tiers.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {template.tiers.map(tier => (
                                            <div key={tier.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
                                                <span>{tier.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-primary/5 mt-auto flex items-center justify-between border-t border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                    <Layers className="w-3 h-3" />
                                    <span>نظام متفرع</span>
                                </div>
                                <button className="text-primary font-bold text-xs flex items-center gap-2 group-hover:translate-x-[-4px] transition-transform">
                                    استخدام في الدورة
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {/* Modal Designer */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{isEditing ? 'تعديل الاستراتيجية' : 'تصميم استراتيجية جديدة'}</h2>
                                        <p className="text-xs text-muted-foreground font-medium">حدد أبعاد وطبقات الخطة التعليمية</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <form id="templateForm" onSubmit={handleSave} className="space-y-8">
                                    {/* Basic Info */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-muted-foreground/50 tracking-widest px-2">اسم الاستراتيجية</label>
                                            <input
                                                required
                                                type="text"
                                                value={currentTemplate.name}
                                                onChange={e => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                                                className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                                placeholder="مثلاً: حفظ الأربعين النووية مع مراجعة"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-muted-foreground/50 tracking-widest px-2">التصنيف</label>
                                                <select
                                                    value={currentTemplate.category}
                                                    onChange={e => setCurrentTemplate({ ...currentTemplate, category: e.target.value as any })}
                                                    className="w-full p-5 bg-black/20 border border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                                >
                                                    <option value="memorization">حفظ فقط</option>
                                                    <option value="revision">مراجعة فقط</option>
                                                    <option value="mixed">مشترك (حفظ ومراجعة)</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                <p className="text-[10px] text-amber-600/80 font-bold leading-relaxed">تؤثر التصنيفات على كيفية ظهور التقارير في بوابة الطالب.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-muted-foreground/50 tracking-widest px-2">الوصف المختصر</label>
                                            <textarea
                                                value={currentTemplate.description}
                                                onChange={e => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                                                className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold h-24 resize-none"
                                                placeholder="وصف للطالب حول هذه الخطة..."
                                            />
                                        </div>
                                    </div>

                                    {/* Tiers Editor */}
                                    <div className="space-y-6 pt-8 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Layers className="w-5 h-5 text-primary" />
                                                <h3 className="text-lg font-bold">طبقات الخطة (Tiers)</h3>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setCurrentTemplate({ ...currentTemplate, tiers: [...(currentTemplate.tiers || []), { ...DEFAULT_TIER, id: Date.now().toString() }] })}
                                                className="text-[10px] bg-primary text-white px-4 py-2 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
                                            >
                                                + إضافة طبقة
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {currentTemplate.tiers?.map((tier, idx) => (
                                                <div key={tier.id} className="relative group/tier p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 text-xs font-black">{idx + 1}</div>
                                                        <input 
                                                            type="text" 
                                                            value={tier.label}
                                                            onChange={e => {
                                                                const newTiers = [...(currentTemplate.tiers || [])];
                                                                newTiers[idx].label = e.target.value;
                                                                setCurrentTemplate({ ...currentTemplate, tiers: newTiers });
                                                            }}
                                                            className="flex-1 bg-transparent border-none outline-none font-bold text-lg" 
                                                            placeholder="عنوان الطبقة (مثل: الحفظ الجديد)" 
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                const newTiers = currentTemplate.tiers?.filter((_, i) => i !== idx);
                                                                setCurrentTemplate({ ...currentTemplate, tiers: newTiers });
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest px-1">نوع المادة</label>
                                                            <select 
                                                                value={tier.targetType}
                                                                onChange={e => {
                                                                    const newTiers = [...(currentTemplate.tiers || [])];
                                                                    newTiers[idx].targetType = e.target.value as any;
                                                                    setCurrentTemplate({ ...currentTemplate, tiers: newTiers });
                                                                }}
                                                                className="w-full p-3 bg-black/20 border border-white/5 rounded-xl text-xs font-bold"
                                                            >
                                                                <option value="hadiths">أحاديث</option>
                                                                <option value="pages">صفحات</option>
                                                                <option value="volumes">مجلدات</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest px-1">لون التعريف</label>
                                                            <div className="flex items-center gap-3">
                                                                <input 
                                                                    type="color" 
                                                                    value={tier.color}
                                                                    onChange={e => {
                                                                        const newTiers = [...(currentTemplate.tiers || [])];
                                                                        newTiers[idx].color = e.target.value;
                                                                        setCurrentTemplate({ ...currentTemplate, tiers: newTiers });
                                                                    }}
                                                                    className="w-10 h-10 rounded-lg overflow-hidden bg-transparent cursor-pointer" 
                                                                />
                                                                <span className="text-[10px] font-mono text-muted-foreground">{tier.color}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Volume Selection UI */}
                                                    {tier.targetType === 'volumes' && (
                                                        <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest px-1">المجلدات المستهدفة (دراسة متعددة)</label>
                                                                <div className="relative group/select">
                                                                    <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-white/10 rounded-2xl min-h-[56px] focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                                        {tier.selectedVolumeIds?.length ? (
                                                                            tier.selectedVolumeIds.map(vId => {
                                                                                const vol = SUNNAH_VOLUMES.find(v => v.id === vId);
                                                                                return (
                                                                                    <div key={vId} className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-bold">
                                                                                        <div className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-r", vol?.color)} />
                                                                                        <span>{vol?.title}</span>
                                                                                        <button 
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const next = [...(currentTemplate.tiers || [])];
                                                                                                next[idx].selectedVolumeIds = next[idx].selectedVolumeIds?.filter(id => id !== vId);
                                                                                                setCurrentTemplate({ ...currentTemplate, tiers: next });
                                                                                            }}
                                                                                            className="hover:text-red-500 transition-colors"
                                                                                        >
                                                                                            <X className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground/50 self-center px-1">اختر المجلدات من القائمة أدناه...</span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-black/20 border border-white/5 rounded-xl custom-scrollbar">
                                                                        {SUNNAH_VOLUMES.map(vol => {
                                                                            const isSelected = tier.selectedVolumeIds?.includes(vol.id) || false;
                                                                            return (
                                                                                <button
                                                                                    key={vol.id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const next = [...(currentTemplate.tiers || [])];
                                                                                        const selected = next[idx].selectedVolumeIds || [];
                                                                                        if (isSelected) {
                                                                                            next[idx].selectedVolumeIds = selected.filter(id => id !== vol.id);
                                                                                        } else {
                                                                                            next[idx].selectedVolumeIds = [...selected, vol.id];
                                                                                        }
                                                                                        setCurrentTemplate({ ...currentTemplate, tiers: next });
                                                                                    }}
                                                                                    className={cn(
                                                                                        "flex items-center gap-2 p-2 rounded-lg text-right transition-all",
                                                                                        isSelected ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground border border-transparent hover:bg-white/10"
                                                                                    )}
                                                                                >
                                                                                    <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", isSelected ? "border-primary bg-primary text-white" : "border-white/20")}>
                                                                                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                                                                    </div>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-xs font-bold">{vol.title}</span>
                                                                                        <span className="text-[10px] opacity-60">{vol.totalPages} صفحة</span>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Pages Summary */}
                                                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Book className="w-5 h-5 text-primary" />
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest leading-none">إجمالي النطاق العلمي</p>
                                                                        <p className="text-sm font-black">
                                                                            {(tier.selectedVolumeIds || []).reduce((acc, vId) => acc + (SUNNAH_VOLUMES.find(v => v.id === vId)?.totalPages || 0), 0)} صفحة
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-muted-foreground">
                                                                    {tier.selectedVolumeIds?.length || 0} مجلدات
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-bold transition-all">إلغاء</button>
                                <button 
                                    form="templateForm" 
                                    disabled={saving} 
                                    type="submit" 
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    <span>حفظ الاستراتيجية</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EliteDialog 
                isOpen={dialogConfig.isOpen} 
                onClose={() => setDialogConfig({...dialogConfig, isOpen: false})} 
                onConfirm={() => {
                    if (dialogConfig.onConfirm) (dialogConfig.onConfirm as any)();
                    setDialogConfig({...dialogConfig, isOpen: false});
                }} 
                type={dialogConfig.type as any} 
                title={dialogConfig.title} 
                description={dialogConfig.description} 
            />
        </div>
    );
}
