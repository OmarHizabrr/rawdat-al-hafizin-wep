"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    User,
    MapPin,
    Phone,
    Briefcase,
    GraduationCap,
    Globe,
    Calendar,
    CheckCircle,
    Save,
    Loader2,
    FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface StudentData {
    personalInfo: {
        fullName: string;
        age: string;
        gender: 'male' | 'female';
        residence: string;
        country: string;
        phone: string;
        educationLevel: string;
        major: string;
        job: string;
    };
    enrollmentStatus: {
        internetAvailable: boolean;
        canAttendOnline: boolean;
        agreesToPlan: boolean;
        agreesToAttendance: boolean;
        hasMemorizedQuran: boolean;
    };
}

const initialData: StudentData = {
    personalInfo: {
        fullName: "",
        age: "",
        gender: "male",
        residence: "",
        country: "",
        phone: "",
        educationLevel: "",
        major: "",
        job: "",
    },
    enrollmentStatus: {
        internetAvailable: false,
        canAttendOnline: false,
        agreesToPlan: false,
        agreesToAttendance: false,
        hasMemorizedQuran: false,
    },
};

export default function StudentProfile() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<StudentData>(initialData);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                // Pre-fill from Auth User
                setFormData((prev) => ({
                    ...prev,
                    personalInfo: {
                        ...prev.personalInfo,
                        fullName: user.displayName || "",
                        phone: user.phoneNumber || "",
                    },
                }));

                // Load specific student profile
                const studentRef = doc(db, "students", "applicants", "students", user.uid);
                const studentSnap = await getDoc(studentRef);

                if (studentSnap.exists()) {
                    const data = studentSnap.data() as StudentData;
                    // Merge with initial to ensure structure
                    setFormData((prev) => ({
                        personalInfo: { ...prev.personalInfo, ...data.personalInfo },
                        enrollmentStatus: { ...prev.enrollmentStatus, ...data.enrollmentStatus },
                    }));
                } else if (userData) {
                    // Fallback to minimal user data if no student profile yet
                    setFormData((prev) => ({
                        ...prev,
                        personalInfo: {
                            ...prev.personalInfo,
                            fullName: userData.displayName || prev.personalInfo.fullName,
                            phone: userData.phoneNumber || prev.personalInfo.phone,
                        }
                    }));
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, userData]);

    const handleChange = (section: keyof StudentData, field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        const { enrollmentStatus, personalInfo } = formData;
        if (
            !enrollmentStatus.internetAvailable ||
            !enrollmentStatus.canAttendOnline ||
            !enrollmentStatus.agreesToPlan ||
            !enrollmentStatus.agreesToAttendance ||
            !enrollmentStatus.hasMemorizedQuran
        ) {
            setMessage({ type: 'error', text: 'يجب استيفاء جميع شروط الالتحاق (بما في ذلك حفظ القرآن)' });
            window.scrollTo(0, 0);
            return;
        }

        if (!personalInfo.fullName || !personalInfo.age || !personalInfo.residence || !personalInfo.country || !personalInfo.phone) {
            setMessage({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة' });
            window.scrollTo(0, 0);
            return;
        }

        setSaving(true);
        try {
            if (!user) return;

            const studentData = {
                ...formData,
                groupId: "applicants",
                updatedAt: serverTimestamp(),
                // enrollmentStatus fields from form + defaults
                enrollmentStatus: {
                    ...formData.enrollmentStatus,
                    isAccepted: false, // Default
                    joinedAt: serverTimestamp(), // Or keep original if exists? Firestore update merges, setDoc with merge:true does too
                }
            };

            await setDoc(doc(db, "students", "applicants", "students", user.uid), studentData, { merge: true });

            setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
            // Redirect or stay? Flutter navigates to Home.
            // router.push("/students"); 
        } catch (error) {
            console.error("Error saving profile:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ البيانات' });
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
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">الملف الشخصي للطالب</h1>
                <button
                    onClick={() => window.print()}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    title="طباعة / PDF"
                >
                    <FileText className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            {message && (
                <GlassCard className={`p-4 border-l-4 ${message.type === 'success' ? 'border-l-green-500 bg-green-500/10' : 'border-l-red-500 bg-red-500/10'}`}>
                    <p className={message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {message.text}
                    </p>
                </GlassCard>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <User className="w-6 h-6" />
                        <h2 className="text-xl font-bold">البيانات الشخصية</h2>
                    </div>

                    <GlassCard className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <InputGroup label="الاسم الرباعي" icon={User} required>
                                <input
                                    type="text"
                                    value={formData.personalInfo.fullName}
                                    onChange={(e) => handleChange('personalInfo', 'fullName', e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                                    placeholder="الاسم الكامل"
                                />
                            </InputGroup>

                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="العمر" icon={Calendar} required>
                                    <input
                                        type="number"
                                        value={formData.personalInfo.age}
                                        onChange={(e) => handleChange('personalInfo', 'age', e.target.value)}
                                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                                    />
                                </InputGroup>
                                <InputGroup label="الجنس" icon={User} required>
                                    <select
                                        value={formData.personalInfo.gender}
                                        onChange={(e) => handleChange('personalInfo', 'gender', e.target.value)}
                                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                                    >
                                        <option value="male" className="bg-background">ذكر</option>
                                        <option value="female" className="bg-background">أنثى</option>
                                    </select>
                                </InputGroup>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <InputGroup label="مكان الإقامة" icon={MapPin} required>
                                <input
                                    type="text"
                                    value={formData.personalInfo.residence}
                                    onChange={(e) => handleChange('personalInfo', 'residence', e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                                />
                            </InputGroup>
                            <InputGroup label="الدولة" icon={Globe} required>
                                <input
                                    type="text"
                                    value={formData.personalInfo.country}
                                    onChange={(e) => handleChange('personalInfo', 'country', e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                                />
                            </InputGroup>
                        </div>

                        <InputGroup label="رقم الهاتف" icon={Phone} required>
                            <input
                                type="tel"
                                value={formData.personalInfo.phone}
                                onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)}
                                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors dir-ltr text-right"
                                placeholder="+963..."
                            />
                        </InputGroup>

                        <div className="grid md:grid-cols-2 gap-4">
                            <InputGroup label="المستوى الدراسي" icon={GraduationCap}>
                                <input
                                    type="text"
                                    value={formData.personalInfo.educationLevel}
                                    onChange={(e) => handleChange('personalInfo', 'educationLevel', e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                                />
                            </InputGroup>
                            <InputGroup label="التخصص" icon={GraduationCap}>
                                <input
                                    type="text"
                                    value={formData.personalInfo.major}
                                    onChange={(e) => handleChange('personalInfo', 'major', e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                                />
                            </InputGroup>
                        </div>

                        <InputGroup label="العمل" icon={Briefcase}>
                            <input
                                type="text"
                                value={formData.personalInfo.job}
                                onChange={(e) => handleChange('personalInfo', 'job', e.target.value)}
                                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary outline-none py-2 transition-colors"
                            />
                        </InputGroup>
                    </GlassCard>
                </section>

                {/* Conditions */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <CheckCircle className="w-6 h-6" />
                        <h2 className="text-xl font-bold">شروط الالتحاق</h2>
                    </div>

                    <GlassCard className="space-y-4">
                        <CheckboxItem
                            label="توفر الإنترنت بشكل مستمر"
                            checked={formData.enrollmentStatus.internetAvailable}
                            onChange={(c) => handleChange('enrollmentStatus', 'internetAvailable', c)}
                        />
                        <CheckboxItem
                            label="القدرة على الاتصال الصوتي/الفيديو"
                            checked={formData.enrollmentStatus.canAttendOnline}
                            onChange={(c) => handleChange('enrollmentStatus', 'canAttendOnline', c)}
                        />
                        <CheckboxItem
                            label="الالتزام بالخطة (حفظ ومراجعة)"
                            checked={formData.enrollmentStatus.agreesToPlan}
                            onChange={(c) => handleChange('enrollmentStatus', 'agreesToPlan', c)}
                        />
                        <CheckboxItem
                            label="عدم التغيب والالتزام بالأوقات"
                            checked={formData.enrollmentStatus.agreesToAttendance}
                            onChange={(c) => handleChange('enrollmentStatus', 'agreesToAttendance', c)}
                        />
                        <CheckboxItem
                            label="أتممت حفظ القرآن الكريم كاملاً"
                            checked={formData.enrollmentStatus.hasMemorizedQuran}
                            onChange={(c) => handleChange('enrollmentStatus', 'hasMemorizedQuran', c)}
                        />
                    </GlassCard>
                </section>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>حفظ البيانات والتسجيل</span>
                </button>

            </form>
        </div>
    );
}

function InputGroup({ label, icon: Icon, required, children }: { label: string, icon: any, required?: boolean, children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function CheckboxItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) {
    return (
        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked
                ? 'bg-primary/10 border-primary'
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
            }`}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-primary border-primary' : 'border-gray-400'
                }`}>
                {checked && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="hidden"
            />
            <span className="font-medium text-sm">{label}</span>
        </label>
    );
}
