"use client";

import React, { useState, useEffect } from "react";
import { 
    collection, query, onSnapshot, doc, setDoc, 
    serverTimestamp, updateDoc, deleteDoc, getDocs,
    writeBatch, getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
    Award, Shield, Trophy, Star, Settings, 
    Plus, Trash2, Edit, Save, X, Loader2,
    Zap, Target, Heart, Flame, Sparkles,
    Coins, AlertCircle, CheckCircle2, ChevronRight,
    Search, LayoutGrid, List
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Define Badges Interface
interface BadgeTemplate {
    id: string;
    name: string;
    description: string;
    iconKey: string;
    requiredPoints: number;
    rarity: 'bronze' | 'silver' | 'gold' | 'diamond';
    color: string;
}

// Define Points Settings Interface
interface PointsSettings {
    dailyTask: number;
    courseComplete: number;
    volumeComplete: number;
    recitationAttend: number;
    penaltyAbsence: number;
    // New Detailed Marks
    recitationExcellent: number;
    recitationVeryGood: number;
    recitationGood: number;
    recitationAcceptable: number;
    testExcellent: number;
    testVeryGood: number;
    testGood: number;
    testAcceptable: number;
}

const RARITY_CONFIG = {
    bronze: { label: 'برونزي', color: 'from-orange-400 to-orange-700', bg: 'bg-orange-500/10', text: 'text-orange-500' },
    silver: { label: 'فضي', color: 'from-gray-300 to-gray-500', bg: 'bg-gray-400/10', text: 'text-gray-400' },
    gold: { label: 'ذهبي', color: 'from-amber-400 to-amber-600', bg: 'bg-amber-500/10', text: 'text-amber-500' },
    diamond: { label: 'ماسي', color: 'from-cyan-300 to-blue-500', bg: 'bg-cyan-500/10', text: 'text-cyan-500' }
};

const AVAILABLE_ICONS = [
    { key: 'Star', icon: Star },
    { key: 'Award', icon: Award },
    { key: 'Shield', icon: Shield },
    { key: 'Trophy', icon: Trophy },
    { key: 'Zap', icon: Zap },
    { key: 'Target', icon: Target },
    { key: 'Heart', icon: Heart },
    { key: 'Flame', icon: Flame },
    { key: 'Sparkles', icon: Sparkles }
];

export default function GamificationAdmin() {
    const [badges, setBadges] = useState<BadgeTemplate[]>([]);
    const [settings, setSettings] = useState<PointsSettings>({
        dailyTask: 5,
        courseComplete: 50,
        volumeComplete: 100,
        recitationAttend: 10,
        penaltyAbsence: -5,
        recitationExcellent: 10,
        recitationVeryGood: 7,
        recitationGood: 5,
        recitationAcceptable: 3,
        testExcellent: 50,
        testVeryGood: 40,
        testGood: 30,
        testAcceptable: 20
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
    const [currentBadge, setCurrentBadge] = useState<Partial<BadgeTemplate>>({
        rarity: 'bronze',
        iconKey: 'Star',
        color: 'from-orange-400 to-orange-700'
    });

    // 1. Fetch Badges & Settings
    useEffect(() => {
        setLoading(true);
        // Standardized Path: badges_library/global/badges_library
        const qBadges = query(collection(db, "badges_library", "global", "badges_library"));
        const unsubscribeBadges = onSnapshot(qBadges, (snap) => {
            setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() } as BadgeTemplate)));
            setLoading(false);
        });

        // Points Settings: points_config/global/points_config/settings
        const fetchSettings = async () => {
            const docRef = doc(db, "points_config", "global", "points_config", "settings");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data() as PointsSettings);
            }
        };
        fetchSettings();

        return () => unsubscribeBadges();
    }, []);

    // 2. Handle Settings Save
    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, "points_config", "global", "points_config", "settings");
            await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() });
            alert("تم حفظ إعدادات النقاط بنجاح");
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // 3. Handle Badge Save
    const handleSaveBadge = async () => {
        if (!currentBadge.name || !currentBadge.requiredPoints) return;
        setSaving(true);
        try {
            const id = currentBadge.id || doc(collection(db, "badges_library")).id;
            // Nested Path: badges_library/global/badges_library/{id}
            const badgeRef = doc(db, "badges_library", "global", "badges_library", id);
            await setDoc(badgeRef, {
                ...currentBadge,
                id,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setIsBadgeModalOpen(false);
            setCurrentBadge({ rarity: 'bronze', iconKey: 'Star' });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBadge = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الوسام؟")) return;
        await deleteDoc(doc(db, "badges_library", "global", "badges_library", id));
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">إدارة المحفزات والأوسمة</h1>
                    <p className="text-muted-foreground font-medium">تحكم في معايير كسب النقاط، وصمم أوسمة فريدة لطلابك.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { setCurrentBadge({ rarity: 'bronze', iconKey: 'Star', color: 'from-orange-400 to-orange-700' }); setIsBadgeModalOpen(true); }}
                        className="bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> إضافة وسام جديد
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Points Configuration */}
                <div className="lg:col-span-1">
                    <GlassCard className="p-8 border-primary/20 bg-primary/5 sticky top-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl"><Settings className="w-6 h-6 text-primary" /></div>
                            <h2 className="text-xl font-bold">إعدادات النقاط</h2>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-primary">القواعد العامة</h3>
                                {[
                                    { key: 'dailyTask', label: 'المهمة اليومية', icon: Zap, color: 'text-yellow-500' },
                                    { key: 'recitationAttend', label: 'حضور التسميع', icon: Heart, color: 'text-red-500' },
                                    { key: 'penaltyAbsence', label: 'خصم الغياب', icon: AlertCircle, color: 'text-rose-500' }
                                ].map((field) => (
                                    <PointInput key={field.key} field={field} settings={settings} setSettings={setSettings} />
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">نقاط التسميع اليومي</h3>
                                {[
                                    { key: 'recitationExcellent', label: 'تقدير ممتاز', icon: Star, color: 'text-blue-500' },
                                    { key: 'recitationVeryGood', label: 'تقدير جيد جداً', icon: Star, color: 'text-blue-400 opacity-80' },
                                    { key: 'recitationGood', label: 'تقدير جيد', icon: Star, color: 'text-blue-300 opacity-60' }
                                ].map((field) => (
                                    <PointInput key={field.key} field={field} settings={settings} setSettings={setSettings} />
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">نقاط الاختبارات</h3>
                                {[
                                    { key: 'testExcellent', label: 'اختبار: ممتاز', icon: Trophy, color: 'text-amber-500' },
                                    { key: 'testVeryGood', label: 'اختبار: جيد جداً', icon: Trophy, color: 'text-amber-400 opacity-80' }
                                ].map((field) => (
                                    <PointInput key={field.key} field={field} settings={settings} setSettings={setSettings} />
                                ))}
                            </div>

                            <button 
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                اعتماد كافة القواعد
                            </button>
                        </div>
                    </GlassCard>
                </div>

                {/* Badges Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Award className="w-6 h-6 text-amber-500" />
                            <h2 className="text-xl font-bold">مكتبة الأوسمة الحالية ({badges.length})</h2>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {badges.map((badge) => {
                            const rarity = RARITY_CONFIG[badge.rarity];
                            const IconComp = AVAILABLE_ICONS.find(i => i.key === badge.iconKey)?.icon || Star;

                            return (
                                <GlassCard key={badge.id} className="group p-6 relative overflow-hidden transition-all hover:-translate-y-1">
                                    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full -mr-16 -mt-16 bg-gradient-to-br", badge.color)} />
                                    
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br",
                                                badge.color
                                            )}>
                                                <IconComp className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg">{badge.name}</h3>
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", rarity.bg, rarity.text)}>
                                                    وسام {rarity.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setCurrentBadge(badge); setIsBadgeModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 border border-white/5"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteBadge(badge.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 border border-white/5"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-2 relative z-10">
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-2">{badge.description}</p>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Coins className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-black">{badge.requiredPoints} نقطة مطلوب</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })}

                        {badges.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4 opacity-30">
                                <Award className="w-20 h-20 mx-auto" />
                                <p className="font-black text-xl">لا توجد أوسمة مصممة بعد.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Badge Management Modal */}
            <AnimatePresence>
                {isBadgeModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBadgeModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden flex flex-col"
                        >
                            <div className="p-8 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                                <h3 className="text-xl font-black">{currentBadge.id ? 'تعديل وسام' : 'تصميم وسام جديد'}</h3>
                                <button onClick={() => setIsBadgeModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                                {/* Icon & Rarity Preview */}
                                <div className="flex justify-center py-4">
                                    <div className={cn(
                                        "w-24 h-24 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl bg-gradient-to-br transition-all duration-500",
                                        currentBadge.color
                                    )}>
                                        {AVAILABLE_ICONS.find(i => i.key === currentBadge.iconKey)?.icon({ className: "w-12 h-12" }) || <Star className="w-12 h-12" />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-full space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-60">اسم الوسام</label>
                                        <input 
                                            type="text" value={currentBadge.name || ''} 
                                            onChange={(e) => setCurrentBadge({ ...currentBadge, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-60">النقاط المطلوبة</label>
                                        <input 
                                            type="number" value={currentBadge.requiredPoints || 0} 
                                            onChange={(e) => setCurrentBadge({ ...currentBadge, requiredPoints: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-60">مستوى الندرة</label>
                                        <select 
                                            value={currentBadge.rarity} 
                                            onChange={(e) => {
                                                const r = e.target.value as any;
                                                setCurrentBadge({ ...currentBadge, rarity: r, color: (RARITY_CONFIG as any)[r].color });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                                        >
                                            <option value="bronze">برونزي</option>
                                            <option value="silver">فضي</option>
                                            <option value="gold">ذهبي</option>
                                            <option value="diamond">ماسي</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-60">الأيقونة</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {AVAILABLE_ICONS.map((icon) => (
                                            <button 
                                                key={icon.key}
                                                onClick={() => setCurrentBadge({ ...currentBadge, iconKey: icon.key })}
                                                className={cn(
                                                    "aspect-square rounded-xl border flex items-center justify-center transition-all",
                                                    currentBadge.iconKey === icon.key ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <icon.icon className="w-6 h-6" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-60">وصف الوسام</label>
                                    <textarea 
                                        value={currentBadge.description || ''} 
                                        onChange={(e) => setCurrentBadge({ ...currentBadge, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-primary/50 outline-none font-medium h-24"
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-white/5 border-t border-white/5 flex gap-4">
                                <button onClick={() => setIsBadgeModalOpen(false)} className="flex-1 py-4 bg-white/10 rounded-2xl font-black">إلغاء</button>
                                <button 
                                    onClick={handleSaveBadge}
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {currentBadge.id ? 'تحديث الوسام' : 'حفظ الوسام'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PointInput({ field, settings, setSettings }: any) {
    const Icon = field.icon;
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2 px-1">
                <Icon className={cn("w-3.5 h-3.5", field.color)} /> {field.label}
            </label>
            <div className="relative group">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20 group-focus-within:opacity-50 transition-opacity" />
                <input 
                    type="number" 
                    value={(settings as any)[field.key]} 
                    onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-6 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-lg transition-all"
                />
            </div>
        </div>
    );
}
