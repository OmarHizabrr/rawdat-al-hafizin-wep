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
    AlertTriangle
} from "lucide-react";

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
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const docRef = doc(db, "system_config", "access_codes");
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setCodes(snap.data() as AccessCodes);
                } else {
                    // Set defaults if not exists
                    setCodes({
                        admin: '000000',
                        teacher: '111111',
                        student: '222222',
                        committee: '333333'
                    });
                }
            } catch (error) {
                console.error("Error fetching codes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCodes();
    }, []);

    const handleChange = (key: keyof AccessCodes, value: string) => {
        setCodes(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation: 6 digits
        for (const [key, value] of Object.entries(codes)) {
            if (!/^\d{6}$/.test(value)) {
                setMessage({ type: 'error', text: `رمز ${key} يجب أن يتكون من 6 أرقام فقط.` });
                return;
            }
        }

        setSaving(true);
        try {
            await setDoc(doc(db, "system_config", "access_codes"), {
                ...codes,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setMessage({ type: 'success', text: "تم تحديث رموز الوصول بنجاح." });
        } catch (error) {
            console.error("Error saving codes:", error);
            setMessage({ type: 'error', text: "حدث خطأ أثناء الحفظ." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Key className="w-8 h-8 text-amber-500" />
                    إدارة رموز الوصول
                </h1>
                <p className="text-muted-foreground mt-2">
                    تعديل رموز الدخول الخاصة بالأدمن، المعلمين، الطلاب، واللجنة.
                </p>
            </div>

            <GlassCard className="bg-amber-500/5 border-amber-500/20 p-4 flex gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                    <strong>تنبيه:</strong> تغيير هذه الرموز سيؤثر فوراً على قدرة المستخدمين الجدد على الانضمام. المستخدمون الحاليون لن يتأثروا إلا إذا طلب منهم إعادة إدخال الرمز.
                </p>
            </GlassCard>

            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <InputCard
                    label="رمز الأدمن (المدير)"
                    icon={ShieldAlert}
                    color="text-red-500"
                    value={codes.admin}
                    onChange={(v) => handleChange('admin', v)}
                />
                <InputCard
                    label="رمز المعلم"
                    icon={Lock}
                    color="text-blue-500"
                    value={codes.teacher}
                    onChange={(v) => handleChange('teacher', v)}
                />
                <InputCard
                    label="رمز الطالب"
                    icon={Key}
                    color="text-green-500"
                    value={codes.student}
                    onChange={(v) => handleChange('student', v)}
                />
                <InputCard
                    label="رمز اللجنة العلمية"
                    icon={ShieldAlert}
                    color="text-purple-500"
                    value={codes.committee}
                    onChange={(v) => handleChange('committee', v)}
                />

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>حفظ التغييرات</span>
                </button>
            </form>
        </div>
    );
}

function InputCard({ label, icon: Icon, color, value, onChange }: { label: string, icon: any, color: string, value: string, onChange: (v: string) => void }) {
    return (
        <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-white/5 ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <label className="font-bold">{label}</label>
            </div>
            <input
                type="text"
                maxLength={6}
                value={value}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    onChange(val);
                }}
                className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-200 dark:placeholder:text-white/5"
                placeholder="000000"
            />
        </GlassCard>
    );
}
