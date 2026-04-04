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
                const docRef = doc(db, "system_config", "access_codes");
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
            const docRef = doc(db, "system_config", "access_codes");
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
                className="text-center space-y-4"
            >
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-500/20">
                    <Key className="w-10 h-10 text-amber-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">إدارة رموز الوصول</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    تحكم في الرموز السرية المطلوبة لانضمام المستخدمين الجدد حسب أدوارهم.
                </p>
            </motion.div>

            {/* Warning Message Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <GlassCard className="bg-amber-500/5 border-amber-500/20 p-6 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-1 text-sm">تنبيه أمان هام</h4>
                        <p className="text-xs text-amber-900/70 dark:text-amber-100/70 leading-relaxed">
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
                    className="flex justify-center pt-4"
                >
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto min-w-[300px] py-5 bg-primary text-white font-bold rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:translate-y-0 disabled:opacity-50 disabled:grayscale"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                        <span className="text-lg">حفظ جميع رموز الوصول</span>
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
            <GlassCard className="p-8 h-full flex flex-col justify-between group hover:border-primary/30 transition-all border-white/5 bg-white/5 dark:bg-white/2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{label}</h3>
                                <p className="text-[10px] text-muted-foreground">{description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative pt-2">
                        <input
                            type="text"
                            maxLength={6}
                            value={value}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                onChange(val);
                            }}
                            className="w-full text-center text-4xl font-mono tracking-[0.4em] bg-gray-50/50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-2xl py-6 focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all placeholder:text-gray-200 dark:placeholder:text-white/5 group-hover:bg-primary/5 shadow-inner"
                            placeholder="000000"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Six Digits</span>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}
