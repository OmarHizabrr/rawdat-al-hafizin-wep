"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    User,
    MapPin,
    Phone as PhoneIcon,
    Briefcase,
    GraduationCap,
    Globe,
    Calendar,
    CheckCircle,
    Save,
    Loader2,
    FileText,
    Search,
    ChevronDown,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { countries, Country } from "@/lib/countries";

interface StudentData {
    personalInfo: {
        fullName: string;
        age: string;
        gender: 'male' | 'female';
        nationality: string;
        residence: string;
        country: string;
        phonePrefix: string;
        phone: string;
        educationLevel: string;
        major: string;
        job: string;
        otherDetails?: string;
    };
    enrollmentStatus: {
        internetAvailable: boolean;
        canAttendOnline: boolean;
        agreesToAttendance: boolean;
        hasMemorizedQuran: boolean;
        isAccepted?: boolean;
        joinedAt?: any;
    };
}

const initialData: StudentData = {
    personalInfo: {
        fullName: "",
        age: "",
        gender: "male",
        nationality: "السعودية",
        residence: "",
        country: "السعودية",
        phonePrefix: "+966",
        phone: "",
        educationLevel: "",
        major: "",
        job: "",
        otherDetails: "",
    },
    enrollmentStatus: {
        internetAvailable: false,
        canAttendOnline: false,
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
                // Load specific student profile
                const studentRef = doc(db, "students", "applicants", "students", user.uid);
                const studentSnap = await getDoc(studentRef);

                if (studentSnap.exists()) {
                    const data = studentSnap.data() as any;
                    setFormData({
                        personalInfo: { ...initialData.personalInfo, ...data.personalInfo },
                        enrollmentStatus: { ...initialData.enrollmentStatus, ...data.enrollmentStatus },
                    });
                } else {
                    // Pre-fill from Auth User / UserData if new
                    setFormData((prev) => ({
                        ...prev,
                        personalInfo: {
                            ...prev.personalInfo,
                            fullName: user.displayName || userData?.displayName || "",
                            phone: user.phoneNumber || userData?.phoneNumber || "",
                        },
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

        // Auto-update phone prefix if country changes
        if (section === 'personalInfo' && field === 'country') {
            const country = countries.find(c => c.name === value);
            if (country) {
                setFormData(prev => ({
                    ...prev,
                    personalInfo: {
                        ...prev.personalInfo,
                        phonePrefix: country.dialCode
                    }
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const { enrollmentStatus, personalInfo } = formData;
        
        // Validation for conditions
        if (
            !enrollmentStatus.internetAvailable ||
            !enrollmentStatus.canAttendOnline ||
            !enrollmentStatus.agreesToAttendance ||
            !enrollmentStatus.hasMemorizedQuran
        ) {
            setMessage({ type: 'error', text: 'يجب الموافقة على جميع شروط الالتحاق للمتابعة' });
            window.scrollTo(0, 0);
            return;
        }

        if (!personalInfo.fullName || !personalInfo.age || !personalInfo.country || !personalInfo.phone || !personalInfo.nationality) {
            setMessage({ type: 'error', text: 'يرجى ملء جميع الحقول الأساسية المطلوبة' });
            window.scrollTo(0, 0);
            return;
        }

        setSaving(true);
        try {
            if (!user) return;

            const studentData = {
                ...formData,
                updatedAt: serverTimestamp(),
                enrollmentStatus: {
                    ...formData.enrollmentStatus,
                    isAccepted: formData.enrollmentStatus.isAccepted ?? false,
                    joinedAt: formData.enrollmentStatus.joinedAt ?? serverTimestamp(),
                }
            };

            await setDoc(doc(db, "students", "applicants", "students", user.uid), studentData, { merge: true });
            
            // Also update core user document
            await setDoc(doc(db, "users", user.uid), {
                displayName: personalInfo.fullName,
                phoneNumber: personalInfo.phonePrefix + personalInfo.phone,
                updatedAt: serverTimestamp()
            }, { merge: true });

            setMessage({ type: 'success', text: 'تم حفظ بياناتك بنجاح' });
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
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">إكمال بيانات الطالب</h1>
                    <p className="text-sm text-muted-foreground">الرجاء إدخال بياناتك بدقة لضمان قبولك في الحلقات</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="p-3 bg-primary/10 hover:bg-primary/20 rounded-2xl transition-all group"
                    title="طباعة / PDF"
                >
                    <FileText className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <GlassCard className={`p-4 border-r-4 ${message.type === 'success' ? 'border-r-green-500 bg-green-500/10' : 'border-r-red-500 bg-red-500/10'}`}>
                        <div className="flex items-center gap-3">
                            {message.type === 'success' ? <CheckCircle className="text-green-500 w-5 h-5" /> : <X className="text-red-500 w-5 h-5" />}
                            <p className={`font-bold ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {message.text}
                            </p>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-primary p-2">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <User className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">البيانات الشخصية</h2>
                    </div>

                    <GlassCard className="p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <InputGroup label="الاسم الرباعي" icon={User} required>
                                <input
                                    type="text"
                                    required
                                    value={formData.personalInfo.fullName}
                                    onChange={(e) => handleChange('personalInfo', 'fullName', e.target.value)}
                                    className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                    placeholder="اكتب اسمك الرباعي هنا..."
                                />
                            </InputGroup>

                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="العمر" icon={Calendar} required>
                                    <input
                                        type="number"
                                        required
                                        value={formData.personalInfo.age}
                                        onChange={(e) => handleChange('personalInfo', 'age', e.target.value)}
                                        className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                    />
                                </InputGroup>
                                <InputGroup label="الجنس" icon={User} required>
                                    <select
                                        value={formData.personalInfo.gender}
                                        onChange={(e) => handleChange('personalInfo', 'gender', e.target.value)}
                                        className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                    >
                                        <option value="male">ذكر</option>
                                        <option value="female">أنثى</option>
                                    </select>
                                </InputGroup>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <SearchableSelect
                                label="الجنسية"
                                icon={Globe}
                                value={formData.personalInfo.nationality}
                                onChange={(val) => handleChange('personalInfo', 'nationality', val)}
                                options={countries.map(c => ({ label: `${c.flag} ${c.name}`, value: c.name }))}
                                required
                            />
                            <SearchableSelect
                                label="دولة الإقامة"
                                icon={MapPin}
                                value={formData.personalInfo.country}
                                onChange={(val) => handleChange('personalInfo', 'country', val)}
                                options={countries.map(c => ({ label: `${c.flag} ${c.name}`, value: c.name }))}
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <InputGroup label="مكان الإقامة (المدينة/الحي)" icon={MapPin} required>
                                <input
                                    type="text"
                                    required
                                    value={formData.personalInfo.residence}
                                    onChange={(e) => handleChange('personalInfo', 'residence', e.target.value)}
                                    className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                    placeholder="مثال: الرياض - حي النرجس"
                                />
                            </InputGroup>

                            <InputGroup label="رقم الهاتف" icon={PhoneIcon} required>
                                <div className="flex gap-2 dir-ltr">
                                    <div className="w-24 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center font-bold text-sm border-b-2 border-gray-200 dark:border-gray-800">
                                        {formData.personalInfo.phonePrefix}
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.personalInfo.phone}
                                        onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)}
                                        className="flex-1 bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-4"
                                        placeholder="5xxxxxxxx"
                                    />
                                </div>
                            </InputGroup>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <InputGroup label="المستوى الدراسي" icon={GraduationCap}>
                                <select
                                    value={formData.personalInfo.educationLevel}
                                    onChange={(e) => handleChange('personalInfo', 'educationLevel', e.target.value)}
                                    className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                >
                                    <option value="">اختر المستوى...</option>
                                    <option value="ثانوي">ثانوي</option>
                                    <option value="جامعي">جامعي</option>
                                    <option value="دراسات عليا">دراسات عليا</option>
                                    <option value="أخرى">أخرى</option>
                                </select>
                            </InputGroup>
                            <InputGroup label="التخصص" icon={GraduationCap}>
                                <input
                                    type="text"
                                    value={formData.personalInfo.major}
                                    onChange={(e) => handleChange('personalInfo', 'major', e.target.value)}
                                    className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                    placeholder="مثال: هندسة، طب، شريعة..."
                                />
                            </InputGroup>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <InputGroup label="العمل / الوظيفة" icon={Briefcase}>
                                <input
                                    type="text"
                                    value={formData.personalInfo.job}
                                    onChange={(e) => handleChange('personalInfo', 'job', e.target.value)}
                                    className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                />
                            </InputGroup>
                            <InputGroup label="تفاصيل أخرى (اختياري)" icon={FileText}>
                                <input
                                    type="text"
                                    value={formData.personalInfo.otherDetails}
                                    onChange={(e) => handleChange('personalInfo', 'otherDetails', e.target.value)}
                                    className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 focus:border-primary outline-none py-3 transition-all rounded-t-lg px-2"
                                    placeholder="وسيلة تواصل بديلة، كيف عرفت عنا..."
                                />
                            </InputGroup>
                        </div>
                    </GlassCard>
                </section>

                {/* Conditions */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-primary p-2">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">شروط الالتحاق والالتزام</h2>
                    </div>

                    <GlassCard className="p-8 grid md:grid-cols-2 gap-4">
                        <CheckboxItem
                            label="توفر الإنترنت بشكل مستمر للمتابعة"
                            checked={formData.enrollmentStatus.internetAvailable}
                            onChange={(c) => handleChange('enrollmentStatus', 'internetAvailable', c)}
                        />
                        <CheckboxItem
                            label="القدرة على الاتصال الصوتي / فيديو عند الحاجة"
                            checked={formData.enrollmentStatus.canAttendOnline}
                            onChange={(c) => handleChange('enrollmentStatus', 'canAttendOnline', c)}
                        />
                        <CheckboxItem
                            label="الالتزام التام بالأوقات وعدم التغيب"
                            checked={formData.enrollmentStatus.agreesToAttendance}
                            onChange={(c) => handleChange('enrollmentStatus', 'agreesToAttendance', c)}
                        />
                        <CheckboxItem
                            label="أتممت حفظ القرآن الكريم كاملاً"
                            checked={formData.enrollmentStatus.hasMemorizedQuran}
                            onChange={(c) => handleChange('enrollmentStatus', 'hasMemorizedQuran', c)}
                        />
                    </GlassCard>
                    <p className="text-xs text-center text-muted-foreground px-4">
                        * يرجى العلم أن الموافقة على الشروط أعلاه أساسية للنظر في طلب التحاقك.
                    </p>
                </section>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    className="w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    <span>حفظ البيانات وإرسال الطلب</span>
                </motion.button>

            </form>
        </div>
    );
}

// Components
function InputGroup({ label, icon: Icon, required, children }: { label: string, icon: any, required?: boolean, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 flex items-center gap-2 px-1">
                <Icon className="w-4 h-4 text-primary" />
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function CheckboxItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) {
    return (
        <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${checked
                ? 'bg-primary/10 border-primary ring-4 ring-primary/5'
                : 'border-gray-100 dark:border-white/5 hover:border-primary/30 bg-white/5'
            }`}>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-primary border-primary scale-110 shadow-lg' : 'border-gray-300 dark:border-gray-600'
                }`}>
                {checked && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="hidden"
            />
            <span className={`text-sm font-bold transition-colors ${checked ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
        </label>
    );
}

function SearchableSelect({ label, icon: Icon, value, onChange, options, required }: { 
    label: string, 
    icon: any, 
    value: string, 
    onChange: (val: string) => void, 
    options: { label: string, value: string }[],
    required?: boolean 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase()) || 
        opt.value.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <label className="text-sm font-bold text-foreground/80 flex items-center gap-2 px-1">
                <Icon className="w-4 h-4 text-primary" />
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-background/50 border-b-2 border-gray-200 dark:border-gray-800 py-3 px-3 cursor-pointer flex items-center justify-between rounded-t-lg hover:bg-white/5 transition-colors"
            >
                <span className="font-medium">{value ? options.find(o => o.value === value)?.label || value : "اختر..."}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-background border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                    >
                        <div className="p-3 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="بحث..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-3 pr-10 py-2 bg-white/5 rounded-xl border-none outline-none focus:ring-1 focus:ring-primary text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearch("");
                                        }}
                                        className={`p-3 rounded-xl cursor-pointer text-sm font-medium transition-colors ${
                                            value === opt.value ? 'bg-primary text-white' : 'hover:bg-primary/10'
                                        }`}
                                    >
                                        {opt.label}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-xs text-muted-foreground">لا توجد نتائج</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
