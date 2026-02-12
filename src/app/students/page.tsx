"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    onSnapshot,
    Timestamp,
    doc,
    setDoc,
    serverTimestamp,
    getDoc,
    orderBy
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    BookOpen,
    Settings,
    User as UserIcon,
    Printer,
    Download,
    Timer,
    CreditCard,
    CheckCircle,
    MessageSquarePlus,
    Quote,
    Heart,
    Mail,
    MessageCircle,
    Globe,
    Loader2,
    ChevronDown,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Types
interface Course {
    id: string;
    title: string;
    description: string;
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    registrationStart: Timestamp | null;
    registrationEnd: Timestamp | null;
    cost: string;
    mechanism: string;
    features: string[];
}

interface Testimonial {
    id: string;
    studentId: string;
    studentName: string;
    studentPhoto?: string;
    content: string;
    createdAt: Timestamp;
}

export default function StudentPortal() {
    const { user } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeftToRegister, setTimeLeftToRegister] = useState<string>("00:00:00");
    const [timeLeftToStart, setTimeLeftToStart] = useState<string>("00:00:00");
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    // Fetch Courses
    useEffect(() => {
        const q = query(collection(db, "courses"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coursesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Course[];

            // Filter and sort active courses
            const now = new Date();
            const active = coursesData
                .filter((c) => !c.endDate || c.endDate.toDate() > now)
                .sort((a, b) => {
                    const dateA = a.startDate?.toDate().getTime() ?? 0;
                    const dateB = b.startDate?.toDate().getTime() ?? 0;
                    return dateA - dateB;
                });

            setCourses(coursesData);
            setActiveCourse(active.length > 0 ? active[0] : null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Timer Logic
    useEffect(() => {
        if (!activeCourse) return;

        const interval = setInterval(() => {
            const now = new Date();

            if (activeCourse.registrationEnd) {
                const diff = activeCourse.registrationEnd.toDate().getTime() - now.getTime();
                setTimeLeftToRegister(formatDuration(Math.max(0, diff)));
            }

            if (activeCourse.startDate) {
                const diff = activeCourse.startDate.toDate().getTime() - now.getTime();
                setTimeLeftToStart(formatDuration(Math.max(0, diff)));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeCourse]);

    // Fetch Testimonials
    useEffect(() => {
        const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Testimonial[];
            setTestimonials(data);
        });
        return () => unsubscribe();
    }, []);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / 1000 / 60) % 60);
        const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
        const days = Math.floor(ms / 1000 / 60 / 60 / 24);

        return `${days}:${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
    };

    const RegistrationSection = ({ course }: { course: Course }) => {
        const [isRegistered, setIsRegistered] = useState(false);
        const [checking, setChecking] = useState(true);
        const { user } = useAuth();

        useEffect(() => {
            if (!user) return;
            const unsub = onSnapshot(
                doc(db, "courses", course.id, "enrollments", user.uid),
                (doc) => {
                    setIsRegistered(doc.exists());
                    setChecking(false);
                }
            );
            return () => unsub();
        }, [user, course.id]);

        const handleRegister = async () => {
            if (!user) return;
            try {
                await setDoc(doc(db, "courses", course.id, "enrollments", user.uid), {
                    enrolledAt: serverTimestamp(),
                    studentName: user.displayName,
                    studentEmail: user.email,
                    status: "pending",
                });
                // Could show toast here
            } catch (error) {
                console.error("Error registering", error);
            }
        };

        if (checking) return <Loader2 className="animate-spin" />;

        const now = new Date();
        const isRegOpen =
            course.registrationStart &&
            course.registrationEnd &&
            now > course.registrationStart.toDate() &&
            now < course.registrationEnd.toDate();

        if (isRegistered) {
            return (
                <div className="w-full p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex flex-col items-center gap-2">
                    <CheckCircle className="text-green-600 w-10 h-10" />
                    <span className="text-green-700 dark:text-green-400 font-bold">أنت مسجل في هذه الدورة</span>
                </div>
            );
        }

        return (
            <button
                disabled={!isRegOpen}
                onClick={handleRegister}
                className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all ${isRegOpen
                        ? "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/20"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
            >
                {isRegOpen ? "سجل الآن" : "التسجيل مغلق"}
            </button>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Actions - Mobile only mostly, or persistent */}
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    روضة الحافظين
                </h1>
                <div className="flex gap-2">
                    <Link href="/settings">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Settings className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </Link>
                    <Link href="/students/profile">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </Link>
                    {activeCourse && (
                        <>
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="طباعة">
                                <Printer className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="حفظ">
                                <Download className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
            >
                <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                        <BookOpen className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-wider mb-2 drop-shadow-lg">روضة الحافظين</h2>
                        <p className="text-white/90 text-lg font-medium">بوابتك نحو حفظ كتاب الله وسنة نبيه</p>
                    </div>
                </div>
            </motion.div>

            {/* Countdowns */}
            {activeCourse && (
                <div className="grid grid-cols-2 gap-4">
                    <GlassCard className="text-center space-y-2">
                        <p className="text-sm font-bold text-orange-500">بداية التسجيل</p>
                        <p className="text-xl font-mono font-black">{timeLeftToRegister}</p>
                    </GlassCard>
                    <GlassCard className="text-center space-y-2">
                        <p className="text-sm font-bold text-green-500">انطلاق الدورة</p>
                        <p className="text-xl font-mono font-black">{timeLeftToStart}</p>
                    </GlassCard>
                </div>
            )}

            {/* Registration Button */}
            {activeCourse && (
                <GlassCard>
                    <RegistrationSection course={activeCourse} />
                </GlassCard>
            )}

            {/* Course Info */}
            {activeCourse ? (
                <GlassCard className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{activeCourse.title}</h3>
                            <p className="text-sm text-muted-foreground">دورة مكثفة</p>
                        </div>
                    </div>

                    {/* Progress Bar if started - Mocked logic for now */}
                    {activeCourse.startDate && new Date() > activeCourse.startDate.toDate() && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>تقدم الدورة</span>
                                <span className="text-primary font-bold">45%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-[45%] bg-primary rounded-full" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Timer className="w-4 h-4" />
                                <span className="text-sm">الآلية التدريبية</span>
                            </div>
                            <span className="font-bold">{activeCourse.mechanism}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-sm">التكلفة الإجمالية</span>
                            </div>
                            <span className="font-bold text-green-600">{activeCourse.cost}</span>
                        </div>
                    </div>

                    <Link href={`/students/courses/${activeCourse.id}`} className="block">
                        <button className="w-full py-3 rounded-xl border border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors">
                            استكشاف المحتوى البرامجي
                        </button>
                    </Link>
                </GlassCard>
            ) : (
                <GlassCard className="p-8 text-center text-muted-foreground">
                    لا توجد دورات نشطة حالياً
                </GlassCard>
            )}

            {/* Features */}
            {activeCourse && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">مميزات الدورة</h3>
                    <div className="grid gap-3">
                        {activeCourse.features.map((feature, i) => (
                            <GlassCard key={i} className="flex items-center gap-3 p-4">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Testimonials */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">مشاعر الطلاب</h3>
                    <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                        <MessageSquarePlus className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                    {testimonials.map((t) => (
                        <GlassCard key={t.id} className="min-w-[280px] snap-center p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative">
                                    {t.studentPhoto ? (
                                        <Image src={t.studentPhoto} alt={t.studentName} fill className="object-cover" />
                                    ) : (
                                        <UserIcon className="w-6 h-6 m-2 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{t.studentName}</p>
                                    <p className="text-xs text-muted-foreground">طالب مثابر</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Quote className="absolute -top-2 -right-2 w-8 h-8 text-primary/10" />
                                <p className="text-sm italic text-muted-foreground line-clamp-3 relative z-10">
                                    {t.content}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-red-500/50 hover:text-red-500 cursor-pointer transition-colors">
                                <Heart className="w-4 h-4" />
                                <span className="text-xs font-bold">12</span>
                            </div>
                        </GlassCard>
                    ))}
                    {testimonials.length === 0 && (
                        <div className="w-full text-center py-8 text-muted-foreground">
                            كن أول من يشارك مشاعره!
                        </div>
                    )}
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold">أسئلة شائعة</h3>
                <div className="space-y-2">
                    <GlassCard className="p-0 overflow-hidden">
                        <details className="group">
                            <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
                                <span className="font-medium">كيف يمكنني التسجيل؟</span>
                                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-muted-foreground" />
                            </summary>
                            <div className="px-4 pb-4 pt-0 text-muted-foreground text-sm border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2">
                                يمكنك التسجيل عبر تعبئة استمارة التسجيل في صفحة "الملف الشخصي" ثم انتظار قبول الطلب.
                            </div>
                        </details>
                    </GlassCard>
                    <GlassCard className="p-0 overflow-hidden">
                        <details className="group">
                            <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
                                <span className="font-medium">هل الدورة مجانية بالكامل؟</span>
                                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-muted-foreground" />
                            </summary>
                            <div className="px-4 pb-4 pt-0 text-muted-foreground text-sm border-t border-gray-100 dark:border-gray-800">
                                نعم، الدورة مجانية بالكامل ولا توجد أي رسوم مخفية.
                            </div>
                        </details>
                    </GlassCard>
                    <GlassCard className="p-0 overflow-hidden">
                        <details className="group">
                            <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
                                <span className="font-medium">ما هو النظام الدراسي؟</span>
                                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-muted-foreground" />
                            </summary>
                            <div className="px-4 pb-4 pt-0 text-muted-foreground text-sm border-t border-gray-100 dark:border-gray-800">
                                يعتمد النظام على الحلقات الإلكترونية عبر تطبيقات الاتصال المرئي، مع التزام الطالب بخطة حفظ ومراجعة محددة.
                            </div>
                        </details>
                    </GlassCard>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-12 pb-6 text-center space-y-6">
                <h3 className="font-bold text-primary">تواصل معنا</h3>
                <div className="flex justify-center gap-6">
                    <a href="mailto:omaralhizaber@gmail.com" className="p-3 bg-primary/10 rounded-full text-primary hover:bg-primary hover:text-white transition-colors">
                        <Mail className="w-5 h-5" />
                    </a>
                    <a href="https://wa.me/963957836719" className="p-3 bg-green-500/10 rounded-full text-green-600 hover:bg-green-500 hover:text-white transition-colors">
                        <MessageCircle className="w-5 h-5" />
                    </a>
                    <a href="https://www.rawdat.com" className="p-3 bg-blue-500/10 rounded-full text-blue-600 hover:bg-blue-500 hover:text-white transition-colors">
                        <Globe className="w-5 h-5" />
                    </a>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-800" />
                <p className="text-xs text-muted-foreground">
                    جميع الحقوق محفوظة © {new Date().getFullYear()} - روضة الحافظين
                </p>
            </div>
        </div>
    );
}
