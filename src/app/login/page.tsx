"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
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
} from "lucide-react";
import Link from "next/link";
import { AuthFormField } from "@/components/auth/AuthFormField";

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, signInWithPhonePassword, signInWithEmail, user, userData, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [method, setMethod] = useState<"options" | "phone" | "email">("options");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError("");
            await signInWithGoogle();
            router.push("/");
        } catch (err: unknown) {
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
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : "فشل تسجيل الدخول، يرجى التأكد من البيانات";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                <span className="sr-only">جاري التحميل</span>
            </div>
        );
    }

    if (user) {
        const getDashboardUrl = () => {
            if (!userData) return "/";
            const role = userData.role;
            if (role === "admin" || role === "committee") return "/admin";
            if (role === "teacher") return "/teachers";
            if (role === "student" || role === "applicant") return "/students";
            return "/";
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md"
                >
                    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />
                        </div>
                        <h2 className="text-center text-xl font-semibold tracking-tight text-card-foreground">
                            أهلاً بك مجدداً
                        </h2>
                        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                            أنت مسجل الدخول بالفعل يا {userData?.displayName || "طالب العلم"}. يمكنك الانتقال مباشرة
                            لمتابعة محفوظاتك.
                        </p>
                        <Link
                            href={getDashboardUrl()}
                            className="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            دخول للوحة التحكم
                        </Link>
                    </div>
                    <Link
                        href="/"
                        className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowRight className="h-4 w-4" aria-hidden />
                        العودة للرئيسية
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="flex min-h-screen flex-col lg:flex-row">
                {/* Branding — desktop */}
                <aside className="relative hidden w-full flex-col justify-between border-border bg-muted/40 p-10 lg:flex lg:w-[38%] lg:border-e">
                    <Link href="/" className="relative z-10 flex items-center gap-3 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-border">
                            <Library className="h-6 w-6 text-primary" aria-hidden />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-lg font-semibold leading-tight">روضة الحافظين</span>
                            <span className="text-xs text-muted-foreground">برنامج تحفيظ السنة</span>
                        </div>
                    </Link>

                    <div className="relative z-10 space-y-5 py-12">
                        <Quote className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                        <h2 className="text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
                            عُد إلى مأرز{" "}
                            <span className="text-primary">الإيمان</span> واليقين
                        </h2>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                            الاستمرارية هي سر الإتقان. سجّل دخولك وواصل رحلتك في حفظ وضبط الحديث الشريف.
                        </p>
                    </div>

                    <p className="relative z-10 text-xs text-muted-foreground">© 2026 روضة الحافظين</p>
                </aside>

                {/* Form */}
                <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mx-auto w-full max-w-[420px] space-y-8"
                    >
                        <div className="space-y-2 text-center lg:text-start">
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">تسجيل الدخول</h1>
                            <p className="text-sm text-muted-foreground">أدخل بياناتك لمتابعة وردك اليومي وإنجازاتك.</p>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-6 overflow-hidden rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
                                        role="alert"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {method === "options" ? (
                                <div className="space-y-5">
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                        ) : (
                                            <Chrome className="h-5 w-5 text-[#4285F4]" aria-hidden />
                                        )}
                                        <span>المتابعة بحساب Google</span>
                                    </button>

                                    <div className="relative flex items-center gap-3 py-1">
                                        <div className="h-px flex-1 bg-border" />
                                        <span className="shrink-0 text-xs font-medium text-muted-foreground">أو</span>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setMethod("email")}
                                            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-4 text-center transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                        >
                                            <Mail className="h-5 w-5 text-primary" aria-hidden />
                                            <span className="text-xs font-medium leading-tight">البريد الإلكتروني</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMethod("phone")}
                                            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-4 text-center transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                        >
                                            <Phone className="h-5 w-5 text-primary" aria-hidden />
                                            <span className="text-xs font-medium leading-tight">رقم الجوال</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleAuth} className="space-y-5">
                                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                {method === "email" ? (
                                                    <Mail className="h-4 w-4 text-primary" aria-hidden />
                                                ) : (
                                                    <Phone className="h-4 w-4 text-primary" aria-hidden />
                                                )}
                                            </div>
                                            <span className="truncate text-sm font-medium">
                                                {method === "email" ? "البريد الإلكتروني" : "رقم الجوال"}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMethod("options");
                                                setError("");
                                            }}
                                            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
                                        >
                                            <span>رجوع</span>
                                            <ChevronLeft className="h-4 w-4" aria-hidden />
                                        </button>
                                    </div>

                                    {method === "email" ? (
                                        <AuthFormField
                                            label="البريد الإلكتروني"
                                            name="email"
                                            icon={Mail}
                                            type="email"
                                            placeholder="example@domain.com"
                                            value={email}
                                            dir="ltr"
                                            onChange={setEmail}
                                            autoComplete="email"
                                        />
                                    ) : (
                                        <AuthFormField
                                            label="رقم الجوال"
                                            name="phone"
                                            icon={Phone}
                                            type="tel"
                                            placeholder="05xxxxxxxx"
                                            value={phone}
                                            dir="ltr"
                                            onChange={setPhone}
                                            autoComplete="tel"
                                        />
                                    )}

                                    <AuthFormField
                                        label="كلمة المرور"
                                        name="password"
                                        icon={Lock}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="أدخل كلمة المرور"
                                        value={password}
                                        onChange={setPassword}
                                        autoComplete="current-password"
                                        trailing={
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" aria-hidden />
                                                ) : (
                                                    <Eye className="h-4 w-4" aria-hidden />
                                                )}
                                            </button>
                                        }
                                    />

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                        ) : (
                                            <LogIn className="h-5 w-5" aria-hidden />
                                        )}
                                        دخول
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="space-y-4 text-center text-sm">
                            <p>
                                <span className="text-muted-foreground">ليس لديك حساب؟ </span>
                                <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
                                    إنشاء حساب
                                </Link>
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowRight className="h-4 w-4" aria-hidden />
                                العودة للرئيسية
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

