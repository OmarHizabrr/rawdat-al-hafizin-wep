"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
    Lock, 
    Loader2, 
    LogOut, 
    ShieldCheck, 
    Sparkles, 
    KeyRound, 
    ArrowRight,
    Library,
    Quote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AccessCodePage() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Handle code input changes
    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pastedCode = value.slice(0, 6).split("");
            setCode(prev => {
                const newCode = [...prev];
                pastedCode.forEach((digit, i) => {
                    if (index + i < 6) newCode[index + i] = digit;
                });
                return newCode;
            });
            inputRefs.current[Math.min(index + pastedCode.length, 5)]?.focus();
        } else {
            // Handle single digit
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Move to next input
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join("");
        if (fullCode.length !== 6) return;

        setLoading(true);
        setError("");

        try {
            // 1. Fetch valid codes
            const configRef = doc(db, "access_codes", "security", "access_codes", "config");
            const configSnap = await getDoc(configRef);

            if (!configSnap.exists()) {
                throw new Error("System configuration not found");
            }

            const validCodes = configSnap.data();
            let matchedRole = "";

            // 2. Check match
            Object.entries(validCodes).forEach(([role, validCode]) => {
                if (validCode === fullCode) matchedRole = role;
            });

            if (!matchedRole) {
                throw new Error("رمز الوصول غير صحيح. يرجى التأكد والمحاولة مرة أخرى.");
            }

            // 3. Update User Role
            if (user?.uid) {
                const userRef = doc(db, "users", user.uid);
                
                // If the code is for a student, give them 'applicant' role first
                const finalRole = matchedRole === 'student' ? 'applicant' : matchedRole;

                await updateDoc(userRef, {
                    role: finalRole,
                    accessCode: fullCode,
                    accessCodeVerifiedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Force reload/redirect based on role
                if (finalRole === 'admin') window.location.href = '/admin';
                else if (finalRole === 'teacher') window.location.href = '/teachers';
                else if (finalRole === 'committee') window.location.href = '/admin';
                else if (finalRole === 'applicant') window.location.href = '/students/profile';
                else window.location.href = '/';
            }

        } catch (err: any) {
            setError(err.message || "حدث خطأ غير متوقع");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Auto-verify when code is complete
    useEffect(() => {
        if (code.every(c => c !== "")) {
            handleVerify();
        }
    }, [code]);

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#020617] text-white relative overflow-hidden">
            {/* Left Side: Branding & Security Message */}
            <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden flex-col justify-between p-12 bg-primary/5 border-l border-white/5">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                </div>

                <Link href="/" className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                        <Library className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase">Roudat <span className="text-primary">Elite</span></span>
                </Link>

                <div className="relative z-10 space-y-8">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <h2 className="text-5xl font-black leading-tight tracking-tighter text-white">خطوة واحدة نحو <br /><span className="text-primary italic">عالم النبوة.</span></h2>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-sm">
                            هذا الرمز هو بوابة دخولك لروضة الحافظين، صُمم لحماية مسيرتك العلمية وضمان خصوصية بياناتك.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 text-xs font-black opacity-30 uppercase tracking-[0.5em]">
                    Elite Security • Protocol 2.0
                </div>
            </div>

            {/* Right Side: Verification Area */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl w-full relative z-10"
                >
                    <GlassCard className="p-12 md:p-16 text-center space-y-12 border-white/5 bg-white/[0.02] shadow-[0_40px_100px_rgba(0,0,0,var(--shadow-opacity,0.5))] rounded-[3.5rem]">
                        <div className="space-y-6">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                                className="mx-auto w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative group"
                            >
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <KeyRound className="w-10 h-10 text-primary relative z-10" />
                                <div className="absolute -top-2 -right-2 bg-background p-1.5 rounded-xl border border-white/10 shadow-xl">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                </div>
                            </motion.div>

                            <div className="space-y-3">
                                <h1 className="text-4xl font-black tracking-tight text-white">نظام التحقق الآمن</h1>
                                <p className="text-muted-foreground font-medium text-lg max-w-sm mx-auto leading-relaxed">
                                    أدخل رمز الصلاحية الممنوح لك من الإدارة لتفعيل حسابك.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-black flex items-center justify-center gap-3"
                                    >
                                        <Lock className="w-4 h-4" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-center gap-3 md:gap-4" dir="ltr">
                                {code.map((digit, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + idx * 0.05 }}
                                    >
                                        <input
                                            ref={(el: HTMLInputElement | null) => { inputRefs.current[idx] = el; }}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className={cn(
                                                "w-14 h-20 md:w-18 md:h-24 text-center text-3xl font-black rounded-[1.5rem] border bg-white/[0.03] outline-none transition-all duration-300",
                                                digit ? "border-primary text-primary shadow-[0_0_30px_rgba(var(--primary-rgb,59,130,246),0.2)]" : "border-white/10 text-white focus:border-white/30",
                                                loading && "opacity-50 cursor-not-allowed"
                                            )}
                                            disabled={loading}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 space-y-8">
                            {loading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary animate-pulse">جاري فحص الرمز في السجلات الرقمية...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4 px-8 opacity-10">
                                        <div className="h-px flex-1 bg-white" />
                                        <Sparkles className="w-4 h-4" />
                                        <div className="h-px flex-1 bg-white" />
                                    </div>
                                    
                                    <button
                                        onClick={() => signOut()}
                                        className="flex items-center justify-center gap-3 mx-auto px-10 py-5 rounded-2xl bg-white/5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 border border-white/5 hover:border-red-500/20 transition-all font-black text-xs group"
                                    >
                                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        <span>إلغاء العملية وتسجيل الخروج</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
