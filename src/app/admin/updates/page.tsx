"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Save,
    Loader2,
    Smartphone,
    Tag,
    Hash,
    Link as LinkIcon,
    MessageSquare,
    Phone,
    AlertTriangle,
    ShieldCheck,
    ArrowUpCircle,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface UpdateConfig {
    version: string;
    versionCode: number;
    updateUrl: string;
    customMessage: string;
    supportPhone: string;
}

const defaultConfig: UpdateConfig = {
    version: "1.0.0",
    versionCode: 1,
    updateUrl: "",
    customMessage: "",
    supportPhone: "967777613709"
};

export default function AppUpdatesDashboard() {
    const [config, setConfig] = useState<UpdateConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Dialog state
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
        const fetchConfig = async () => {
            try {
                const docRef = doc(db, "app_config", "update_config");
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setConfig({ ...defaultConfig, ...snapshot.data() } as UpdateConfig);
                }
            } catch (error) {
                console.error("Error fetching config:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const showDialog = (type: 'success' | 'danger' | 'warning', title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        showDialog('warning', 'تحديث إجباري', 'حفظ هذه الإعدادات سيفعل نظام التحديث الإجباري لجميع المستخدمين الذين يملكون نسخة أقدم. هل تود المتابعة؟', async () => {
            setSaving(true);
            try {
                const docRef = doc(db, "app_config", "update_config");
                await setDoc(docRef, {
                    ...config,
                    updatedAt: serverTimestamp()
                });
                showDialog('success', 'تم النشر بنجاح', 'تم تحديث إعدادات الإصدار الجديد ونشرها لجميع تطبيقات الجوال في النظام.');
            } catch (error) {
                console.error("Error saving config:", error);
                showDialog('danger', 'فشل الحفظ', 'حدث خطأ أثناء محاولة حفظ الإعدادات. يرجى التأكد من صلاحياتك.');
            } finally {
                setSaving(false);
            }
        });
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-10 pb-20 max-w-4xl mx-auto px-4">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center md:text-right space-y-4 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden"
            >
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <Smartphone className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">إدارة التحديثات الذكية</h1>
                        <p className="text-muted-foreground mt-1 max-w-xl">تحكم في التحديثات الإجبارية وإصدارات تطبيق الاندرويد والايفون.</p>
                    </div>
                </div>
            </motion.div>

            {/* Critical Warning */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <GlassCard className="bg-red-500/5 border-red-500/20 p-6 flex gap-5 items-center">
                    <div className="w-14 h-14 rounded-22xl bg-red-500/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <AlertTriangle className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-600 dark:text-red-400 mb-1">تحذير الرادع (Version Code Constraint)</h4>
                        <p className="text-xs text-red-900/70 dark:text-red-100/70 leading-relaxed font-medium">
                            أي مستخدم يملك (Version Code) أقل من الرقم الذي ستضعه هنا، سيتوقف تطبيقه فوراً وسيظهر له زر التحديث. يرجى مراجعة الرقم جيداً قبل الحفظ.
                        </p>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Form Zone */}
            <form onSubmit={handleSave} className="space-y-8">
                <GlassCard className="p-10 space-y-8 bg-white/5 border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <Tag className="w-3 h-3" />
                                رقم النسخة المرئي (Example: v1.02)
                            </label>
                            <input
                                required
                                type="text"
                                value={config.version}
                                onChange={e => setConfig({ ...config, version: e.target.value })}
                                className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono"
                                placeholder="v1.0.0"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <Hash className="w-3 h-3" />
                                رقم الإصدار البرمجي (Numeric Code)
                            </label>
                            <input
                                required
                                type="number"
                                value={config.versionCode}
                                onChange={e => setConfig({ ...config, versionCode: parseInt(e.target.value) || 0 })}
                                className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono font-bold text-lg"
                                placeholder="21"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                            <Download className="w-3 h-3" />
                            رابط تحميل النسخة الجديدة (Update URL)
                        </label>
                        <input
                            required
                            type="url"
                            value={config.updateUrl}
                            onChange={e => setConfig({ ...config, updateUrl: e.target.value })}
                            className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all dir-ltr"
                            placeholder="https://rawdat.com/download/app.apk"
                        />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                            <MessageSquare className="w-3 h-3" />
                            محتوى رسالة التحديث للمستخدمين
                        </label>
                        <textarea
                            value={config.customMessage || ""}
                            onChange={e => setConfig({ ...config, customMessage: e.target.value })}
                            className="w-full h-32 p-5 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none leading-relaxed"
                            placeholder="عزيزي المستخدم، نرجو منك تحديث التطبيق للحصول على آخر المميزات والأمان..."
                        />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                            <Phone className="w-3 h-3" />
                            رقم واتس لدعم الإصدار (Support ID)
                        </label>
                        <input
                            type="text"
                            value={config.supportPhone || ""}
                            onChange={e => setConfig({ ...config, supportPhone: e.target.value })}
                            className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono"
                            placeholder="967777xxx..."
                        />
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-[10px] text-muted-foreground/50 opacity-40 italic">
                            سيتم منع تسجيل الدخول فور تفعيل هذا التحديث لجميع النسخ القديمة.
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-10 py-5 bg-primary text-white rounded-2xl font-bold shadow-2xl transition-all flex items-center justify-center gap-3 w-full md:w-auto hover:-translate-y-1 active:translate-y-0 ${saving ? 'opacity-70 pointer-events-none' : 'hover:shadow-primary/40'}`}
                        >
                            {saving ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <ArrowUpCircle className="w-6 h-6" />
                            )}
                            <span className="text-lg">نشر التحديث الإجباري الآن</span>
                        </button>
                    </div>
                </GlassCard>
            </form>

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
                confirmText={dialogConfig.onConfirm ? "نعم، انشر التحديث" : "حسناً"}
            />
        </div>
    );
}
