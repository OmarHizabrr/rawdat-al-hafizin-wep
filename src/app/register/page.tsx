"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User, 
    Phone, 
    Mail, 
    Lock, 
    Loader2, 
    ArrowRight, 
    Eye, 
    EyeOff, 
    UserPlus,
    CheckCircle2,
    Quote,
    Library,
    ShieldCheck,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const router = useRouter();
    const { registerWithEmail, user, userData, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.displayName || !formData.email || !formData.phoneNumber || !formData.password) {
            setError("يرجى ملء كافة الحقول الأساسية للمتابعة");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("كلمات المرور غير متطابقة، يرجى إعادة التأكد");
            return;
        }

        try {
            setIsLoading(true);
            await registerWithEmail(formData.email, formData.password, formData.displayName, formData.phoneNumber);
            router.push("/access-code");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً");
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (user) {
        const getDashboardUrl = () => {
            if (!userData) return "/";
            const role = userData.role;
            if (role === 'admin' || role === 'committee') return "/admin";
            if (role === 'teacher') return "/teachers";
            if (role === 'student' || role === 'applicant') return "/students";
            return "/";
        };

        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full relative z-10 text-center space-y-8">
                    <GlassCard className="p-10 border-primary/20 bg-primary/5">
                        <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
                        <h2 className="text-3xl font-black mb-4">أنت مسجل بالفعل!</h2>
                        <p className="text-muted-foreground font-medium leading-relaxed mb-8">
                            مرحباً بك مجدداً {userData?.displayName}. لا حاجة لإنشاء حساب جديد، يمكنك البدء مباشرة من لوحة التحكم الخاصة بك.
                        </p>
                        <Link href={getDashboardUrl()} className="block w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                            انتقل للوحة التحكم
                        </Link>
                    </GlassCard>
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                        <ArrowRight className="w-4 h-4" /> العودة للرئيسية
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#020617] text-white relative overflow-hidden">
            {/* Left Side: Branding & Inspiration */}
            <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden flex-col justify-between p-12 bg-primary/5 border-l border-white/5">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-purple-500/5 blur-[120px] rounded-full delay-1000 animate-pulse" />
                </div>

                <Link href="/" className="relative z-10 flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform">
                        <Library className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">ROUDAT <span className="text-primary truncate">ELITE</span></span>
                </Link>

                <div className="relative z-10 space-y-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                    >
                        <Quote className="w-12 h-12 text-primary/20 -scale-x-100" />
                        <h2 className="text-5xl font-black leading-[1.1] tracking-tight">ابنِ مستقبلك <br /><span className="text-primary">بأنوار السنة</span> النبوية الشريفة.</h2>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-6">
                        <FeatureMini icon={ShieldCheck} title="بيئة آمنة" desc="تحت إشراف مباشر" />
                        <FeatureMini icon={Sparkles} title="تحفيز ذكي" desc="نظام نقاط وأوسمة" />
                    </div>
                </div>

                <div className="relative z-10 text-xs font-black opacity-30 uppercase tracking-[0.3em]">
                    &copy; 2026 ROUDAT AL-HAFIZIN • ELITE SYSTEM
                </div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-y-auto">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xl relative z-10 space-y-10"
                >
                    <div className="text-center lg:text-right space-y-3">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter">إنشاء حساب جديد</h1>
                        <p className="text-muted-foreground font-medium">ابدأ رحلتك العلمية الآن من خلال تعبئة البيانات التالية.</p>
                    </div>

                    <GlassCard className="p-8 md:p-10 border-white/5 shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid md:grid-cols-2 gap-6">
                                <EliteInput 
                                    label="الاسم الكامل"
                                    name="displayName"
                                    icon={User}
                                    placeholder="الاسم كما في الهوية"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                />
                                <EliteInput 
                                    label="رقم الجوال"
                                    name="phoneNumber"
                                    icon={Phone}
                                    placeholder="05xxxxxxxx"
                                    dir="ltr"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <EliteInput 
                                label="البريد الإلكتروني"
                                name="email"
                                type="email"
                                icon={Mail}
                                placeholder="example@domain.com"
                                dir="ltr"
                                value={formData.email}
                                onChange={handleChange}
                            />

                            <div className="grid md:grid-cols-2 gap-6">
                                <EliteInput 
                                    label="كلمة المرور"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    icon={Lock}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    rightElement={
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-primary" />}
                                        </button>
                                    }
                                />
                                <EliteInput 
                                    label="تأكيد كلمة المرور"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    icon={Lock}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="pt-6 flex flex-col gap-6">
                                <button
                                    disabled={isLoading}
                                    type="submit"
                                    className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><UserPlus className="w-5 h-5" /> إنشاء الحساب والبدء</>}
                                </button>
                                
                                <p className="text-center text-muted-foreground font-medium">
                                    لديك حساب بالفعل؟{" "}
                                    <Link href="/login" className="text-primary font-black hover:underline underline-offset-4">تفضل بالدخول</Link>
                                </p>
                            </div>
                        </form>
                    </GlassCard>

                    <div className="flex justify-center">
                        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors group">
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            <span>العودة للرئيسية</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function FeatureMini({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="font-black text-sm">{title}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{desc}</p>
            </div>
        </div>
    );
}

function EliteInput({ label, name, icon: Icon, type = "text", placeholder, value, onChange, dir, rightElement }: any) {
    return (
        <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2">
                <Icon className="w-3 h-3 opacity-50" />
                {label}
            </label>
            <div className="relative group">
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    dir={dir}
                    className={cn(
                        "w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:opacity-20 shadow-inner",
                        rightElement ? "pr-14" : ""
                    )}
                />
                {rightElement && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
}
