"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Users,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  LogIn,
  Sparkles,
  Calendar,
  Activity,
  Star,
  CheckCircle2,
  Trophy,
  Target
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

interface Testimonial {
    id: string;
    studentName: string;
    content: string;
    studentPhoto?: string;
}

const stats = [
  {
    title: "إجمالي الطلاب",
    value: "+1,200",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "عدد الحلقات",
    value: "+40",
    icon: BookOpen,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "المعلمون المجازون",
    value: "+30",
    icon: GraduationCap,
    color: "from-amber-500 to-orange-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <GuestView />;
  }

  return <UserDashboard userData={userData} />;
}

function GuestView() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const q = query(collection(db, "testimonials"), where("isVisible", "==", true), limit(6));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
                setTestimonials(data);
            } catch (e) {
                console.error("Failed to fetch testimonials", e);
            }
        };
        fetchTestimonials();
    }, []);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-24 pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="relative text-center pt-20 pb-16 md:pt-32 md:pb-24">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-full max-w-4xl mx-auto -z-10 rounded-full bg-primary/5 blur-3xl opacity-50" />
                
                <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-8 border border-primary/20">
                    <Sparkles className="w-4 h-4" />
                    <span>التسجيل متاح الآن للفصل الدراسي الجديد</span>
                </motion.div>

                <motion.h1 variants={item} className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-6 leading-normal py-2">
                    منصة <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">روضة الحافظين</span><br />
                    لتحفيظ السنة النبوية
                </motion.h1>

                <motion.p variants={item} className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                    هو برنامج علمي متكامل يُعنى بحفظ أحاديث السنة النبوية بجمع فضيلة الشيخ يحيى بن عبد العزيز اليحيى، وفق منهجٍ متدرّج يهدف لربط الحافظ بكلام النبي ﷺ.
                </motion.p>

                <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-lg">
                        <LogIn className="w-5 h-5" />
                        <span>ابدأ رحلتك الآن</span>
                    </Link>
                    <Link href="/about" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-white/5 text-foreground font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-lg flex justify-center items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span>التعريف بالبرنامج</span>
                    </Link>
                </motion.div>
            </section>

            {/* Stats Grid */}
            <section className="max-w-5xl mx-auto relative z-10 -mt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                    <GlassCard key={index} className="relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <stat.icon className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between p-2">
                        <div>
                            <p className="text-muted-foreground font-bold mb-1 text-lg">{stat.title}</p>
                            <h3 className="text-4xl font-extrabold">{stat.value}</h3>
                        </div>
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                            <stat.icon className="w-8 h-8" />
                        </div>
                        </div>
                    </GlassCard>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold">لماذا <span className="text-primary">روضة الحافظين؟</span></h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">نقدم منهجاً علمياً متميزاً وتحت إشراف مباشر لضمان جودة الحفظ والإتقان.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={Target} 
                        title="متابعة دقيقة" 
                        desc="نظام متكامل لتسجيل الحضور والانصراف، ومتابعة الحفظ والمراجعة اليومية بشكل دقيق."
                        color="text-blue-500"
                        bg="bg-blue-500/10"
                    />
                    <FeatureCard 
                        icon={Trophy} 
                        title="تحفيز مستمر" 
                        desc="نظام نقاط ومكافآت، وشهادات تقديرية يتم إصدارها تلقائياً عند إتمام الأجزاء أو المستويات."
                        color="text-amber-500"
                        bg="bg-amber-500/10"
                    />
                    <FeatureCard 
                        icon={Users} 
                        title="تواصل فعّال" 
                        desc="ربط سلس بين الطالب والمعلم، وإشعارات مستمرة بمستجدات الحلقة والدورات التدريبية."
                        color="text-purple-500"
                        bg="bg-purple-500/10"
                    />
                </div>
            </section>

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="space-y-12 pt-10">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent py-2">قالوا عن روضتنا</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">مشاعر وانطباعات طلابنا الأعزاء حول تجربتهم في الحلقات.</p>
                    </div>

                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {testimonials.map((t) => (
                            <GlassCard key={t.id} className="p-6 break-inside-avoid shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors" />
                                <div className="flex gap-1 text-amber-400 mb-4">
                                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-lg leading-relaxed mb-6 font-medium">"{t.content}"</p>
                                <div className="flex items-center gap-3 border-t border-gray-100 dark:border-white/5 pt-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-background overflow-hidden relative">
                                            {t.studentPhoto ? (
                                                <img src={t.studentPhoto} alt={t.studentName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary font-bold">{t.studentName[0]}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{t.studentName}</p>
                                        <p className="text-xs text-muted-foreground">طالب في الحلقات</p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer CTA */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-purple-600 text-white p-12 text-center shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-extrabold leading-tight">جاهز للبدء في رحلة الحفظ؟</h2>
                    <p className="text-xl text-white/90">انضم إلى مئات الطلاب الذين أتموا حفظ سنة رسول الله ﷺ معنا.</p>
                    <div className="pt-4">
                        <Link href="/register" className="inline-block px-10 py-4 rounded-xl bg-white text-primary font-bold text-lg hover:shadow-xl hover:scale-105 transition-all">
                            سجل الآن وابدأ
                        </Link>
                    </div>
                </div>
            </section>
        </motion.div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color, bg }: any) {
    return (
        <GlassCard className="p-8 hover:-translate-y-2 transition-transform text-center flex flex-col items-center gap-4">
            <div className={`p-4 rounded-2xl ${bg} ${color}`}>
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{desc}</p>
        </GlassCard>
    );
}

function UserDashboard({ userData }: { userData: any }) {
    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <section className="py-8 border-b border-gray-100 dark:border-white/5 pb-10">
                <motion.h1 variants={item} className="text-3xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent py-2">
                مرحباً بك، {userData?.displayName || 'يا هلا!'}
                </motion.h1>
                <motion.p variants={item} className="text-xl text-muted-foreground mt-2 font-medium">
                {userData?.role === 'admin' && "لوحة التحكم بانتظارك لإدارة تفاصيل النظام."}
                {userData?.role === 'teacher' && "جزاك الله خيراً على جهودك المبذولة في الحلقات."}
                {userData?.role === 'student' && "نرجو لك التوفيق في حفظ ومراجعة كتاب الله المكنون."}
                {userData?.role === 'pending' && "فضلاً أدخل رمز الوصول لتفعيل حسابك وفتح الصلاحيات."}
                {userData?.role === 'committee' && "لجنة الإدارة والاختبارات ترحب بك."}
                </motion.p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(userData?.role === 'admin' || userData?.role === 'committee') && (
                <DashboardCard title="لوحة الإدارة" desc="إدارة المستخدمين والحلقات والصلاحيات" icon={ShieldCheck} href="/admin" color="from-red-500 to-orange-500" />
                )}
                {userData?.role === 'teacher' && (
                <DashboardCard title="لوحة المعلم" desc="متابعة الحلقات وتقييم الطلاب" icon={GraduationCap} href="/teachers" color="from-blue-500 to-cyan-500" />
                )}
                {(userData?.role === 'student' || userData?.role === 'admin') && (
                <DashboardCard title="بوابة الطالب" desc="متابعة الحفظ وسجلات الدورة" icon={BookOpen} href="/students" color="from-green-500 to-emerald-500" />
                )}
                <DashboardCard title="الملف الشخصي" desc="تعديل بياناتك والصورة الشخصية" icon={Users} href="/profile" color="from-purple-500 to-pink-500" />
                {userData?.role === 'pending' && (
                <DashboardCard title="تفعيل الحساب" desc="إدخال رمز للوصول للواجهات" icon={Sparkles} href="/access-code" color="from-amber-500 to-yellow-500" />
                )}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                <span>إشراقة يومية</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex flex-col items-center justify-center text-center space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-transparent">
                    <Calendar className="w-10 h-10 text-primary mb-2" />
                    <h3 className="font-bold text-lg">التاريخ الهجري</h3>
                    <p className="text-2xl font-mono text-muted-foreground font-bold">1447/06/15</p>
                </GlassCard>
                <GlassCard className="p-6 md:col-span-2 flex items-center justify-center bg-primary/5 border-primary/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-full bg-primary/10 -skew-x-12 translate-x-10 group-hover:translate-x-0 transition-transform duration-500" />
                    <p className="text-2xl font-extrabold text-center leading-loose text-primary/80 z-10 selection:bg-primary/20">
                    "نَضَّرَ اللَّهُ امْرَأً سَمِعَ مَقَالَتِي فَوَعَاهَا فَأَدَّاهَا كَمَا سَمِعَهَا"
                    </p>
                </GlassCard>
                </div>
            </div>
        </motion.div>
    );
}

function DashboardCard({ title, desc, icon: Icon, href, color }: any) {
  return (
    <Link href={href}>
      <GlassCard className="group h-full hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color}`} />
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{desc}</p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} opacity-80 text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
