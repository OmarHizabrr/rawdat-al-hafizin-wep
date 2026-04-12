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
                const docRef = doc(db, "updates", "app", "updates", "config");
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
                const docRef = doc(db, "updates", "app", "updates", "config");
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
                className="text-center md:text-right space-y-4 bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16" />
                <div className="flex flex-col md:flex-row items-center gap-5 relative z-10">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <Smartphone className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight">إدارة التحديثات الذكية</h1>
                        <p className="text-[11px] md:text-xs text-muted-foreground opacity-60">تحكم في التحديثات الإجبارية وإصدارات تطبيق الاندرويد والايفون.</p>
                    </div>
                </div>
            </motion.div>

            {/* Critical Warning */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <GlassCard className="bg-red-500/5 border-red-500/10 p-4 flex gap-4 items-center rounded-xl md:rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-black text-red-600 dark:text-red-400 mb-0.5 text-xs">تحذير الرادع (Version Code Constraint)</h4>
                        <p className="text-[10px] text-red-900/60 dark:text-red-100/60 leading-relaxed font-medium">
                            أي مستخدم يملك (Version Code) أقل من الرقم الذي ستضعه هنا، سيتوقف تطبيقه فوراً وسيظهر له زر التحديث.
                        </p>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Form Zone */}
            <form onSubmit={handleSave} className="space-y-8">
                <GlassCard className="p-6 md:p-8 space-y-6 bg-white/5 border-white/10 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <Tag className="w-3 h-3" />
                                رقم النسخة المرئي
                            </label>
                            <input
                                required
                                type="text"
                                value={config.version}
                                onChange={e => setConfig({ ...config, version: e.target.value })}
                                className="w-full py-3 px-4 rounded-xl border border-white/5 bg-white/[0.02] focus:ring-4 focus:ring-primary/5 outline-none transition-all font-mono text-sm"
                                placeholder="v1.0.0"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <Hash className="w-3 h-3" />
                                رقم الإصدار البرمجي
                            </label>
                            <input
                                required
                                type="number"
                                value={config.versionCode}
                                onChange={e => setConfig({ ...config, versionCode: parseInt(e.target.value) || 0 })}
                                className="w-full py-3 px-4 rounded-xl border border-white/5 bg-white/[0.02] focus:ring-4 focus:ring-primary/5 outline-none transition-all font-mono font-black text-base"
                                placeholder="21"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                            <Download className="w-3 h-3" />
                            رابط تحميل النسخة الجديدة
                        </label>
                        <input
                            required
                            type="url"
                            value={config.updateUrl}
                            onChange={e => setConfig({ ...config, updateUrl: e.target.value })}
                            className="w-full py-3 px-4 rounded-xl border border-white/5 bg-white/[0.02] focus:ring-4 focus:ring-primary/5 outline-none transition-all dir-ltr text-xs"
                            placeholder="https://rawdat.com/download/app.apk"
                        />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                            <MessageSquare className="w-3 h-3" />
                            رسالة التحديث للمستخدمين
                        </label>
                        <textarea
                            value={config.customMessage || ""}
                            onChange={e => setConfig({ ...config, customMessage: e.target.value })}
                            className="w-full h-24 p-4 rounded-xl border border-white/5 bg-white/[0.02] focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none leading-relaxed text-xs"
                            placeholder="صف التحديث الجديد..."
                        />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                            <Phone className="w-3 h-3" />
                            رقم واتس الدعم المرجعي
                        </label>
                        <input
                            type="text"
                            value={config.supportPhone || ""}
                            onChange={e => setConfig({ ...config, supportPhone: e.target.value })}
                            className="w-full py-3 px-4 rounded-xl border border-white/5 bg-white/[0.02] focus:ring-4 focus:ring-primary/5 outline-none transition-all font-mono text-sm"
                            placeholder="967777xxx..."
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-[9px] text-muted-foreground/40 italic">
                            سيتم منع تسجيل الدخول للنسخ القديمة فور النشر.
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-8 py-3.5 bg-primary text-white rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-3 w-full md:w-auto active:scale-95 ${saving ? 'opacity-70 pointer-events-none' : 'hover:shadow-primary/20'}`}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowUpCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm">نشر التحديث الإجباري</span>
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
