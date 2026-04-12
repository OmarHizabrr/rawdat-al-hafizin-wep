"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
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
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AuthFormField } from "@/components/auth/AuthFormField";

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
        confirmPassword: "",
    });

    const setField = (name: keyof typeof formData) => (value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            await registerWithEmail(
                formData.email,
                formData.password,
                formData.displayName,
                formData.phoneNumber
            );
            router.push("/access-code");
        } catch (err: unknown) {
            console.error(err);
            const msg =
                err instanceof Error
                    ? err.message
                    : "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40">
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
            <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md"
                >
                    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                        <CheckCircle2 className="mx-auto mb-6 h-14 w-14 text-primary" aria-hidden />
                        <h2 className="text-center text-xl font-semibold tracking-tight text-card-foreground">
                            أنت مسجل بالفعل
                        </h2>
                        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                            مرحباً بك مجدداً {userData?.displayName}. لا حاجة لإنشاء حساب جديد، يمكنك البدء مباشرة من
                            لوحة التحكم.
                        </p>
                        <Link
                            href={getDashboardUrl()}
                            className="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            انتقل للوحة التحكم
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

                    <div className="relative z-10 space-y-8 py-12">
                        <Quote className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                        <h2 className="text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
                            ابنِ مستقبلك بأنوار <span className="text-primary">السنة النبوية</span>
                        </h2>
                        <div className="grid max-w-sm grid-cols-1 gap-4 sm:grid-cols-2">
                            <FeatureMini
                                icon={ShieldCheck}
                                title="بيئة آمنة"
                                description="تحت إشراف مباشر"
                            />
                            <FeatureMini
                                icon={Sparkles}
                                title="تحفيز ذكي"
                                description="نقاط وأوسمة"
                            />
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-muted-foreground">© 2026 روضة الحافظين</p>
                </aside>

                <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mx-auto w-full max-w-xl space-y-8"
                    >
                        <div className="space-y-2 text-center lg:text-start">
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">إنشاء حساب</h1>
                            <p className="text-sm text-muted-foreground">ابدأ رحلتك العلمية بتعبئة البيانات التالية.</p>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
                                            role="alert"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <AuthFormField
                                        label="الاسم الكامل"
                                        name="displayName"
                                        icon={User}
                                        placeholder="الاسم كما في الهوية"
                                        value={formData.displayName}
                                        onChange={setField("displayName")}
                                        autoComplete="name"
                                    />
                                    <AuthFormField
                                        label="رقم الجوال"
                                        name="phoneNumber"
                                        icon={Phone}
                                        placeholder="05xxxxxxxx"
                                        dir="ltr"
                                        value={formData.phoneNumber}
                                        onChange={setField("phoneNumber")}
                                        autoComplete="tel"
                                    />
                                </div>

                                <AuthFormField
                                    label="البريد الإلكتروني"
                                    name="email"
                                    icon={Mail}
                                    type="email"
                                    placeholder="example@domain.com"
                                    dir="ltr"
                                    value={formData.email}
                                    onChange={setField("email")}
                                    autoComplete="email"
                                />

                                <div className="grid gap-5 md:grid-cols-2">
                                    <AuthFormField
                                        label="كلمة المرور"
                                        name="password"
                                        icon={Lock}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="أدخل كلمة المرور"
                                        value={formData.password}
                                        onChange={setField("password")}
                                        autoComplete="new-password"
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
                                    <AuthFormField
                                        label="تأكيد كلمة المرور"
                                        name="confirmPassword"
                                        icon={Lock}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="أعد إدخال كلمة المرور"
                                        value={formData.confirmPassword}
                                        onChange={setField("confirmPassword")}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                    ) : (
                                        <UserPlus className="h-5 w-5" aria-hidden />
                                    )}
                                    إنشاء الحساب والمتابعة
                                </button>

                                <p className="text-center text-sm text-muted-foreground">
                                    لديك حساب بالفعل؟{" "}
                                    <Link
                                        href="/login"
                                        className="font-medium text-primary hover:underline underline-offset-4"
                                    >
                                        تسجيل الدخول
                                    </Link>
                                </p>
                            </form>
                        </div>

                        <div className="flex justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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

function FeatureMini({
    icon: Icon,
    title,
    description,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card/80 p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
