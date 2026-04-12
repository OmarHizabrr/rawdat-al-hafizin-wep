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
  Target,
  User as UserIcon,
  Layout, Quote, HelpCircle, Mail, Globe, Search,
  Lock as LockIcon, Hash, TrendingUp,
  ArrowUpRight, Clock3, ArrowRight, Settings
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface Testimonial {
    id: string;
    studentName: string;
    content: string;
    studentPhoto?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const getLevelInfo = (points: number) => {
    if (points >= 1500) return { label: 'صاحب إتقان', color: 'text-amber-500', bg: 'bg-amber-500/10', rank: 4 };
    if (points >= 500) return { label: 'همّة علية', color: 'text-purple-500', bg: 'bg-purple-500/10', rank: 3 };
    if (points >= 100) return { label: 'طالب بصيرة', color: 'text-blue-500', bg: 'bg-blue-500/10', rank: 2 };
    return { label: 'بداية النور', color: 'text-emerald-500', bg: 'bg-emerald-500/10', rank: 1 };
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
    const [liveStats, setLiveStats] = useState({ students: "+1,200", groups: "+40", teachers: "+30" });

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                const testimonialsQ = query(
                    collection(db, "testimonials"),
                    where("isVisible", "==", true),
                    limit(6)
                );
                const [testimonialSnap, usersSnap, groupsSnap, teachersSnap] = await Promise.all([
                    getDocs(testimonialsQ),
                    getDocs(query(collection(db, "users"), where("role", "==", "student"))),
                    getDocs(collection(db, "groups")),
                    getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
                ]);
                if (cancelled) return;
                setTestimonials(
                    testimonialSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Testimonial)
                );
                setLiveStats({
                    students: `+${usersSnap.size.toLocaleString()}`,
                    groups: `+${groupsSnap.size.toLocaleString()}`,
                    teachers: `+${teachersSnap.size.toLocaleString()}`,
                });
            } catch (e) {
                console.error("Failed to fetch landing data", e);
            }
        };
        void fetchData();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-20 pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="relative text-center pt-20 pb-16 md:pt-28 md:pb-20">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-full max-w-4xl mx-auto -z-10 rounded-full bg-primary/5 blur-3xl opacity-50" />
                
                <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs mb-8 border border-primary/20">
                    <Sparkles className="w-4 h-4" />
                    <span>التسجيل متاح الآن للفصل الدراسي الجديد</span>
                </motion.div>

                <motion.h1 variants={item} className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-6 leading-tight py-2">
                    منصة <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">روضة الحافظين</span><br />
                    لتحفيظ السنة النبوية
                </motion.h1>

                <motion.p variants={item} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
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
            <section className="max-w-5xl mx-auto relative z-10 -mt-10 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="إجمالي الطلاب" value={liveStats.students} icon={Users} color="from-blue-500 to-cyan-500" />
                    <StatCard title="عدد الحلقات" value={liveStats.groups} icon={BookOpen} color="from-purple-500 to-pink-500" />
                    <StatCard title="المعلمون المجازون" value={liveStats.teachers} icon={GraduationCap} color="from-amber-500 to-orange-500" />
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
                            <GlassCard key={t.id} className="p-6 break-inside-avoid shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group rounded-2xl">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors" />
                                <div className="flex gap-1 text-amber-400 mb-4">
                                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-base leading-relaxed mb-6 font-medium">"{t.content}"</p>
                                <div className="flex items-center gap-3 border-t border-gray-100 dark:border-white/5 pt-4">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 p-[1px]">
                                        <div className="w-full h-full rounded-lg bg-background overflow-hidden relative">
                                            {t.studentPhoto ? (
                                                <img src={t.studentPhoto} alt={t.studentName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">{t.studentName[0]}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{t.studentName}</p>
                                        <p className="text-[10px] text-muted-foreground opacity-60">طالب في الحلقات</p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer CTA */}
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary via-primary/90 to-purple-600 text-white p-10 md:p-16 text-center shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">جاهز للبدء في رحلة الحفظ؟</h2>
                    <p className="text-lg md:text-xl text-white/90">انضم إلى مئات الطلاب الذين أتموا حفظ سنة رسول الله ﷺ معنا.</p>
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
        <GlassCard className="p-6 md:p-8 hover:-translate-y-1.5 transition-transform text-center flex flex-col items-center gap-4 rounded-3xl">
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${bg} ${color}`}>
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{desc}</p>
        </GlassCard>
    );
}

function UserDashboard({ userData }: { userData: any }) {
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "صباح الخير والبركة";
        if (hour < 18) return "مساء النور والسرور";
        return "طبت وطاب مساؤك";
    };

    const isAdmin = userData?.role === 'admin' || userData?.role === 'committee';

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
            {/* Command Center Header */}
            <section className="relative overflow-hidden rounded-[2rem] p-6 md:p-10 bg-gradient-to-br from-primary via-primary/90 to-purple-700 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="relative group shrink-0">
                        <div className="w-20 h-20 md:w-26 md:h-26 rounded-[1.8rem] bg-white/20 p-1 backdrop-blur-md shadow-2xl transition-transform group-hover:scale-105">
                            <div className="w-full h-full rounded-[1.7rem] bg-background flex items-center justify-center overflow-hidden border-2 md:border-4 border-white/20">
                                {userData?.photoURL ? (
                                    <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 md:w-12 md:h-12 text-primary opacity-40" />
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-lg border-2 border-primary flex items-center gap-1.5 animate-bounce">
                            <Trophy className="w-3 h-3" /> {userData?.totalPoints || 0} XP
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-right space-y-2 md:space-y-3">
                        <div className="space-y-1">
                            <p className="text-white/70 font-bold text-base md:text-lg">{greeting()}،</p>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                                {userData?.displayName || 'يا طالب العلم!'}
                            </h1>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
                            <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                {userData?.role === 'admin' ? "مدير النظام" : userData?.role === 'teacher' ? "معلم معتمد" : "طالب علم"}
                            </div>
                            {userData?.role === 'student' && (
                                <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                    مستوى: {getLevelInfo(userData?.totalPoints || 0).label}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="shrink-0 flex gap-3">
                         <Link href="/profile" className="p-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-xl">
                            <Settings className="w-5 h-5 md:w-6 md:h-6" />
                         </Link>
                    </div>
                </div>
            </section>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {isAdmin && (
                    <DashboardCard 
                        title="لوحة الإدارة الشاملة" 
                        desc="تحكم كامل في المستخدمين، الحلقات، والمنظومة التعليمية" 
                        icon={ShieldCheck} 
                        href="/admin" 
                        color="from-rose-500 to-red-600" 
                    />
                )}
                {userData?.role === 'teacher' && (
                    <DashboardCard 
                        title="لوحة إشراف المعلم" 
                        desc="إدارة حلقاتك، تقييم الطلاب، ورصد الحضور اليومي" 
                        icon={GraduationCap} 
                        href="/teachers" 
                        color="from-blue-600 to-indigo-700" 
                    />
                )}
                {(userData?.role === 'student' || isAdmin) && (
                    <DashboardCard 
                        title="بوابتي العلمية" 
                        desc="تابع حفظك، جدولك الدراسي، وإنجازاتك الشخصية" 
                        icon={BookOpen} 
                        href="/students" 
                        color="from-emerald-500 to-teal-600" 
                    />
                )}
                <DashboardCard 
                    title="سجل الإنجازات" 
                    desc="الأوسمة المحققة، الشهادات الصادرة، وتاريخ النشاط" 
                    icon={Trophy} 
                    href="/records" 
                    color="from-amber-500 to-orange-600" 
                />
                <DashboardCard 
                    title="الملف الأكاديمي" 
                    desc="تعديل البيانات الشخصية، الخبرات، وصورة البروفايل" 
                    icon={UserIcon} 
                    href="/profile" 
                    color="from-purple-500 to-pink-600" 
                />
                {userData?.role === 'pending' && (
                    <DashboardCard 
                        title="تفعيل العضوية" 
                        desc="أدخل رمز الوصول لفتح كامل صلاحيات المنصة" 
                        icon={Sparkles} 
                        href="/access-code" 
                        color="from-cyan-500 to-blue-600" 
                    />
                )}
            </div>

            {/* Daily Inspiration Section */}
            <section className="relative group p-2">
                <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary animate-pulse" /> إشراقة يومية
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent mx-4 md:mx-6" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    <div className="lg:col-span-4">
                        <GlassCard className="p-6 md:p-8 bg-gradient-to-br from-white/5 to-transparent border-white/5 h-full flex flex-col items-center justify-center text-center space-y-4 rounded-2xl">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <Calendar className="w-7 h-7 md:w-8 md:h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">التاريخ اليوم</p>
                                <p className="text-2xl md:text-3xl font-black font-mono">1447/06/15</p>
                                <p className="text-[10px] font-bold text-primary">الموافق 2026/01/04 م</p>
                            </div>
                        </GlassCard>
                    </div>

                    <div className="lg:col-span-8">
                        <GlassCard className="p-6 md:p-8 relative overflow-hidden h-full flex items-center justify-center bg-primary/5 border-primary/20 text-center rounded-2xl">
                            <Quote className="absolute top-4 right-4 md:top-5 md:right-5 w-6 h-6 md:w-8 md:h-8 text-primary/10 -scale-x-100" />
                            <div className="relative z-10 space-y-4">
                                <p className="text-xl md:text-3xl font-black leading-snug !bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic selection:bg-primary/30 px-4 md:px-8">
                                    "نَضَّرَ اللَّهُ امْرَأً سَمِعَ مَقَالَتِي فَوَعَاهَا فَأَدَّاهَا كَمَا سَمِعَهَا"
                                </p>
                                <div className="flex items-center justify-center gap-3 md:gap-4">
                                    <div className="h-px w-6 md:w-8 bg-primary/30" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">حديث نبوي شريف</p>
                                    <div className="h-px w-6 md:w-8 bg-primary/30" />
                                </div>
                            </div>
                            <Quote className="absolute bottom-4 left-4 md:bottom-5 md:left-5 w-6 h-6 md:w-8 md:h-8 text-primary/10" />
                        </GlassCard>
                    </div>
                </div>
            </section>
        </motion.div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <GlassCard className="relative overflow-hidden group hover:border-primary/50 transition-colors rounded-[1.5rem]">
            <div className="absolute -top-4 -right-4 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex items-center justify-between p-1">
                <div>
                    <p className="text-muted-foreground font-bold mb-0.5 text-xs truncate max-w-[120px]">{title}</p>
                    <h3 className="text-2xl font-black">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </GlassCard>
    );
}

function DashboardCard({ title, desc, icon: Icon, href, color }: any) {
  return (
    <Link href={href}>
      <GlassCard className="group h-full hover:border-primary/50 transition-all hover:shadow-2xl hover:-translate-y-1.5 relative overflow-hidden bg-white/[0.02] rounded-[1.5rem]">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color} transition-transform origin-right group-hover:scale-x-110`} />
        
        <div className="p-6 md:p-8 flex flex-col h-full space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${color} opacity-90 text-white shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </div>
            </div>
            
            <div className="space-y-1.5 md:space-y-2 flex-1">
                <h3 className="text-xl md:text-2xl font-black group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium text-xs md:text-sm">{desc}</p>
            </div>
            
            <div className="pt-3 md:pt-4 border-t border-white/5 flex items-center justify-end">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">دخول</span>
            </div>
        </div>
      </GlassCard>
    </Link>
  );
}
