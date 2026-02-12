"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GlassCard } from "@/components/ui/GlassCard";
import { Lock, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

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
            const configRef = doc(db, "system_config", "access_codes");
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
                await updateDoc(userRef, {
                    role: matchedRole,
                    accessCode: fullCode,
                    accessCodeVerifiedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Force reload/redirect based on role
                window.location.href = matchedRole === 'admin' ? '/admin'
                    : matchedRole === 'teacher' ? '/teachers'
                        : matchedRole === 'student' ? '/students'
                            : '/'; // Committee/Other
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <GlassCard className="p-8 text-center space-y-8 border-primary/20">
                    <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">إدخال رمز الوصول</h1>
                        <p className="text-muted-foreground">
                            يرجى إدخال الرمز المكون من 6 أرقام لتحديد صلاحياتك في النظام
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center gap-2" dir="ltr">
                        {code.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el: HTMLInputElement | null) => { inputRefs.current[idx] = el; }}
                                type="text"
                                maxLength={6}
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-input bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                disabled={loading}
                            />
                        ))}
                    </div>

                    <div className="pt-4">
                        {loading ? (
                            <div className="flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <button
                                onClick={() => signOut()}
                                className="flex items-center justify-center gap-2 mx-auto text-sm text-muted-foreground hover:text-red-500 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>تسجيل الخروج</span>
                            </button>
                        )}
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
