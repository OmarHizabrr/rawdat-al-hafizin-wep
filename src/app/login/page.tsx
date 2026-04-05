"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Phone, 
    Lock, 
    Mail, 
    Loader2, 
    ArrowRight, 
    Eye, 
    EyeOff, 
    LogIn,
    Chrome,
    ShieldCheck,
    ChevronLeft,
    Library,
    Quote,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, signInWithPhonePassword, signInWithEmail, user, userData, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [method, setMethod] = useState<"options" | "phone" | "email">("options");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form inputs
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError("");
            await signInWithGoogle();
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("عذراً، فشل تسجيل الدخول عبر جوجل");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (method === "email") {
                await signInWithEmail(email, password);
            } else {
                await signInWithPhonePassword(phone, password);
            }
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "فشل تسجيل الدخول، يرجى التأكد من البيانات");
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617]">
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
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -ml-32 -mt-32" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full relative z-10 text-center space-y-8">
                    <GlassCard className="p-10 border-primary/20 bg-primary/5">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black mb-4">أهلاً بك مجدداً!</h2>
                        <p className="text-muted-foreground font-medium leading-relaxed mb-8">
                            أنت مسجل دخولك بالفعل يا {userData?.displayName || 'طالب العلم'}. يمكنك الانتقال مباشرة لمتابعة محفوظاتك.
                        </p>
                        <Link href={getDashboardUrl()} className="block w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                            دخول للوحة التحكم
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
            {/* Left Side: Branding */}
            <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden flex-col justify-between p-12 bg-primary/5 border-l border-white/5">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
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
                        className="space-y-4"
                    >
                        <Quote className="w-12 h-12 text-primary/20 -scale-x-100" />
                        <h2 className="text-5xl font-black leading-[1.1] tracking-tight text-white">عُد إلى مَأرز <br /><span className="text-primary italic">الإيمان</span> واليقين.</h2>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-sm">
                            الاستمرارية هي سر الإتقان. سجل دخولك وواصل رحلتك في حفظ وضبط الحديث الشريف.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 text-xs font-black opacity-30 uppercase tracking-[0.3em]">
                    &copy; 2026 ROUDAT AL-HAFIZIN • ELITE SYSTEM
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xl relative z-10 space-y-10"
                >
                    <div className="text-center lg:text-right space-y-3">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">مرحباً بك مجدداً</h1>
                        <p className="text-muted-foreground font-medium">سجل دخولك لمتابعة وردك اليومي وإنجازاتك.</p>
                    </div>

                    <GlassCard className="p-8 md:p-10 border-white/5 shadow-2xl overflow-visible bg-white/[0.02]">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {method === "options" ? (
                            <div className="space-y-6">
                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading}
                                    className="w-full h-16 bg-white text-black font-black flex items-center justify-center gap-3 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-lg"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-6 h-6 text-blue-500" />}
                                    <span>الدخول بالحساب الموحد (جوجل)</span>
                                </button>

                                <div className="relative py-4 flex items-center gap-4">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">أو عبر المنصة</span>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <button
                                        onClick={() => setMethod("email")}
                                        className="h-20 bg-white/5 border border-white/10 text-foreground font-bold rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group"
                                    >
                                        <Mail className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] uppercase tracking-widest font-black">البريد الإلكتروني</span>
                                    </button>
                                    <button
                                        onClick={() => setMethod("phone")}
                                        className="h-20 bg-white/5 border border-white/10 text-foreground font-bold rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group"
                                    >
                                        <Phone className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] uppercase tracking-widest font-black">رقم الجوال</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleAuth} className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            {method === "email" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                        </div>
                                        <h3 className="font-black text-sm uppercase tracking-widest text-primary">{method === "email" ? "البريد الإلكتروني" : "رقم الجوال"}</h3>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => { setMethod("options"); setError(""); }}
                                        className="text-[10px] font-black text-muted-foreground hover:text-white transition-colors flex items-center gap-1 group"
                                    >
                                        <span>الرجوع</span>
                                        <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {method === "email" ? (
                                        <EliteInput 
                                            label="البريد الإلكتروني"
                                            name="email"
                                            icon={Mail}
                                            type="email"
                                            placeholder="example@domain.com"
                                            value={email}
                                            dir="ltr"
                                            onChange={(val: string) => setEmail(val)}
                                        />
                                    ) : (
                                        <EliteInput 
                                            label="رقم الجوال"
                                            name="phone"
                                            icon={Phone}
                                            type="tel"
                                            placeholder="05xxxxxxxx"
                                            value={phone}
                                            dir="ltr"
                                            onChange={(val: string) => setPhone(val)}
                                        />
                                    )}

                                    <EliteInput 
                                        label="كلمة المرور"
                                        name="password"
                                        icon={Lock}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(val: string) => setPassword(val)}
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
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 bg-primary text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:grayscale flex items-center justify-center gap-3 mt-4"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
                                    <span>دخول الآن</span>
                                </button>
                            </form>
                        )}
                    </GlassCard>

                    <div className="flex flex-col items-center gap-8">
                        <p className="text-center font-bold text-sm">
                            <span className="text-muted-foreground">ليس لديك حساب؟</span>{" "}
                            <Link href="/register" className="text-primary font-black hover:underline underline-offset-8 transition-all">
                                أنشئ حساباً جديداً
                            </Link>
                        </p>

                        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors group">
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            <span>العودة للرئيسية</span>
                        </Link>
                    </div>
                </motion.div>
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
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    dir={dir}
                    className={cn(
                        "w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:opacity-20 shadow-inner text-white",
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
