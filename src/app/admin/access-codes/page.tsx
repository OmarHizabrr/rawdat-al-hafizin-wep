"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Key,
    ShieldAlert,
    Lock,
    Save,
    Loader2,
    AlertTriangle,
    ShieldCheck,
    Users,
    UserCheck,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface AccessCodes {
    admin: string;
    teacher: string;
    student: string;
    committee: string;
}

const initialCodes: AccessCodes = {
    admin: "",
    teacher: "",
    student: "",
    committee: "",
};

export default function AccessCodesManagement() {
    const [codes, setCodes] = useState<AccessCodes>(initialCodes);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'warning';
        title: string;
        description: string;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        description: ''
    });

    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const docRef = doc(db, "access_codes", "security", "access_codes", "config");
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    setCodes({
                        admin: data.admin || "",
                        teacher: data.teacher || "",
                        student: data.student || "",
                        committee: data.committee || "",
                    });
                } else {
                    // Set defaults if not exists
                    setCodes({
                        admin: '414456',
                        teacher: '111111',
                        student: '222222',
                        committee: '333333'
                    });
                }
            } catch (error) {
                console.error("Error fetching codes:", error);
                showDialog('danger', 'خطأ في التحميل', 'تعذر جلب رموز الوصول من قاعدة البيانات.');
            } finally {
                setLoading(false);
            }
        };
        fetchCodes();
    }, []);

    const handleChange = (key: keyof AccessCodes, value: string) => {
        setCodes(prev => ({ ...prev, [key]: value }));
    };

    const showDialog = (type: 'success' | 'danger' | 'warning', title: string, description: string) => {
        setDialogConfig({ isOpen: true, type, title, description });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: 6 digits only for specific keys
        const roles: Record<string, string> = { 
            admin: 'المدير', 
            teacher: 'المعلم', 
            student: 'الطالب', 
            committee: 'اللجنة' 
        };

        const essentialKeys: (keyof AccessCodes)[] = ['admin', 'teacher', 'student', 'committee'];

        for (const key of essentialKeys) {
            const value = codes[key];
            if (!/^\d{6}$/.test(value)) {
                showDialog('warning', 'بيانات غير مكتملة', `رمز ${roles[key]} يجب أن يتكون من 6 أرقام بالضبط.`);
                return;
            }
        }

        setSaving(true);
        try {
            const docRef = doc(db, "access_codes", "security", "access_codes", "config");
            await setDoc(docRef, {
                admin: codes.admin,
                teacher: codes.teacher,
                student: codes.student,
                committee: codes.committee,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            showDialog('success', 'تم الحفظ بنجاح', 'تم تحديث جميع رموز الوصول بنجاح وتفعيلها في النظام.');
        } catch (error) {
            console.error("Error saving codes:", error);
            showDialog('danger', 'فشل الحفظ', 'حدث خطأ غير متوقع أثناء محاولة حفظ الرموز. تأكد من اتصال الإنترنت.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
            {/* Header section with Motion */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2 pt-4"
            >
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
                    <Key className="w-7 h-7 text-amber-500" />
                </div>
                <h1 className="text-2xl font-black tracking-tight">إدارة رموز الوصول</h1>
                <p className="text-[11px] md:text-xs text-muted-foreground max-w-sm mx-auto opacity-60">
                    تحكم في الرموز السرية المطلوبة لانضمام المستخدمين الجدد حسب أدوارهم.
                </p>
            </motion.div>

            {/* Warning Message Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <GlassCard className="bg-amber-500/5 border-amber-500/10 p-4 flex gap-4 items-center rounded-xl md:rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-0.5 text-xs">تنبيه أمان هام</h4>
                        <p className="text-[10px] text-amber-900/60 dark:text-amber-100/60 leading-relaxed max-w-lg">
                            تغيير هذه الرموز سيؤثر فوراً على عملية التسجيل الجديدة. أي شخص يحاول التسجيل باستخدام الرمز القديم لن يتمكن من الدخول.
                        </p>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Input Grid */}
            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <AccessCodeCard
                        label="رمز المدير (الأدمن)"
                        icon={ShieldCheck}
                        color="text-red-500"
                        bg="bg-red-500/5"
                        value={codes.admin}
                        onChange={(v) => handleChange('admin', v)}
                        description="يمنح صلاحيات إدارية كاملة للمنصة."
                        delay={0.2}
                    />
                    <AccessCodeCard
                        label="رمز المعلم"
                        icon={UserCheck}
                        color="text-blue-500"
                        bg="bg-blue-500/5"
                        value={codes.teacher}
                        onChange={(v) => handleChange('teacher', v)}
                        description="يسمح بالانضمام كهيئة تعليمية."
                        delay={0.3}
                    />
                    <AccessCodeCard
                        label="رمز الطالب"
                        icon={Users}
                        color="text-green-500"
                        bg="bg-green-500/5"
                        value={codes.student}
                        onChange={(v) => handleChange('student', v)}
                        description="الرمز الافتراضي لانضمام الطلاب."
                        delay={0.4}
                    />
                    <AccessCodeCard
                        label="رمز اللجنة العلمية"
                        icon={ShieldAlert}
                        color="text-purple-500"
                        bg="bg-purple-500/5"
                        value={codes.committee}
                        onChange={(v) => handleChange('committee', v)}
                        description="صلاحيات محددة لتقييم المحتوى."
                        delay={0.5}
                    />
                </div>

                {/* Save Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center pt-2"
                >
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto min-w-[280px] py-3.5 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span className="text-base">حفظ جميع رموز الوصول</span>
                    </button>
                </motion.div>
            </form>

            <EliteDialog
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
                onConfirm={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
                title={dialogConfig.title}
                description={dialogConfig.description}
                type={dialogConfig.type as any}
                confirmText="حسناً"
            />
        </div>
    );
}

function AccessCodeCard({ 
    label, 
    icon: Icon, 
    color, 
    bg, 
    value, 
    onChange, 
    description,
    delay 
}: { 
    label: string, 
    icon: any, 
    color: string, 
    bg: string, 
    value: string, 
    onChange: (v: string) => void,
    description: string,
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.5 }}
        >
            <GlassCard className="p-5 md:p-6 h-full flex flex-col justify-between group hover:border-primary/30 transition-all border-white/5 bg-white/5 rounded-2xl">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shadow-inner`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-base">{label}</h3>
                                <p className="text-[9px] text-muted-foreground opacity-50">{description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative pt-1">
                        <input
                            type="text"
                            maxLength={6}
                            value={value}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                onChange(val);
                            }}
                            className="w-full text-center text-3xl font-mono tracking-[0.4em] bg-white/[0.02] border border-white/5 rounded-xl py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-white/5 group-hover:bg-primary/[0.02] shadow-inner"
                            placeholder="000000"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[7px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Secure Pin</span>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}
