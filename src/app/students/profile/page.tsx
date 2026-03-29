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
    X,
    Sparkles,
    ShieldCheck,
    AlertCircle,
    AtSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { countries, Country } from "@/lib/countries";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { cn } from "@/lib/utils";

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
    
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'warning' | 'info';
        title: string;
        description: string;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        description: ''
    });

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                const studentRef = doc(db, "applicants", user.uid, "applicants", user.uid);
                const studentSnap = await getDoc(studentRef);

                if (studentSnap.exists()) {
                    const data = studentSnap.data() as any;
                    setFormData({
                        personalInfo: { ...initialData.personalInfo, ...data.personalInfo },
                        enrollmentStatus: { ...initialData.enrollmentStatus, ...data.enrollmentStatus },
                    });
                } else {
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

    const showDialog = (type: 'success' | 'danger' | 'warning' | 'info', title: string, description: string) => {
        setDialogConfig({ isOpen: true, type, title, description });
    };

    const handleChange = (section: keyof StudentData, field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));

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

        const { enrollmentStatus, personalInfo } = formData;
        
        if (!enrollmentStatus.internetAvailable || !enrollmentStatus.canAttendOnline || !enrollmentStatus.agreesToAttendance || !enrollmentStatus.hasMemorizedQuran) {
            showDialog('warning', 'شروط غير مستوفاة', 'يجب الموافقة على جميع شروط الالتزام والمتابعة للمتابعة في إرسال الطلب.');
            return;
        }

        if (!personalInfo.fullName || !personalInfo.age || !personalInfo.country || !personalInfo.phone || !personalInfo.nationality) {
            showDialog('warning', 'بيانات ناقصة', 'يرجى إكمال جميع الحقول الأساسية لضمان سلامة الطلب.');
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

            await setDoc(doc(db, "applicants", user.uid, "applicants", user.uid), studentData, { merge: true });
            
            await setDoc(doc(db, "users", user.uid), {
                displayName: personalInfo.fullName,
                phoneNumber: personalInfo.phonePrefix + personalInfo.phone,
                updatedAt: serverTimestamp()
            }, { merge: true });

            showDialog('success', 'تم الحفظ بنجاح', 'تم تحديث ملفك الشخصي وإرسال طلبك للجنة العلمية للمراجعة.');
        } catch (error) {
            console.error("Error saving profile:", error);
            showDialog('danger', 'فشل الحفظ', 'حدث خطأ أثناء محاولة حفظ البيانات، يرجى المحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto opacity-20" />
                    <p className="font-bold text-xs tracking-[0.2em] text-muted-foreground uppercase">تحميل بياناتك...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-24 px-4">
            {/* Header / Brand Nav */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-white/5 border border-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        الملف الأكاديمي الشامل
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">يرجى تحري الدقة الكاملة عند إدخال بياناتك</p>
                </div>
                
                <button
                    onClick={() => window.print()}
                    className="p-4 bg-primary/10 hover:bg-primary/20 rounded-2xl transition-all group relative z-10"
                    title="تصدير كـ PDF"
                >
                    <FileText className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </button>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* Section: Personal Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-primary/20">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">البيانات الشـخصية</h2>
                    </div>

                    <GlassCard className="p-8 md:p-12 space-y-10 border-white/5 shadow-2xl bg-white/[0.02]">
                        <div className="grid md:grid-cols-2 gap-8">
                            <EliteInput 
                                label="الاسم الرباعي الكامل (بالعربية)" 
                                icon={User}
                                placeholder="اكتب اسمك كما هو في البطاقة الوطنية..."
                                required
                                value={formData.personalInfo.fullName}
                                onChange={(val: string) => handleChange('personalInfo', 'fullName', val)}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <EliteInput 
                                    label="العمر" 
                                    icon={Calendar} 
                                    type="number"
                                    required
                                    value={formData.personalInfo.age}
                                    onChange={(val: string) => handleChange('personalInfo', 'age', val)}
                                />
                                <EliteSelect 
                                    label="الجنس" 
                                    icon={User} 
                                    options={[
                                        { label: 'ذكر', value: 'male' },
                                        { label: 'أنثى', value: 'female' }
                                    ]}
                                    value={formData.personalInfo.gender}
                                    onChange={(val: string) => handleChange('personalInfo', 'gender', val)}
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <EliteSearchSelect
                                label="الجنسية"
                                icon={Globe}
                                value={formData.personalInfo.nationality}
                                onChange={(val: string) => handleChange('personalInfo', 'nationality', val)}
                                options={countries.map(c => ({ label: `${c.flag} ${c.name}`, value: c.name }))}
                            />
                            <EliteSearchSelect
                                label="دولة الإقامة الحالية"
                                icon={MapPin}
                                value={formData.personalInfo.country}
                                onChange={(val: string) => handleChange('personalInfo', 'country', val)}
                                options={countries.map(c => ({ label: `${c.flag} ${c.name}`, value: c.name }))}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <EliteInput 
                                label="العنوان السكني المختصر" 
                                icon={MapPin} 
                                placeholder="المدينة - الحي"
                                required
                                value={formData.personalInfo.residence}
                                onChange={(val: string) => handleChange('personalInfo', 'residence', val)}
                            />

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">رقم الجوال الفعال</label>
                                <div className="flex gap-3 dir-ltr">
                                    <div className="w-24 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-black text-sm text-primary shadow-inner">
                                        {formData.personalInfo.phonePrefix}
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.personalInfo.phone}
                                        onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)}
                                        className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:opacity-20 shadow-inner"
                                        placeholder="5xxxxxxxx"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <EliteSelect 
                                label="تحصيلك العلمي" 
                                icon={GraduationCap}
                                options={[
                                    { label: 'ثانوي', value: 'ثانوي' },
                                    { label: 'جامعي', value: 'جامعي' },
                                    { label: 'دراسات عليا', value: 'دراسات عليا' },
                                    { label: 'أخرى', value: 'أخرى' }
                                ]}
                                value={formData.personalInfo.educationLevel}
                                onChange={(val: string) => handleChange('personalInfo', 'educationLevel', val)}
                            />
                            <EliteInput 
                                label="التخصص الدراسي / العلمي" 
                                icon={AtSign}
                                placeholder="مثال: علوم شرعية، طب، هندسة..."
                                value={formData.personalInfo.major}
                                onChange={(val: string) => handleChange('personalInfo', 'major', val)}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <EliteInput 
                                label="طبيعة العمل أو الوظيفة" 
                                icon={Briefcase}
                                value={formData.personalInfo.job}
                                onChange={(val: string) => handleChange('personalInfo', 'job', val)}
                            />
                            <EliteInput 
                                label="ملاحظات إضافية" 
                                icon={FileText}
                                placeholder="هل هناك ما تود إخبارنا به؟"
                                value={formData.personalInfo.otherDetails}
                                onChange={(val: string) => handleChange('personalInfo', 'otherDetails', val)}
                            />
                        </div>
                    </GlassCard>
                </div>

                {/* Section: Enrollment Conditions */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-indigo-500/20">
                            <ShieldCheck className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">شـروط الالتـزام</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <EliteCheckbox 
                            label="أؤكد توفر اتصال إنترنت ثابت يومياً"
                            checked={formData.enrollmentStatus.internetAvailable}
                            onChange={(c: boolean) => handleChange('enrollmentStatus', 'internetAvailable', c)}
                        />
                        <EliteCheckbox 
                            label="أوافق على المتابعة المرئية/الصوتية"
                            checked={formData.enrollmentStatus.canAttendOnline}
                            onChange={(c: boolean) => handleChange('enrollmentStatus', 'canAttendOnline', c)}
                        />
                        <EliteCheckbox 
                            label="ألتزم بالحضور في الموعد المحدد للحلقات"
                            checked={formData.enrollmentStatus.agreesToAttendance}
                            onChange={(c: boolean) => handleChange('enrollmentStatus', 'agreesToAttendance', c)}
                        />
                        <EliteCheckbox 
                            label="أقر بأنني أتممت حفظ القرآن الكريم"
                            checked={formData.enrollmentStatus.hasMemorizedQuran}
                            onChange={(c: boolean) => handleChange('enrollmentStatus', 'hasMemorizedQuran', c)}
                        />
                    </div>
                    
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed tracking-wider uppercase">
                            تنبيه: الموافقة على البنود أعلاه هو إقرار شرعي وقانوني بالالتزام بمنهج الروضة، وأي تخلٍ عنها قد يعرض قيدك للإلغاء.
                        </p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    className="w-full py-6 bg-gradient-to-r from-primary to-purple-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 disabled:grayscale active:scale-95"
                >
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    <span>اعتماد البيانات وإرسال الطلب</span>
                </motion.button>
            </form>

            <EliteDialog 
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({...dialogConfig, isOpen: false})}
                onConfirm={() => setDialogConfig({...dialogConfig, isOpen: false})}
                type={dialogConfig.type as any}
                title={dialogConfig.title}
                description={dialogConfig.description}
                confirmText="حسناً"
            />
        </div>
    );
}

// Internal Elite Components
function EliteInput({ label, icon: Icon, type = "text", required, value, onChange, placeholder }: any) {
    return (
        <div className="space-y-3">
            <label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1 flex items-center gap-2">
                <Icon className="w-3 h-3 text-primary/50" />
                {label} {required && <span className="text-red-500/50">*</span>}
            </label>
            <input
                type={type}
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:opacity-20 shadow-inner"
            />
        </div>
    );
}

function EliteSelect({ label, icon: Icon, options, value, onChange, required }: any) {
    return (
        <div className="space-y-3">
            <label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1 flex items-center gap-2">
                <Icon className="w-3 h-3 text-primary/50" />
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 appearance-none outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold shadow-inner"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="bg-background text-foreground">{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}

function EliteCheckbox({ label, checked, onChange }: any) {
    return (
        <label className={cn(
            "flex items-center gap-4 p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 group",
            checked 
                ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                : "bg-white/[0.02] border-white/10 hover:border-primary/30"
        )}>
            <div className={cn(
                "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all",
                checked ? "bg-primary border-primary scale-110 shadow-lg" : "border-white/20 group-hover:border-primary/50"
            )}>
                {checked && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="hidden"
            />
            <span className={cn(
                "text-sm font-black transition-colors",
                checked ? "text-primary" : "text-muted-foreground/60"
            )}>{label}</span>
        </label>
    );
}

function EliteSearchSelect({ label, icon: Icon, value, onChange, options }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((opt: any) => 
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
        <div className="space-y-3 relative" ref={containerRef}>
            <label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1 flex items-center gap-2">
                <Icon className="w-3 h-3 text-primary/50" />
                {label}
            </label>
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all shadow-inner"
            >
                <span className="font-bold">{value ? options.find((o: any) => o.value === value)?.label || value : "اختر..."}</span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen ? "rotate-180" : "")} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 w-full bg-background/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="ابدأ البحث هنا..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-10 pl-3 pr-10 bg-white/5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt: any) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearch("");
                                        }}
                                        className={cn(
                                            "p-4 rounded-2xl cursor-pointer text-sm font-bold transition-all",
                                            value === opt.value ? "bg-primary text-white" : "hover:bg-primary/10"
                                        )}
                                    >
                                        {opt.label}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-muted-foreground opacity-50">لا يوجد بيانات مطابقة</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
