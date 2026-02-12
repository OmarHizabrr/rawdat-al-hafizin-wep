"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Phone, Lock, Chrome, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, signInWithPhonePassword, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [method, setMethod] = useState<"options" | "phone">("options");

    // Phone Login State
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError("");
            await signInWithGoogle();
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("فشل تسجيل الدخول عبر جوجل");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || !password) {
            setError("يرجى ملء جميع الحقول");
            return;
        }

        try {
            setIsLoading(true);
            setError("");
            await signInWithPhonePassword(phone, password);
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "فشل تسجيل الدخول");
        } finally {
            setIsLoading(false);
        }
    };

    if (user) {
        router.push("/");
        return null;
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
                        <svg
                            className="h-10 w-10 text-white"
                            fill="none"
                            height="24"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold">بوابتك لتعليم وتحفيظ القرآن والسنة</h1>
                    <p className="mt-2 text-muted-foreground">بوابتك لتعلم وحفظ القرآن الكريم</p>
                </div>

                <GlassCard className="p-8">
                    {method === "options" ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white p-4 font-medium text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Chrome className="h-5 w-5 text-blue-500" />
                                )}
                                تسجيل الدخول عبر جوجل
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/20"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-muted-foreground bg-background/50 backdrop-blur-sm">
                                        أو
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setMethod("phone")}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 p-4 font-medium text-white transition-colors hover:bg-white/10 active:bg-white/5"
                            >
                                <Phone className="h-5 w-5" />
                                الدخول برقم الهاتف
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePhoneLogin} className="space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <button
                                    type="button"
                                    onClick={() => { setMethod("options"); setError(""); }}
                                    className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h2 className="text-xl font-bold">تسجيل الدخول</h2>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pr-10 text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="05xxxxxxxx"
                                        dir="ltr"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">كلمة المرور</label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-black/20 p-3 pr-10 text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 p-4 font-bold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                ) : (
                                    "تسجيل الدخول"
                                )}
                            </button>
                        </form>
                    )}
                </GlassCard>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    ليس لديك حساب؟{" "}
                    <Link href="/register" className="font-medium text-primary hover:underline">
                        إنشاء حساب جديد
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
