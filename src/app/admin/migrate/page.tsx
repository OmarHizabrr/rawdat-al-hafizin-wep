"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, getDocs, doc, writeBatch, 
    serverTimestamp, query 
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
    Database, Play, CheckCircle, 
    AlertTriangle, Loader2 
} from "lucide-react";
import { EliteDialog } from "@/components/ui/EliteDialog";

export default function MigrationPage() {
    const [migrating, setMigrating] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [dialogConfig, setDialogConfig] = useState({ 
        isOpen: false, 
        title: '', 
        description: '', 
        type: 'success' as any, 
        onConfirm: null as any 
    });

    const startMigration = async () => {
        setMigrating(true);
        setResults(["بدء عملية الهجرة..."]);
        try {
            const batch = writeBatch(db);
            let count = 0;

            const coursesSnap = await getDocs(collection(db, "courses"));
            setResults(prev => [...prev, `تم العثور على ${coursesSnap.size} دورة.`]);

            for (const courseDoc of coursesSnap.docs) {
                const courseId = courseDoc.id;
                const plansSnap = await getDocs(collection(db, "coursePlans", courseId, "coursePlans"));
                
                setResults(prev => [...prev, `معالجة الدورة: ${courseDoc.data().title} (${plansSnap.size} يوم)...`]);

                plansSnap.forEach((planDoc) => {
                    const data = planDoc.data();
                    if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0 && typeof data.tasks[0] === 'object') {
                        return;
                    }

                    const oldTasks = data.tasks || [];
                    const newTasks = [{
                        tierId: 'hifz_new',
                        label: 'حفظ جديد',
                        type: data.planType || 'hadiths',
                        start: data.startPoint || "1",
                        end: data.endPoint || "",
                        notes: oldTasks
                    }];

                    batch.update(planDoc.ref, {
                        tasks: newTasks,
                        updatedAt: serverTimestamp(),
                        planType: null,
                        startPoint: null,
                        endPoint: null
                    });
                    count++;
                });
            }

            await batch.commit();
            setResults(prev => [...prev, `تمت العملية بنجاح! تم تحديث ${count} مستند.`]);
            setDialogConfig({ isOpen: true, title: 'اكتملت الهجرة', description: `تم تحويل ${count} خطة إلى النظام الجديد بنجاح.`, type: 'success', onConfirm: null });
        } catch (error: any) {
            setResults(prev => [...prev, `خطأ: ${error.message}`]);
            setDialogConfig({ isOpen: true, title: 'فشل الهجرة', description: error.message, type: 'danger', onConfirm: null });
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-24 text-right" dir="rtl">
            <header className="space-y-2">
                <h1 className="text-3xl font-black flex items-center gap-4">
                    <Database className="w-8 h-8 text-primary" />
                    مركز هجرة البيانات
                </h1>
                <p className="text-muted-foreground font-medium">تحويل كافة خطط الحفظ القديمة إلى النظام المرن الجديد.</p>
            </header>

            <GlassCard className="p-10 border-amber-500/20 bg-amber-500/5 space-y-8">
                <div className="flex items-start gap-4 text-right">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">تنبيه هام</h3>
                        <p className="text-sm leading-relaxed opacity-70">
                            هذه العملية ستقوم بتحويل الحقول (بداية، نهاية، نوع) في كافة الخطط الحالية إلى مصفوفة مهام (Tasks) موحدة تحت مسمى "حفظ جديد". 
                            يرجى التأكد من أخذ نسخة احتياطية من البيانات قبل البدء.
                        </p>
                    </div>
                </div>

                <div className="bg-black/20 rounded-2xl p-6 font-mono text-xs space-y-2 max-h-64 overflow-y-auto custom-scrollbar text-left" dir="ltr">
                    {results.map((res, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                            <span className={res.includes('خطأ') ? 'text-red-400' : res.includes('نجاح') ? 'text-green-400' : ''}>{res}</span>
                        </div>
                    ))}
                    {results.length === 0 && <span className="opacity-30">جاهز للبدء...</span>}
                </div>

                <button 
                    disabled={migrating}
                    onClick={() => setDialogConfig({ isOpen: true, title: 'تأكيد العملية', description: 'هل أنت متأكد من بدء عملية تحويل كافة الخطط؟ لا يمكن التراجع عن هذه الخطوة.', type: 'warning', onConfirm: startMigration })}
                    className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                    {migrating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                    بدء التحويل الشامل
                </button>
            </GlassCard>

            <EliteDialog 
                isOpen={dialogConfig.isOpen} 
                onClose={() => setDialogConfig({...dialogConfig, isOpen: false})} 
                onConfirm={() => { if (dialogConfig.onConfirm) dialogConfig.onConfirm(); setDialogConfig({...dialogConfig, isOpen: false}); }}
                type={dialogConfig.type} title={dialogConfig.title} description={dialogConfig.description} 
            />
        </div>
    );
}
