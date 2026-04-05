"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, onSnapshot } from "firebase/firestore";
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
    Loader2,
    Calendar,
    Star,
    Layout,
    TrendingUp,
    ChevronLeft,
    ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StudentData {
    personalInfo: {
        name?: string;
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
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                // Fetch student profile info
                const docRef = doc(db, "applicants", user.uid, "applicants", user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setStudentData(snap.data() as StudentData);
                }

                // Fetch achievements/certificates
                const q = query(collection(db, "student_records", user.uid, "student_records"));
                const unsubscribe = onSnapshot(q, (snapshot: any) => {
                    const data = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setAchievements(data);
                });
                return () => unsubscribe();
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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                        <Award className="absolute inset-0 m-auto w-8 h-8 text-primary opacity-20" />
                    </div>
                    <p className="font-black text-xs tracking-[0.3em] text-muted-foreground uppercase animate-pulse">جاري استخراج السجل...</p>
                </div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center space-y-8">
                <GlassCard className="p-16 border-dashed border-2 border-white/10 bg-white/[0.02]">
                    <div className="w-24 h-24 bg-gray-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <User className="w-12 h-12 text-muted-foreground opacity-20" />
                    </div>
                    <h2 className="text-2xl font-bold">لم تكتمل ملفاتك بعد</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">يرجى الانتهاء من تعبئة ملفك الشخصي في صفحة "حسابي" لتتمكن من رؤية سجلك الأكاديمي هنا.</p>
                </GlassCard>
            </div>
        );
    }

    // Modern Progress Visuals
    const progressChart = [
        { label: "حفظ الأحاديث", value: 45, color: "from-green-500 to-emerald-700", icon: CheckCircle },
        { label: "شروح السنة", value: 30, color: "from-blue-500 to-indigo-700", icon: BookOpen },
        { label: "علوم الحديث", value: 15, color: "from-amber-500 to-orange-700", icon: Star },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-24 px-4 printable-area">
            {/* Header: Academic Certificate Style */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/10 p-10 md:p-14 text-white shadow-3xl text-center md:text-right"
            >
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl group-hover:bg-primary/40 transition-all rounded-full" />
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center relative overflow-hidden shadow-2xl">
                             <User className="w-20 h-20 text-white/40" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Printer className="w-8 h-8 cursor-pointer" onClick={() => window.print()} />
                             </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-xl">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                {studentData.personalInfo.fullName || studentData.personalInfo.name || "اسم الطالب"}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                                <Badge icon={Award} label="المستوى الحالي" value={studentData.enrollmentStatus.currentLevelId || "تأسيسي"} />
                                <Badge icon={Layout} label="الحلقة العلمية" value={studentData.groupId || "عام"} />
                                <Badge icon={Calendar} label="تاريخ الانضمام" value="٢٠٢٦/٠٣" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Performance Overview (Cards Grid) */}
            <div className="grid md:grid-cols-3 gap-6">
                {progressChart.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <GlassCard className="p-8 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 bg-white/[0.02] border-white/5">
                            <div className="relative z-10 space-y-6">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border", item.color === "from-green-500 to-emerald-700" ? "bg-green-500/10 border-green-500/20 text-green-500" : item.color === "from-blue-500 to-indigo-700" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500")}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">{item.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        <h4 className="text-3xl font-black">{item.value}%</h4>
                                        <TrendingUp className="w-4 h-4 text-green-500 opacity-50" />
                                    </div>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={cn("h-full rounded-full bg-gradient-to-r", item.color)} 
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Attendance Summary */}
                <div className="space-y-6">
                    <SectionLabel icon={Clock} label="إحصائيات الحضور والالتزام" />
                    <GlassCard className="p-10 bg-white/[0.01] border-white/5">
                        <div className="grid grid-cols-3 gap-8 text-center">
                            <StatCircle value="24" label="حـضور" color="green" icon={CheckCircle} />
                            <StatCircle value="2" label="غـياب" color="red" icon={XCircle} />
                            <StatCircle value="1" label="تـأخير" color="orange" icon={Clock} />
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between px-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">نسبة الالتزام العامة</p>
                            <span className="text-xl font-black text-primary">٩٢٪</span>
                        </div>
                    </GlassCard>
                </div>

                {/* Achievement Gallery (Certificates) */}
                <div className="space-y-6">
                    <SectionLabel icon={Award} label="الإنجازات والشهادات" />
                    <div className="space-y-4">
                        {achievements.filter(a => a.type === "certificate").map((a, i) => (
                            <AchievementCard 
                                key={a.id}
                                title={a.title} 
                                date={new Date(a.date).toLocaleDateString('ar-SA')} 
                                icon={Award} 
                                color="amber" 
                            />
                        ))}
                        {achievements.length === 0 && (
                            <div className="p-8 text-center bg-white/5 border border-dashed rounded-3xl opacity-50">
                                لا توجد إنجازات مسجلة حالياً، بانتظار تقييم الاختبار النهائي.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Results (Table Styled) */}
            <div className="space-y-6">
                <SectionLabel icon={FileCheck} label="نتائج الاختبارات التفصيلية" />
                <GlassCard className="p-0 overflow-hidden border-white/5 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">المادة / الاختبار</th>
                                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">الدرجة</th>
                                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">التقدير</th>
                                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {achievements.map((a, i) => (
                                    <TestRow 
                                        key={a.id}
                                        title={a.title} 
                                        score={a.mark} 
                                        grade={a.mark} 
                                        color={a.mark === "ممتاز" ? "green" : "blue"} 
                                    />
                                ))}
                                {achievements.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-muted-foreground opacity-40 font-bold uppercase tracking-widest italic">
                                            لم تكتمل اختبارات هذا المستوى بعد.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            {/* Footer Activity Log */}
            <div className="space-y-6">
                <SectionLabel icon={Activity} label="آخر النشاطات الأكاديمية" />
                <div className="grid gap-3">
                    <ActivityItem text="تم رفع تقييم التسميع لليوم - الجمع بين الصحيحين" time="قبل ساعتين" />
                    <ActivityItem text="تحميل ملف مرجعيات مصطلح الحديث - المستوى ٢" time="بالأمس" />
                    <ActivityItem text="الانضمام لحلقة 'الرواد' للسنة النبوية" time="قبل ٣ أيام" />
                </div>
            </div>
        </div>
    );
}

// Internal Elite UI Components
function Badge({ icon: Icon, label, value }: any) {
    return (
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-lg">
            <Icon className="w-4 h-4 text-primary" />
            <div className="text-right">
                <p className="text-[8px] font-black uppercase opacity-60 m-0 leading-none mb-1">{label}</p>
                <p className="text-xs font-bold m-0 leading-none">{value}</p>
            </div>
        </div>
    );
}

function SectionLabel({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 backdrop-blur-md">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">{label}</h3>
        </div>
    );
}

function StatCircle({ value, label, color, icon: Icon }: any) {
    const colors: any = {
        green: "text-green-500 bg-green-500/5 hover:bg-green-500/10",
        red: "text-red-500 bg-red-500/5 hover:bg-red-500/10",
        orange: "text-orange-500 bg-orange-500/5 hover:bg-orange-500/10"
    };
    return (
        <div className="space-y-4 group">
            <motion.div 
                whileHover={{ scale: 1.05 }}
                className={cn("w-20 h-20 md:w-24 md:h-24 rounded-3xl mx-auto flex items-center justify-center border border-white/5 shadow-inner transition-all", colors[color])}
            >
                <h4 className="text-3xl md:text-4xl font-black">{value}</h4>
            </motion.div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                <Icon className="w-3 h-3 opacity-30" />
                {label}
            </p>
        </div>
    );
}

function AchievementCard({ title, date, icon: Icon, color }: any) {
    const colors: any = {
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    };
    return (
        <GlassCard className={cn("p-5 flex items-center justify-between group hover:scale-[1.02] transition-all cursor-pointer border shadow-lg", colors[color])}>
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                </div>
                <div>
                    <h4 className="font-bold text-sm tracking-tight">{title}</h4>
                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">{date}</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-5 h-5" />
            </div>
        </GlassCard>
    );
}

function TestRow({ title, score, grade, color }: any) {
    const colors: any = {
        green: "text-green-500 bg-green-500/10 border-green-500/20",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    };
    return (
        <tr className="group hover:bg-white/[0.03] transition-colors">
            <td className="p-6 font-bold text-sm">{title}</td>
            <td className="p-6">
                <span className={cn("px-4 py-2 rounded-2xl font-black text-xs border shadow-inner", colors[color])}>
                    {score}
                </span>
            </td>
            <td className="p-6 text-xs font-bold text-muted-foreground">{grade}</td>
            <td className="p-6 text-center">
                <button className="p-3 bg-white/5 rounded-2xl hover:bg-primary hover:text-white transition-all hover:scale-110 active:scale-90">
                    <Download className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
}

function ActivityItem({ text, time }: { text: string, time: string }) {
    return (
        <div className="flex items-center justify-between p-5 bg-white/[0.01] border border-white/5 rounded-[2rem] hover:bg-white/[0.03] transition-all group">
            <div className="flex items-center gap-4">
                 <div className="w-2 h-2 rounded-full bg-primary opacity-30 group-hover:opacity-100 transition-opacity" />
                 <span className="text-sm font-medium">{text}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground opacity-40">
                <Clock className="w-3 h-3" />
                {time}
            </div>
        </div>
    );
}

const BookOpen = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
);

const Users = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
