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
    ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, signInWithPhonePassword, signInWithEmail, user } = useAuth();
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

    if (user) {
        router.push("/");
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -ml-32 -mt-32" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -mr-32 -mb-32" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="text-center mb-10 space-y-3">
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20"
                    >
                        <LogIn className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        مرحباً بك مجدداً
                    </h1>
                    <p className="text-muted-foreground font-bold tracking-wide uppercase text-xs">سجل دخولك لمتابعة وردك اليومي</p>
                </div>

                <GlassCard className="p-8 md:p-12 border-white/5 shadow-2xl overflow-visible">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {method === "options" ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full h-14 bg-white text-black font-black flex items-center justify-center gap-3 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-blue-500" />}
                                <span>الدخول بالحساب الموحد (جوجل)</span>
                            </button>

                            <div className="relative py-4 flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">أو عبر المنصة</span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMethod("email")}
                                    className="h-14 bg-white/5 border border-white/10 text-foreground font-bold rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-all group"
                                >
                                    <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] uppercase tracking-widest">البريد الإلكتروني</span>
                                </button>
                                <button
                                    onClick={() => setMethod("phone")}
                                    className="h-14 bg-white/5 border border-white/10 text-foreground font-bold rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-all group"
                                >
                                    <Phone className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] uppercase tracking-widest">رقم الجوال</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAuth} className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        {method === "email" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                    </div>
                                    <h3 className="font-black text-sm uppercase tracking-widest">{method === "email" ? "البريد الإلكتروني" : "رقم الجوال"}</h3>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => { setMethod("options"); setError(""); }}
                                    className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <span>الرجوع</span>
                                    <ChevronLeft className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {method === "email" ? (
                                    <EliteInput 
                                        label="البريد الإلكتروني"
                                        type="email"
                                        placeholder="example@domain.com"
                                        value={email}
                                        dir="ltr"
                                        onChange={(val: string) => setEmail(val)}
                                    />
                                ) : (
                                    <EliteInput 
                                        label="رقم الجوال"
                                        type="tel"
                                        placeholder="05xxxxxxxx"
                                        value={phone}
                                        dir="ltr"
                                        onChange={(val: string) => setPhone(val)}
                                    />
                                )}

                                <EliteInput 
                                    label="كلمة المرور"
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
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:grayscale flex items-center justify-center gap-3"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
                                <span>دخول الآن</span>
                            </button>
                        </form>
                    )}
                </GlassCard>

                <p className="mt-10 text-center font-bold text-sm">
                    <span className="text-muted-foreground">ليس لديك حساب؟</span>{" "}
                    <Link href="/register" className="text-primary hover:underline underline-offset-8 transition-all">
                        أنشئ حساباً جديداً
                    </Link>
                </p>

                <div className="mt-12 flex justify-center">
                    <Link href="/" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors group">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span>العودة للرئيسية</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

function EliteInput({ label, type = "text", placeholder, value, onChange, dir, rightElement }: any) {
    return (
        <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">
                {label}
            </label>
            <div className="relative group">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    dir={dir}
                    className={cn(
                        "w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:opacity-20 shadow-inner",
                        rightElement ? "pl-14" : ""
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
