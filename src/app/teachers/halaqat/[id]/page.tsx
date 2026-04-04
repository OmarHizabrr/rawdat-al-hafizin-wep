"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users, Calendar, ArrowRight, CheckCircle2, XCircle, Search, Save, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
    id: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    photoURL?: string;
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
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        // Fetch Group details
        const fetchGroup = async () => {
            const snap = await getDoc(doc(db, "groups", id));
            if (snap.exists()) {
                setGroup({ id: snap.id, ...snap.data() } as GroupModel);
            }
        };
        fetchGroup();

        // Fetch Students belonging to this group
        // Assuming students have a `groupId` field matching this group's id.
        const q = query(collection(db, "users"), where("role", "==", "student"), where("groupId", "==", id));
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

    const filteredStudents = students.filter(s => 
        s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        setSaving(true);

        try {
            await addDoc(collection(db, "evaluations", id, "evaluations"), {
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

            // Also save to a global student record for easy fetching in the records page
            if (evalType === "test") {
                await addDoc(collection(db, "student_records", selectedStudent.id, "achievements"), {
                    title: `اختبار نهائي: ${group?.name}`,
                    mark: evalMark,
                    date: new Date().toISOString().split('T')[0],
                    type: "certificate",
                    courseId: id, // or the linked course id
                    createdAt: serverTimestamp()
                });
            }

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
            <div className="flex items-center gap-4">
                <Link href="/teachers" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowRight className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{group?.name || "جاري التحميل..."}</h1>
                    <p className="text-muted-foreground">إدارة طلاب الحلقة وتقييمهم</p>
                </div>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-white/20 backdrop-blur-md">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Users className="w-5 h-5" />
                    <span>الطلاب ({students.length})</span>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="ابحث عن طالب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>

            {/* Students List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map(student => (
                    <GlassCard key={student.id} className="p-6 space-y-4 group">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px]">
                                <div className="w-full h-full bg-background rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-primary">
                                    {student.photoURL ? (
                                        <img src={student.photoURL} alt={student.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        student.displayName?.[0] || "?"
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{student.displayName}</h3>
                                <p className="text-sm text-muted-foreground">{student.phoneNumber || student.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student);
                                    setEvalType("attendance");
                                    setEvalMark("حاضر");
                                }}
                                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors text-sm font-bold"
                            >
                                <Calendar className="w-4 h-4" />
                                الحضور
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student);
                                    setEvalType("recitation");
                                    setEvalMark("ممتاز");
                                }}
                                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 transition-colors text-sm font-bold"
                            >
                                <BookOpen className="w-4 h-4" />
                                التسميع
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student);
                                    setEvalType("test");
                                    setEvalMark("ممتاز");
                                }}
                                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 transition-colors text-sm font-bold col-span-2"
                            >
                                <Users className="w-4 h-4" />
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
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {evalType === "attendance" ? <Calendar className="w-5 h-5 text-blue-500" /> : evalType === "test" ? <Users className="w-5 h-5 text-amber-500" /> : <BookOpen className="w-5 h-5 text-green-500" />}
                                    {evalType === "attendance" ? "تسجيل الحضور" : evalType === "test" ? "الاختبار النهائي" : "تقييم التسميع"}
                                </h2>
                                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full">
                                    <XCircle className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEvaluation} className="p-6 space-y-6">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {selectedStudent.displayName[0]}
                                    </div>
                                    <p className="font-bold">{selectedStudent.displayName}</p>
                                </div>

                                {evalType === "attendance" ? (
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold">حالة الحضور اليوم</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['حاضر', 'غائب', 'مستأذن'].map(status => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setEvalMark(status)}
                                                    className={`py-3 rounded-xl border font-bold text-sm transition-colors ${
                                                        evalMark === status 
                                                        ? 'bg-blue-500 text-white border-blue-500' 
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold">تقييم التسميع والمراجعة</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(evalType === "test" ? ['ممتاز', 'جيد جداً', 'جيد', 'مقبول'] : ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف', 'لم يسمع']).map(mark => (
                                                <button
                                                    key={mark}
                                                    type="button"
                                                    onClick={() => setEvalMark(mark)}
                                                    className={`py-2 rounded-xl border text-sm font-bold transition-colors ${
                                                        evalMark === mark 
                                                        ? (evalType === 'test' ? 'bg-amber-500 text-white border-amber-500' : 'bg-green-500 text-white border-green-500')
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    {mark}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold block">ملاحظات المعلم (اختياري)</label>
                                    <textarea
                                        value={evalNotes}
                                        onChange={e => setEvalNotes(e.target.value)}
                                        className="w-full h-24 p-3 rounded-xl border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                        placeholder="اكتب ملاحظاتك عن أداء الطالب اليوم..."
                                    />
                                </div>

                                <button
                                    disabled={saving}
                                    type="submit"
                                    className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
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
