"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lock, Loader2, LogOut, KeyRound, ArrowRight, Library } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AccessCodePage() {
    const { user, signOut } = useAuth();
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split("");
            setCode((prev) => {
                const newCode = [...prev];
                pastedCode.forEach((digit, i) => {
                    if (index + i < 6) newCode[index + i] = digit;
                });
                return newCode;
            });
            inputRefs.current[Math.min(index + pastedCode.length, 5)]?.focus();
        } else {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);
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

    const verifyingRef = useRef(false);

    const handleVerify = useCallback(async () => {
        const fullCode = code.join("");
        if (fullCode.length !== 6 || verifyingRef.current) return;

        verifyingRef.current = true;
        setLoading(true);
        setError("");

        try {
            const configRef = doc(db, "access_codes", "security", "access_codes", "config");
            const configSnap = await getDoc(configRef);

            if (!configSnap.exists()) {
                throw new Error("لم يتم العثور على إعدادات النظام");
            }

            const validCodes = configSnap.data();
            let matchedRole = "";

            Object.entries(validCodes).forEach(([role, validCode]) => {
                if (validCode === fullCode) matchedRole = role;
            });

            if (!matchedRole) {
                throw new Error("رمز الوصول غير صحيح. يرجى التأكد والمحاولة مرة أخرى.");
            }

            if (user?.uid) {
                const userRef = doc(db, "users", user.uid);
                const finalRole = matchedRole === "student" ? "applicant" : matchedRole;

                await updateDoc(userRef, {
                    role: finalRole,
                    accessCode: fullCode,
                    accessCodeVerifiedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                if (finalRole === "admin") window.location.href = "/admin";
                else if (finalRole === "teacher") window.location.href = "/teachers";
                else if (finalRole === "committee") window.location.href = "/admin";
                else if (finalRole === "applicant") window.location.href = "/students/profile";
                else window.location.href = "/";
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
            setError(msg);
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            verifyingRef.current = false;
            setLoading(false);
        }
    }, [code, user?.uid]);

    const codeFilled = useMemo(() => code.every((c) => c !== ""), [code]);

    useEffect(() => {
        if (codeFilled) void handleVerify();
    }, [codeFilled, handleVerify]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="flex min-h-screen flex-col lg:flex-row">
                <aside className="relative hidden w-full flex-col justify-between border-border bg-muted/40 p-10 lg:flex lg:w-[38%] lg:border-e">
                    <Link
                        href="/"
                        className="relative z-10 flex items-center gap-3 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-border">
                            <Library className="h-6 w-6 text-primary" aria-hidden />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-lg font-semibold leading-tight">روضة الحافظين</span>
                            <span className="text-xs text-muted-foreground">برنامج تحفيظ السنة</span>
                        </div>
                    </Link>

                    <div className="relative z-10 space-y-6 py-12">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                            <Lock className="h-6 w-6 text-primary" aria-hidden />
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            <h2 className="text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
                                خطوة نحو <span className="text-primary">تفعيل حسابك</span>
                            </h2>
                            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                                الرمز يحمي مسيرتك العلمية ويضمن أن الوصول لمن يملك الصلاحية فقط.
                            </p>
                        </motion.div>
                    </div>

                    <p className="relative z-10 text-xs text-muted-foreground">© 2026 روضة الحافظين</p>
                </aside>

                <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="relative z-10 mx-auto w-full max-w-md space-y-8"
                    >
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                            <div className="space-y-2 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                                    <KeyRound className="h-7 w-7 text-primary" aria-hidden />
                                </div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">رمز الوصول</h1>
                                <p className="text-sm text-muted-foreground">
                                    أدخل الرمز المكوّن من ستة أرقام الممنوح لك من الإدارة.
                                </p>
                            </div>

                            <div className="mt-8 space-y-6">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
                                            role="alert"
                                        >
                                            <Lock className="h-4 w-4 shrink-0" aria-hidden />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex justify-center gap-2 sm:gap-2.5" dir="ltr">
                                    {code.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => {
                                                inputRefs.current[idx] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete={idx === 0 ? "one-time-code" : "off"}
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            disabled={loading}
                                            aria-label={`رقم ${idx + 1}`}
                                            className={cn(
                                                "h-12 w-9 rounded-lg border bg-background text-center text-lg font-semibold tabular-nums outline-none transition-shadow sm:h-12 sm:w-10",
                                                "border-input focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                                                digit && "border-primary/60",
                                                loading && "cursor-not-allowed opacity-50"
                                            )}
                                        />
                                    ))}
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center gap-3 pt-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                                        <p className="text-sm text-muted-foreground">جاري التحقق…</p>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => signOut()}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                    >
                                        <LogOut className="h-4 w-4" aria-hidden />
                                        إلغاء وتسجيل الخروج
                                    </button>
                                )}
                            </div>
                        </div>

                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowRight className="h-4 w-4" aria-hidden />
                            العودة للرئيسية
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
