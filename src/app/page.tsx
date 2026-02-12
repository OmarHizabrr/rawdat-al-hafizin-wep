"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Users,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
  LogIn,
  Sparkles,
  Calendar,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

const stats = [
  {
    title: "إجمالي الطلاب",
    value: "1,234",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "عدد الحلقات",
    value: "45",
    icon: BookOpen,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "المعلمون",
    value: "32",
    icon: GraduationCap,
    color: "from-amber-500 to-orange-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
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

  // Guest View
  if (!user) {
    return <GuestView />;
  }

  // Logged In View - Dashboard Hub
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <section className="py-8">
        <motion.h1
          variants={item}
          className="text-3xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          مرحباً بك، {userData?.displayName || 'يا هلا!'}
        </motion.h1>
        <motion.p variants={item} className="text-xl text-muted-foreground mt-2">
          {userData?.role === 'admin' && "لوحة التحكم بانتظارك"}
          {userData?.role === 'teacher' && "جزاك الله خيراً على جهودك"}
          {userData?.role === 'student' && "استمر في حفظ كتاب الله"}
          {userData?.role === 'pending' && "يرجى تفعيل حسابك"}
        </motion.p>
      </section>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Admin Quick Action */}
        {(userData?.role === 'admin' || userData?.role === 'committee') && (
          <DashboardCard
            title="لوحة الإدارة"
            desc="إدارة المستخدمين والحلقات"
            icon={ShieldCheck}
            href="/admin"
            color="from-red-500 to-orange-500"
          />
        )}

        {/* Teacher Quick Action */}
        {userData?.role === 'teacher' && (
          <DashboardCard
            title="لوحة المعلم"
            desc="متابعة الحلقات والطلاب"
            icon={GraduationCap}
            href="/teachers"
            color="from-blue-500 to-cyan-500"
          />
        )}

        {/* Student Quick Action */}
        {(userData?.role === 'student' || userData?.role === 'admin') && (
          <DashboardCard
            title="بوابة الطالب"
            desc="متابعة الحفظ والدورات"
            icon={BookOpen}
            href="/students"
            color="from-green-500 to-emerald-500"
          />
        )}

        {/* Profile Quick Action */}
        <DashboardCard
          title="الملف الشخصي"
          desc="تعديل بياناتك الشخصية"
          icon={Users}
          href="/profile"
          color="from-purple-500 to-pink-500"
        />

        {/* Pending Action */}
        {userData?.role === 'pending' && (
          <DashboardCard
            title="تفعيل الحساب"
            desc="إدخال رمز الوصول"
            icon={Sparkles}
            href="/access-code"
            color="from-amber-500 to-yellow-500"
          />
        )}

      </div>

      {/* Recent Activity / Stats (Mock for now) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span>نشاطات سريعة</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calendar Widget */}
          <GlassCard className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <Calendar className="w-10 h-10 text-primary mb-2" />
            <h3 className="font-bold text-lg">التاريخ الهجري</h3>
            <p className="text-2xl font-mono text-muted-foreground">1447/06/15</p>
          </GlassCard>
          {/* Daily Athkar or content could go here */}
          <GlassCard className="p-6 md:col-span-2 flex items-center justify-center bg-primary/5 border-primary/10">
            <p className="text-xl font-arabic text-center leading-loose">
              "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
            </p>
          </GlassCard>
        </div>
      </div>

    </motion.div>
  );
}

function GuestView() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-16"
    >
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20">
        <motion.div variants={item} className="inline-block p-4 rounded-full bg-primary/10 mb-6">
          <BookOpen className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.h1
          variants={item}
          className="text-4xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-6"
        >
          بوابتك لتعليم وتحفيظ<br />القرآن والسنة
        </motion.h1>
        <motion.p variants={item} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          منصة رقمية متكاملة تجمع بين الأصالة والتقنية الحديثة لإدارة حلقات تحفيظ القرآن الكريم وتيسير العملية التعليمية.
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            <span>تسجيل الدخول</span>
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl bg-white dark:bg-white/10 text-foreground font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
          >
            <span>إنشاء حساب جديد</span>
          </Link>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <GlassCard key={index} className="relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">{stat.title}</p>
                <h3 className="text-4xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-20 shadow-inner`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </GlassCard>
        ))}
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
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} opacity-80 text-white shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
