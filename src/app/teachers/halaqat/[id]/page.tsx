"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, query, where, onSnapshot, doc, getDoc, addDoc, 
    serverTimestamp, orderBy, writeBatch, increment 
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users, Calendar, ArrowRight, CheckCircle2, XCircle, Search, Save, Loader2, BookOpen, Star, Radio, Video, Mic, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getTargetActiveRecitationSessions, RecitationSession } from "@/lib/recitation-service";

interface Student {
    id: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    photoURL?: string;
    totalPoints?: number;
}

interface GroupModel {
    id: string;
    name: string;
    gender: 'male' | 'female';
}

export default function TeacherHalaqaDetails() {
    const { id } = useParams() as { id: string };
    const [group, setGroup] = useState<GroupModel | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Evaluation Modal
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [evalType, setEvalType] = useState<"attendance" | "recitation" | "test">("recitation");
    const [evalMark, setEvalMark] = useState("ممتاز");
    const [evalNotes, setEvalNotes] = useState("");
    const [pointsConfig, setPointsConfig] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [recitationSessions, setRecitationSessions] = useState<RecitationSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    useEffect(() => {
        if (!id) return;

        void (async () => {
            const [groupSnap, configSnap] = await Promise.all([
                getDoc(doc(db, "groups", id)),
                getDoc(doc(db, "points_config", "global", "points_config", "settings")),
            ]);
            if (groupSnap.exists()) {
                setGroup({ id: groupSnap.id, ...groupSnap.data() } as GroupModel);
            }
            if (configSnap.exists()) setPointsConfig(configSnap.data());
        })();

        // Fetch Students belonging to this group (Nested Subcollection Pattern)
        const q = query(collection(db, "members", id, "members"), where("role", "==", "student"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Student[];
            setStudents(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const loadSessions = async () => {
            setLoadingSessions(true);
            try {
                const sessions = await getTargetActiveRecitationSessions(id, "group");
                setRecitationSessions(sessions);
            } finally {
                setLoadingSessions(false);
            }
        };
        void loadSessions();
    }, [id]);

    const filteredStudents = students.filter(s => 
        s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        setSaving(true);

        const batch = writeBatch(db);

        try {
            // 1. Calculate Points based on evaluation (Dynamic from Config)
            let pointsToGrant = 0;
            let reason = "";

            const attendancePoints = pointsConfig?.recitationAttend || 5;
            const recitationMarks: any = { 
                "ممتاز": pointsConfig?.recitationExcellent || 10, 
                "جيد جداً": pointsConfig?.recitationVeryGood || 7, 
                "جيد": pointsConfig?.recitationGood || 5, 
                "مقبول": pointsConfig?.recitationAcceptable || 3 
            };
            const testMarks: any = { 
                "ممتاز": pointsConfig?.testExcellent || 50, 
                "جيد جداً": pointsConfig?.testVeryGood || 40, 
                "جيد": pointsConfig?.testGood || 30, 
                "مقبول": pointsConfig?.testAcceptable || 20 
            };

            if (evalType === "attendance") {
                if (evalMark === "حاضر") { 
                    pointsToGrant = attendancePoints; 
                    reason = `حضور الحلقة: ${group?.name}`; 
                }
            } else if (evalType === "recitation") {
                pointsToGrant = recitationMarks[evalMark] || 0;
                reason = `تسميع في ${group?.name}: ${evalMark}`;
            } else if (evalType === "test") {
                pointsToGrant = testMarks[evalMark] || 0;
                reason = `اختبار نهائي: ${group?.name}`;
            }

            // 2. Save Evaluation (Standard)
            const evalRef = doc(collection(db, "evaluations", id, "evaluations"));
            batch.set(evalRef, {
                studentId: selectedStudent.id,
                studentName: selectedStudent.displayName,
                groupId: id,
                groupName: group?.name,
                type: evalType,
                mark: evalMark,
                status: evalType === "attendance" ? evalMark : null,
                notes: evalNotes,
                isFinalTest: evalType === "test",
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });

            // 3. Grant Points (If applicable)
            if (pointsToGrant > 0) {
                // Update User Total Points
                const userRef = doc(db, "users", selectedStudent.id);
                batch.update(userRef, {
                    totalPoints: increment(pointsToGrant)
                });

                // Add Point Log (Nested Path)
                const logRef = doc(collection(db, "points_logs", selectedStudent.id, "points_logs"));
                batch.set(logRef, {
                    amount: pointsToGrant,
                    reason: reason,
                    type: 'reward',
                    source: 'teacher_evaluation',
                    timestamp: serverTimestamp()
                });
            }

            // 4. Save to global student record if it's a test
            if (evalType === "test") {
                const recordRef = doc(collection(db, "student_records", selectedStudent.id, "student_records"));
                batch.set(recordRef, {
                    title: `اختبار نهائي: ${group?.name}`,
                    mark: evalMark,
                    date: new Date().toISOString().split('T')[0],
                    type: "certificate",
                    courseId: id,
                    createdAt: serverTimestamp()
                });
            }

            await batch.commit();
            setSelectedStudent(null);
            setEvalNotes("");
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء حفظ التقييم");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 rounded-md" />
                        <Skeleton className="h-4 w-64 rounded-md" />
                    </div>
                </div>
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
                <Link href="/teachers" className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight">{group?.name || "جاري التحميل..."}</h1>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-medium opacity-60">إدارة طلاب الحلقة وتقييمهم الدوري</p>
                </div>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-primary font-black text-xs md:text-sm px-2">
                    <Users className="w-4 h-4" />
                    <span>الطلاب ({students.length})</span>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <input
                        type="text"
                        placeholder="ابحث عن طالب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 rounded-lg border border-white/10 bg-white/5 focus:ring-2 focus:ring-primary/20 outline-none text-xs transition-all"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-black text-sm px-1">
                    <Radio className="w-4 h-4 animate-pulse" />
                    جلسات التسميع المرتبطة بالحلقة
                </div>
                {loadingSessions ? (
                    <div className="flex items-center gap-2 text-xs opacity-50 px-2"><Loader2 className="w-4 h-4 animate-spin" /> جارٍ تحميل الجلسات...</div>
                ) : recitationSessions.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-xs opacity-60">لا توجد جلسات تسميع فعالة لهذه الحلقة حالياً.</div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {recitationSessions.map((session) => (
                            <div key={session.id} className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-black text-sm truncate">{session.title}</p>
                                    <p className="text-[11px] opacity-60 font-bold mt-1 flex items-center gap-1">
                                        {session.type === "video" ? <Video className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                                        {session.creatorName}
                                    </p>
                                </div>
                                <a href={session.url} target="_blank" rel="noopener noreferrer" className="shrink-0 px-3 py-2 rounded-xl bg-primary text-white text-xs font-black flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    دخول
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Students List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map(student => (
                    <GlassCard key={student.id} className="p-4 space-y-4 group rounded-2xl hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[1.5px]">
                                <div className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden flex items-center justify-center text-lg font-black text-primary">
                                    {student.photoURL ? (
                                        <img src={student.photoURL} alt={student.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        student.displayName?.[0] || "?"
                                    )}
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="font-black text-base leading-tight group-hover:text-primary transition-colors">{student.displayName}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] text-muted-foreground font-medium opacity-60 truncate max-w-[120px]">{student.phoneNumber || student.email}</p>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <div className="flex items-center gap-1 text-amber-500 font-black text-[9px]">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        {student.totalPoints || 0} XP
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student);
                                    setEvalType("attendance");
                                    setEvalMark("حاضر");
                                }}
                                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all text-[11px] font-black"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                الحضور
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student);
                                    setEvalType("recitation");
                                    setEvalMark("ممتاز");
                                }}
                                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all text-[11px] font-black"
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                التسميع
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student);
                                    setEvalType("test");
                                    setEvalMark("ممتاز");
                                }}
                                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all text-[11px] font-black col-span-2"
                            >
                                <Users className="w-3.5 h-3.5" />
                                الاختبار النهائي
                            </button>
                        </div>
                    </GlassCard>
                ))}

                {filteredStudents.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                        لا يوجد طلاب مطابقين لبحثك في هذه الحلقة.
                    </div>
                )}
            </div>

            {/* Evaluation Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStudent(null)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                                <h2 className="text-lg font-black flex items-center gap-2">
                                    {evalType === "attendance" ? <Calendar className="w-4 h-4 text-blue-500" /> : evalType === "test" ? <Users className="w-4 h-4 text-amber-500" /> : <BookOpen className="w-4 h-4 text-emerald-500" />}
                                    {evalType === "attendance" ? "تسجيل الحضور" : evalType === "test" ? "الاختبار النهائي" : "تقييم التسميع"}
                                </h2>
                                <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                                    <XCircle className="w-5 h-5 text-muted-foreground opacity-50 hover:opacity-100" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEvaluation} className="p-5 space-y-5">
                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
                                        {selectedStudent.displayName[0]}
                                    </div>
                                    <p className="font-black text-sm">{selectedStudent.displayName}</p>
                                </div>

                                {evalType === "attendance" ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">حالة الحضور اليوم</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['حاضر', 'غائب', 'مستأذن'].map(status => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setEvalMark(status)}
                                                    className={`py-2.5 rounded-lg border font-black text-xs transition-all ${
                                                        evalMark === status 
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                                                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">تقييم التسميع والمراجعة</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(evalType === "test" ? ['ممتاز', 'جيد جداً', 'جيد', 'مقبول'] : ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف', 'لم يسمع']).map(mark => (
                                                <button
                                                    key={mark}
                                                    type="button"
                                                    onClick={() => setEvalMark(mark)}
                                                    className={`py-2 rounded-lg border text-xs font-black transition-all ${
                                                        evalMark === mark 
                                                        ? (evalType === 'test' ? 'bg-amber-500 text-white border-amber-500' : 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20')
                                                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {mark}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block">ملاحظات المعلم (اختياري)</label>
                                    <textarea
                                        value={evalNotes}
                                        onChange={e => setEvalNotes(e.target.value)}
                                        className="w-full h-20 p-3 rounded-xl border border-white/5 bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 resize-none text-xs"
                                        placeholder="اكتب ملاحظاتك عن أداء الطالب اليوم..."
                                    />
                                </div>

                                <button
                                    disabled={saving}
                                    type="submit"
                                    className="w-full py-3.5 rounded-xl bg-primary text-white font-black text-sm hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ السجل
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
