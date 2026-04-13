"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, collectionGroup } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    FileText,
    Calendar,
    Award,
    TrendingUp,
    Coins,
    Clock,
    Download,
    Trophy,
    BookOpen,
    Loader2,
    Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function firestoreOrFieldDateMs(createdAt: unknown, fallback: unknown): number {
    if (
        createdAt &&
        typeof createdAt === "object" &&
        createdAt !== null &&
        "toDate" in createdAt &&
        typeof (createdAt as { toDate?: () => Date }).toDate === "function"
    ) {
        return (createdAt as { toDate: () => Date }).toDate().getTime();
    }
    if (typeof fallback === "number" && !Number.isNaN(fallback)) {
        return fallback < 1e12 ? fallback * 1000 : fallback;
    }
    if (typeof fallback === "string") {
        const p = Date.parse(fallback);
        return Number.isNaN(p) ? 0 : p;
    }
    return 0;
}

/** السجل الأكاديمي الشامل — نفس منطق الجلب لجميع المسارات (بوابة الطالب أو /records للأدوار الأخرى). */
export function FullAcademicRecords() {
    const { user, userData } = useAuth();
    const [activeTab, setActiveTab] = useState<"attendance" | "points" | "badges">("attendance");
    const [loading, setLoading] = useState(true);

    const [evaluations, setEvaluations] = useState<Record<string, unknown>[]>([]);
    const [pointsLogs, setPointsLogs] = useState<Record<string, unknown>[]>([]);
    const [badges, setBadges] = useState<Record<string, unknown>[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchFullHistory = async () => {
            setLoading(true);
            try {
                const evalQuery = query(
                    collectionGroup(db, "evaluations"),
                    where("studentId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const evalSnap = await getDocs(evalQuery);
                setEvaluations(evalSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

                const pointsQuery = query(
                    collection(db, "points_logs", user.uid, "points_logs"),
                    orderBy("timestamp", "desc")
                );
                const pointsSnap = await getDocs(pointsQuery);
                setPointsLogs(pointsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

                const badgesRef = collection(db, "badges", user.uid, "badges");
                const badgesSnap = await getDocs(badgesRef);
                setBadges(badgesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (error) {
                console.error("Error fetching student records:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchFullHistory();
    }, [user]);

    if (loading)
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 opacity-20">
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <p className="text-lg font-black">جاري استرجاع السجل الأكاديمي...</p>
                </div>
            </div>
        );

    return (
        <div className="mx-auto max-w-6xl space-y-12 pb-32">
            <div className="flex flex-col items-center justify-between gap-6 px-2 pt-4 md:flex-row">
                <div className="space-y-1 text-center md:text-right">
                    <h1 className="flex flex-col items-center gap-3 text-2xl font-black tracking-tight md:flex-row md:text-3xl">
                        السجل الأكاديمي الشامل
                        <div className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[9px] font-black text-primary">
                            ELITE ARCHIVE
                        </div>
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground opacity-60 md:text-sm">
                        توثيق كامل لمسيرتك العلمية وتفاعلك مع المنصة.
                    </p>
                </div>

                <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 md:rounded-2xl">
                    {(
                        [
                            { id: "attendance" as const, label: "التقييمات", icon: Calendar },
                            { id: "points" as const, label: "النقاط", icon: Coins },
                            { id: "badges" as const, label: "أوسمتي", icon: Trophy },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-black transition-all md:rounded-xl md:px-6 md:text-xs",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 px-2 lg:grid-cols-4">
                <SummaryCard
                    label="إجمالي النقاط"
                    value={userData?.totalPoints || 0}
                    icon={Coins}
                    color="bg-amber-500"
                />
                <SummaryCard label="الأوسمة" value={badges.length} icon={Trophy} color="bg-primary" />
                <SummaryCard
                    label="التقييمات"
                    value={evaluations.length}
                    icon={FileText}
                    color="bg-blue-500"
                />
                <SummaryCard label="المعدل" value="ممتاز" icon={TrendingUp} color="bg-emerald-500" />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                >
                    {activeTab === "attendance" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="flex items-center gap-2 text-lg font-black md:text-xl">
                                    <Clock className="h-5 w-5 text-blue-500" /> أرشيف السجلات
                                </h3>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 text-[10px] font-black opacity-30 transition-opacity hover:opacity-100"
                                >
                                    <Download className="h-3.5 w-3.5" /> تصدير PDF
                                </button>
                            </div>
                            <TableLayout
                                headers={["الجلسة", "النوع", "الدرجة", "الملاحظات", "التاريخ"]}
                            >
                                {evaluations.map((evalItem) => (
                                    <tr
                                        key={String(evalItem.id)}
                                        className="group transition-colors hover:bg-white/[0.02]"
                                    >
                                        <td className="p-3 md:p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-black text-primary">
                                                    <BookOpen className="h-4 w-4" />
                                                </div>
                                                <div className="text-[13px] font-black">
                                                    {String(evalItem.groupName || evalItem.courseTitle || "")}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 md:p-4">
                                            <span
                                                className={cn(
                                                    "rounded-md border px-3 py-1 text-[9px] font-black",
                                                    evalItem.type === "attendance"
                                                        ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                                                        : evalItem.type === "test"
                                                          ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                                          : "border-green-500/20 bg-green-500/10 text-green-500"
                                                )}
                                            >
                                                {evalItem.type === "attendance"
                                                    ? "حضور"
                                                    : evalItem.type === "test"
                                                      ? "اختبار"
                                                      : "تسميع"}
                                            </span>
                                        </td>
                                        <td className="p-3 md:p-4">
                                            <div className="w-14 rounded-lg border border-white/5 bg-white/5 py-1 text-center text-xs font-black">
                                                {String(evalItem.mark ?? "")}
                                            </div>
                                        </td>
                                        <td className="max-w-[200px] truncate p-3 text-[11px] font-medium italic text-muted-foreground md:p-4">
                                            {String(evalItem.notes || "-- لا توجد ملاحظات --")}
                                        </td>
                                        <td className="p-3 text-[10px] font-black opacity-20 md:p-4">
                                            {new Date(
                                                firestoreOrFieldDateMs(
                                                    evalItem.createdAt,
                                                    evalItem.date
                                                )
                                            ).toLocaleDateString("ar-EG")}
                                        </td>
                                    </tr>
                                ))}
                            </TableLayout>
                        </div>
                    )}

                    {activeTab === "points" && (
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 px-2 text-lg font-black md:text-xl">
                                <Coins className="h-5 w-5 text-amber-500" /> كشف النقاط
                            </h3>
                            <TableLayout
                                headers={["المعالجة", "السبب", "المستوى", "النوع", "التاريخ"]}
                            >
                                {pointsLogs.map((log) => (
                                    <tr key={String(log.id)} className="transition-colors hover:bg-white/[0.02]">
                                        <td className="p-3 md:p-4">
                                            <div
                                                className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black",
                                                    Number(log.amount) > 0
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-rose-500/10 text-rose-500"
                                                )}
                                            >
                                                {Number(log.amount) > 0 ? `+${log.amount}` : String(log.amount)}
                                            </div>
                                        </td>
                                        <td className="p-3 text-xs font-black md:p-4">{String(log.reason || "")}</td>
                                        <td className="p-3 text-[10px] font-black uppercase tracking-tighter opacity-40 md:p-4">
                                            {String(log.source || "SYS")}
                                        </td>
                                        <td className="p-3 md:p-4">
                                            <div
                                                className={cn(
                                                    "inline-block rounded-md px-3 py-1 text-[9px] font-black",
                                                    log.type === "reward"
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-rose-500/10 text-rose-500"
                                                )}
                                            >
                                                {log.type === "reward" ? "تميز" : "خصم"}
                                            </div>
                                        </td>
                                        <td className="p-3 text-[10px] font-black opacity-20 md:p-4">
                                            {(log.timestamp as { toDate?: () => Date })?.toDate?.()?.toLocaleDateString(
                                                "ar-EG"
                                            ) || ""}
                                        </td>
                                    </tr>
                                ))}
                            </TableLayout>
                        </div>
                    )}

                    {activeTab === "badges" && (
                        <div className="space-y-8">
                            <h3 className="flex items-center gap-2 px-2 text-lg font-black md:text-xl">
                                <Trophy className="h-5 w-5 text-primary" /> خزانة الإنجازات
                            </h3>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                                {badges.map((badge) => (
                                    <GlassCard
                                        key={String(badge.id)}
                                        className="group flex flex-col items-center gap-4 rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1 md:p-8"
                                    >
                                        <div
                                            className={cn(
                                                "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-xl md:h-20 md:w-20 md:rounded-[2rem]",
                                                typeof badge.color === "string" ? badge.color : ""
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                                            <Award className="relative z-10 h-8 w-8 transition-transform group-hover:scale-110 md:h-10 md:w-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-base font-black tracking-tight md:text-lg">
                                                {String(badge.name || "")}
                                            </h4>
                                            <p className="line-clamp-2 px-2 text-[10px] font-medium leading-tight text-muted-foreground opacity-70">
                                                {String(badge.description || "وسام تقدير لتميز الطالب.")}
                                            </p>
                                        </div>
                                        <div className="flex w-full items-center justify-between border-t border-white/5 px-2 pt-4">
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-20">
                                                الاستحقاق
                                            </span>
                                            <span className="text-[10px] font-bold opacity-60">
                                                {(badge.earnedAt as { toDate?: () => Date })?.toDate?.()?.toLocaleDateString(
                                                    "ar-EG"
                                                ) || "--/--"}
                                            </span>
                                        </div>
                                    </GlassCard>
                                ))}
                                {badges.length === 0 && (
                                    <div className="col-span-full space-y-6 py-20 text-center opacity-30 grayscale">
                                        <Sparkles className="mx-auto mb-4 h-16 w-16 animate-pulse opacity-10" />
                                        <p className="text-lg font-black italic">
                                            بانتظار أن تُزيّن هذه الخزانة بأول أوسمتك...
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}) {
    return (
        <GlassCard className="group rounded-xl border-white/5 bg-white/[0.01] p-4 transition-all hover:bg-white/[0.03] md:rounded-2xl md:p-6">
            <div className="flex items-center gap-4">
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 md:h-12 md:w-12",
                        color
                    )}
                >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                    <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.1em] opacity-40">{label}</p>
                    <p className="text-xl font-black tracking-tighter md:text-2xl">{value}</p>
                </div>
            </div>
        </GlassCard>
    );
}

function TableLayout({ headers, children }: { headers: string[]; children: React.ReactNode }) {
    return (
        <GlassCard className="overflow-hidden border-white/5 bg-white/[0.01]">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.03]">
                            {headers.map((h) => (
                                <th
                                    key={h}
                                    className="p-4 text-[10px] font-black uppercase tracking-widest opacity-30"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">{children}</tbody>
                </table>
            </div>
        </GlassCard>
    );
}
