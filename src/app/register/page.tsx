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
    Sparkles,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const router = useRouter();
    const { registerWithEmail } = useAuth();
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

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -ml-64 -mb-64" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="text-center mb-10 space-y-3">
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20"
                    >
                        <UserPlus className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        انضم لروضة الحافظين
                    </h1>
                    <p className="text-muted-foreground font-bold tracking-wide uppercase text-xs">لبدء رحلتك في حفظ السنة النبوية الشريفة</p>
                </div>

                <GlassCard className="p-10 md:p-12 border-white/5 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
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
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

                        <div className="space-y-4 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:grayscale flex items-center justify-center gap-3"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                <span>إنشاء الحساب الآن</span>
                            </button>

                            <div className="flex items-center gap-2 justify-center text-[10px] font-black text-muted-foreground opacity-50 uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" />
                                <span>نظام مشفر وآمن بالكامل</span>
                            </div>
                        </div>
                    </form>
                </GlassCard>

                <p className="mt-10 text-center font-bold text-sm">
                    <span className="text-muted-foreground">لديك حساب بالفعل؟</span>{" "}
                    <Link href="/login" className="text-primary hover:underline underline-offset-8 transition-all">
                        تسجيل الدخول من هنا
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
