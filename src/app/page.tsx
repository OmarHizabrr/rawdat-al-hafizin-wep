"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, BookOpen, GraduationCap, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

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
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Hero Section */}
      <section className="text-center py-12">
        <motion.h1
          variants={item}
          className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          بوابتك لتعليم وتحفيظ القرآن والسنة
        </motion.h1>
        <motion.p variants={item} className="text-xl text-muted-foreground max-w-2xl mx-auto">
          منصة متكاملة لإدارة حلقات تحفيظ القرآن الكريم، تهدف إلى تسهيل المتابعة وتحسين الأداء.
        </motion.p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <GlassCard key={index} className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <GlassCard gradient className="group cursor-pointer">
          <Link href="/students/add" className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">تسجيل طالب جديد</h3>
                <p className="text-sm text-muted-foreground">إضافة طالب جديد إلى الحلقات</p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
          </Link>
        </GlassCard>

        <GlassCard gradient className="group cursor-pointer">
          <Link href="/records/daily" className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">تسجيل الحفظ اليومي</h3>
                <p className="text-sm text-muted-foreground">إدخال بيانات الحفظ والمراجعة</p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
          </Link>
        </GlassCard>
      </div>
    </motion.div>
  );
}
