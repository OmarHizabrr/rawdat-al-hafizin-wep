"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
    UploadCloud, 
    FileSpreadsheet, 
    Save, 
    Trash2, 
    Loader2, 
    AlertTriangle, 
    CheckCircle2, 
    FileUp, 
    Info, 
    BookOpen,
    HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EliteDialog } from "@/components/ui/EliteDialog";

export default function HadithManagementPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'warning' | 'info';
        title: string;
        description: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        description: ''
    });

    // Prevent accidental navigation if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = "لديك تغييرات غير محفوظة! هل أنت متأكد من مغادرة الصفحة؟";
                return "لديك تغييرات غير محفوظة! هل أنت متأكد من مغادرة الصفحة؟";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const showDialog = (type: 'success' | 'danger' | 'warning' | 'info', title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setHasUnsavedChanges(true);
        }
    };

    const handleSave = async () => {
        if (!file) return;

        showDialog('warning', 'تأكيد الرفع', 'سيتم استبدال قاعدة بيانات الأحاديث الحالية بالبيانات الموجودة في هذا الملف. هل تريد المتابعة؟', async () => {
            setUploading(true);
            try {
                // Simulate actual upload/process logic
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                setHasUnsavedChanges(false);
                showDialog('success', 'تم الرفع بنجاح', `تمت معالجة ملف "${file.name}" وتحديث قاعدة بيانات الأحاديث في النظام.`);
            } catch (error) {
                console.error(error);
                showDialog('danger', 'فشل الرفع', 'حدث خطأ غير متوقع أثناء معالجة ملف الإكسل. يرجى التأكد من صيغة الملف.');
            } finally {
                setUploading(false);
            }
        });
    };

    const handleClear = () => {
        if (hasUnsavedChanges) {
            showDialog('warning', 'إلغاء الملف', 'سيتم فقدان الملف الذي قمت بجلبه، هل توافق؟', () => {
                setFile(null);
                setHasUnsavedChanges(false);
                const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            });
            return;
        }
        setFile(null);
    };

    return (
        <div className="space-y-10 pb-20 max-w-5xl mx-auto px-4">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center md:text-right space-y-4 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl"
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 shadow-inner">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">إدارة الأحاديث النبوية</h1>
                        <p className="text-muted-foreground mt-1 max-w-xl">تحديث قاعدة البيانات المركزية للأحاديث عبر رفع ملفات Excel المنسقة.</p>
                    </div>
                </div>
            </motion.div>

            {/* Instruction Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <GlassCard className="bg-primary/5 border-primary/20 p-6 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-primary mb-1 text-sm">كيفية التنسيق الصحيح للملف</h4>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed">
                            تأكد من وجود الأعمدة التالية في ملف الإكسل: (الرقم، الحديث، الراوي، رقم الحديث). النظام سيقوم بتحديث السجلات بناءً على هذه البيانات آلياً.
                        </p>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Main Upload Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <GlassCard className="p-12 border-dashed border-2 text-center group bg-white/2 dark:bg-black/20 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
                    <input 
                        type="file" 
                        id="excel-upload"
                        accept=".xlsx, .xls" 
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <label 
                        htmlFor="excel-upload"
                        className="absolute inset-0 cursor-pointer z-10"
                    />
                    
                    <div className="relative z-20 space-y-6">
                        <div className="w-24 h-24 bg-green-500/10 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner border border-green-500/5">
                            <UploadCloud className="w-12 h-12" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">اسحب ملف الإكسل أو انقر هنا</h3>
                            <p className="text-muted-foreground/60 text-sm max-w-xs mx-auto">يدعم ملفات Microsoft Excel بصيغة .xlsx أو .xls فقط.</p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Selected File Card */}
            <AnimatePresence>
                {file && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-xl mx-auto"
                    >
                        <GlassCard className="p-6 bg-green-500/5 border-green-500/20 shadow-xl flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg truncate max-w-[250px]">{file.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        <span>جاهز للرفع والتحديث</span>
                                        <span className="mx-1">•</span>
                                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleClear} 
                                className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 transition-all hover:text-white group"
                                title="إلغاء الملف"
                            >
                                <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save Buttons Section */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row justify-center gap-4 pt-10"
            >
                <div className="w-full max-w-md">
                    <button 
                        onClick={handleSave}
                        disabled={!file || uploading}
                        className={`w-full py-5 rounded-2xl font-bold text-lg text-white transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${file && !uploading ? 'bg-primary hover:shadow-primary/40 hover:-translate-y-1' : 'bg-gray-400 dark:bg-white/5 cursor-not-allowed opacity-50 shadow-none'}`}
                    >
                        {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <FileUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        )}
                        <span>حفظ ونشر البيانات في النظام</span>
                    </button>
                    {hasUnsavedChanges && !uploading && (
                        <p className="text-center text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-widest animate-pulse flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            لديك تغييرات غير محفوظة حالياً
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Help Section */}
            <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
                <button className="text-xs flex items-center gap-1 mx-auto">
                    <HelpCircle className="w-3 h-3" />
                    هل تحتاج إلى نموذج لملف الإكسل؟
                </button>
            </div>

            <EliteDialog
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
                onConfirm={() => {
                    if (dialogConfig.onConfirm) dialogConfig.onConfirm();
                    setDialogConfig({ ...dialogConfig, isOpen: false });
                }}
                title={dialogConfig.title}
                description={dialogConfig.description}
                type={dialogConfig.type as any}
                confirmText={dialogConfig.onConfirm ? "نعم، استمر" : "حسناً"}
            />
        </div>
    );
}
