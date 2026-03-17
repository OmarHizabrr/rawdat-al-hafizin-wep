"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { UploadCloud, FileSpreadsheet, Save, Trash2, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function HadithManagementPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saved, setSaved] = useState(false);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setHasUnsavedChanges(true);
            setSaved(false);
        }
    };

    const handleSave = async () => {
        if (!file) return;

        setUploading(true);
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setUploading(false);
        setHasUnsavedChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleClear = () => {
        if (hasUnsavedChanges && !confirm("سيتم فقدان الملف الذي قمت بجلبه، هل توافق؟")) {
            return;
        }
        setFile(null);
        setHasUnsavedChanges(false);
        setSaved(false);
        // Reset file input
        const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    إدارة الأحاديث (Excel)
                </h1>
                <p className="text-muted-foreground pt-1">رفع وتحديث قاعدة بيانات الأحاديث النبوية للمقررات</p>
            </div>

            {hasUnsavedChanges && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold">تغييرات غير محفوظة</h3>
                        <p className="text-sm">لقد قمت بإضافة ملف ولم تقم بحفظه بعد. تجنب مغادرة الصفحة قبل الضغط على زر الحفظ.</p>
                    </div>
                </div>
            )}

            {saved && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="font-bold">تم رفع الملف وتحديث قاعدة البيانات بنجاح!</span>
                </div>
            )}

            <GlassCard className="p-8 border-dashed border-2 text-center space-y-6">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">ارفع ملف الإكسل هنا</h3>
                    <p className="text-muted-foreground text-sm">يقبل النظام ملفات .xlsx و .xls فقط</p>
                </div>

                <div className="max-w-xs mx-auto">
                    <input 
                        type="file" 
                        id="excel-upload"
                        accept=".xlsx, .xls" 
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <label 
                        htmlFor="excel-upload"
                        className="flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer font-medium transition-colors border"
                    >
                        {file ? "تغيير الملف" : "اختيار ملف الأحاديث"}
                    </label>
                </div>

                {file && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto p-4 rounded-xl bg-white dark:bg-black/20 border shadow-sm flex items-center justify-between text-right"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FileSpreadsheet className="w-8 h-8 text-green-600 shrink-0" />
                            <div className="truncate">
                                <p className="font-bold text-sm truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button onClick={handleClear} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors shrink-0">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </GlassCard>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button 
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || uploading}
                    className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${hasUnsavedChanges && !uploading ? 'bg-primary hover:bg-primary/90 shadow-primary/20' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
                >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    حفظ ورفع البيانات
                </button>
            </div>
        </div>
    );
}
