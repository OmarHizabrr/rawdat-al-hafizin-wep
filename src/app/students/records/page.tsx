"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    User,
    CheckCircle,
    Clock,
    XCircle,
    Award,
    Download,
    FileCheck,
    Activity,
    Printer,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";

interface StudentData {
    personalInfo: {
        name?: string; // Flutter uses 'name', profile uses 'fullName'. Need to check data consistency. 
        // Profile page saves 'fullName'. 'student_file_page.dart' reads 'name'. 
        // I'll check both or prioritize 'fullName'.
        fullName?: string;
    };
    enrollmentStatus: {
        currentLevelId?: string;
        joinedAt?: any;
    };
    groupId?: string;
}

export default function StudentRecords() {
    const { user } = useAuth();
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                // Load from 'applicants' group for now as per Flutter file default
                // In real app, groupId might be dynamic.
                // Flutter: FirestoreApi.Api.getStudentData(uid) -> searches groups?
                // Let's assume 'applicants' for now or 'students' collection if flattened.
                // Given Profile page saved to `students/applicants/students/{uid}`, we read from there.

                const docRef = doc(db, "students", "applicants", "students", user.uid);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    setStudentData(snap.data() as StudentData);
                }
            } catch (error) {
                console.error("Error loading student records:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="p-8 text-center">
                <GlassCard>
                    <p className="text-muted-foreground">لا توجد بيانات طالب. يرجى إكمال الملف الشخصي أولاً.</p>
                </GlassCard>
            </div>
        );
    }

    // Mock Data matching Flutter
    const pieData = [
        { value: 15, color: "#22c55e", label: "15%" }, // success - green-500
        { value: 30, color: "#3b82f6", label: "30%" }, // info - blue-500
        { value: 55, color: "#e5e7eb", label: "" },     // grey-200
    ];

    // Calculate conic gradient
    let currentAngle = 0;
    const gradientParts = pieData.map(d => {
        const start = currentAngle;
        const deg = (d.value / 100) * 360;
        currentAngle += deg;
        return `${d.color} ${start}deg ${currentAngle}deg`;
    });
    const gradient = `conic-gradient(${gradientParts.join(", ")})`;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">ملفي الأكاديمي</h1>
                <button
                    onClick={() => window.print()}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    title="طباعة السجل"
                >
                    <Printer className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            {/* Profile Header */}
            <GlassCard className="flex items-center gap-6 p-6">
                <div className="p-1 rounded-full border-2 border-primary">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold">{studentData.personalInfo.fullName || studentData.personalInfo.name || "اسم الطالب"}</h2>
                    <p className="text-sm text-muted-foreground">
                        المستوى: {studentData.enrollmentStatus.currentLevelId || "غير محدد"}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                        الحلقة: {studentData.groupId || "غير مسجل"}
                    </p>
                </div>
            </GlassCard>

            {/* Academic Progress */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold">التقدم الأكاديمي</h3>
                <GlassCard className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Pie Chart */}
                        <div className="relative w-40 h-40 rounded-full" style={{ background: gradient }}>
                            <div className="absolute inset-4 bg-white dark:bg-black/80 rounded-full flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">الإجمالي</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-green-500" />
                                <span className="font-bold">حفظ القرآن</span>
                                <span className="text-sm text-muted-foreground mr-auto">15%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-blue-500" />
                                <span className="font-bold">التفسير</span>
                                <span className="text-sm text-muted-foreground mr-auto">30%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-gray-200" />
                                <span className="font-bold">المتبقي</span>
                                <span className="text-sm text-muted-foreground mr-auto">55%</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* Attendance */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold">سجل الحضور</h3>
                <GlassCard className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center divide-x divide-x-reverse divide-gray-100 dark:divide-gray-800">
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-green-500">12</p>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                حضور
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-red-500">1</p>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <XCircle className="w-4 h-4" />
                                غياب
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-orange-500">0</p>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <Clock className="w-4 h-4" />
                                تأخير
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* Certificates */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold">الشهادات</h3>
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                            <Award className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold">شهادة إتمام المستوى الأول</h4>
                            <p className="text-xs text-muted-foreground">تاريخ الإصدار: 2026/01/15</p>
                        </div>
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                            <Download className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </button>
                    </div>
                </GlassCard>
            </section>

            {/* Test Results */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold">نتائج الاختبارات</h3>
                <GlassCard className="space-y-4 p-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">اختبار سورة البقرة (الحزب 1)</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 font-bold text-sm border border-green-500/20">
                            98/100
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">اختبار التفسير (جزء عم)</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 font-bold text-sm border border-green-500/20">
                            95/100
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* Recent Activity */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold">آخر النشاطات</h3>
                <GlassCard className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                            <Activity className="w-5 h-5 text-primary mt-1" />
                            <div>
                                <p className="font-medium">إتمام حفظ سورة البقرة - الصفحة {i}</p>
                                <p className="text-xs text-muted-foreground">قبل {i} أيام</p>
                            </div>
                        </div>
                    ))}
                </GlassCard>
            </section>
        </div>
    );
}
