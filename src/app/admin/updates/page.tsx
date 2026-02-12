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
    AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!confirm("تنبيه: حفظ هذه الإعدادات سيجعل التحديث إجبارياً لجميع المستخدمين الذين يملكون نسخة أقدم!")) {
            return;
        }

        setSaving(true);
        try {
            const docRef = doc(db, "app_config", "update_config");
            await setDoc(docRef, {
                ...config,
                updatedAt: serverTimestamp()
            });
            alert("تم حفظ الإعدادات بنجاح");
        } catch (error) {
            console.error("Error saving config:", error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">إدارة التحديثات</h1>
                <p className="text-muted-foreground">التحكم في إصدارات تطبيق الجوال وتحديثاته الإجبارية</p>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                    <p className="font-bold">تنبيه هام</p>
                    <p className="text-sm">أي مستخدم يستخدم تطبيقاً برقم إصدار (Version Code) أقل من الرقم المسجل هنا سيتم منعه من استخدام التطبيق وسيطالب بالتحديث فوراً.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <GlassCard className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Tag className="w-4 h-4 text-primary" />
                                رقم النسخة المرئي (Version Name)
                            </label>
                            <input
                                required
                                type="text"
                                value={config.version}
                                onChange={e => setConfig({ ...config, version: e.target.value })}
                                className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="مثلاً 1.0.0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Hash className="w-4 h-4 text-primary" />
                                رقم الإصدار الداخلي (Version Code)
                            </label>
                            <input
                                required
                                type="number"
                                value={config.versionCode}
                                onChange={e => setConfig({ ...config, versionCode: parseInt(e.target.value) || 0 })}
                                className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="مثلاً 21"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-primary" />
                            رابط التحديث المباشر (Direct URL)
                        </label>
                        <input
                            required
                            type="url"
                            value={config.updateUrl}
                            onChange={e => setConfig({ ...config, updateUrl: e.target.value })}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 dir-ltr"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            رسالة التحديث (اختياري)
                        </label>
                        <textarea
                            value={config.customMessage || ""}
                            onChange={e => setConfig({ ...config, customMessage: e.target.value })}
                            className="w-full h-24 p-3 rounded-xl border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            placeholder="رسالة تظهر للمستخدم عند طلب التحديث..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            رقم الدعم الفني (WhatsApp)
                        </label>
                        <input
                            type="text"
                            value={config.supportPhone || ""}
                            onChange={e => setConfig({ ...config, supportPhone: e.target.value })}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="967..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span>حفظ ونشر التحديث</span>
                        </button>
                    </div>
                </GlassCard>
            </form>
        </div>
    );
}
