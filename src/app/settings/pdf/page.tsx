"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, RotateCcw, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { PdfSettingsService, defaultPdfSettings, type PdfSettings } from "@/lib/pdf-settings";
import { GlassCard } from "@/components/ui/GlassCard";

export default function PdfSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<PdfSettings>(defaultPdfSettings);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        setSettings(PdfSettingsService.getSettings());
    }, []);

    const handleChange = (field: keyof PdfSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        PdfSettingsService.saveSettings(settings);
        alert("تم حفظ الإعدادات بنجاح"); // Simple feedback
    };

    const handleReset = () => {
        if (confirm("هل أنت متأكد من استعادة الإعدادات الافتراضية؟")) {
            setSettings(defaultPdfSettings);
            PdfSettingsService.resetSettings();
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix if needed, or keep it. Steps usually keep it for <img> src.
                // But typically for pure base64 storage we might strip. Let's keep full data URL for simplicity in <img> src.
                handleChange('logoBase64', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!mounted) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">إعدادات الطباعة المتقدمة</h1>
                        <p className="text-muted-foreground text-sm">تخصيص ترويسة وتذييل تقارير PDF</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                        title="استعادة الافتراضي"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        <Save className="w-4 h-4" />
                        <span>حفظ التغييرات</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo & Appearance */}
                <div className="space-y-6">
                    <section>
                        <h2 className="text-lg font-bold text-primary mb-4">الشعار والظهور</h2>
                        <GlassCard className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 relative group">
                                    {settings.logoBase64 ? (
                                        <img src={settings.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-white text-xs font-bold"
                                        >
                                            تغيير
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold">شعار الترويسة</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <Upload className="w-3 h-3" />
                                            رفع صورة
                                        </button>
                                        {settings.logoBase64 && (
                                            <button
                                                onClick={() => handleChange('logoBase64', '')}
                                                className="px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                حذف
                                            </button>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-white/5" />

                            <div className="flex items-center justify-between">
                                <span className="font-medium">إظهار رأس الصفحة (Header)</span>
                                <Toggle
                                    value={settings.isHeaderVisible}
                                    onChange={(v) => handleChange('isHeaderVisible', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="font-medium">إظهار تذييل الصفحة (Footer)</span>
                                <Toggle
                                    value={settings.isFooterVisible}
                                    onChange={(v) => handleChange('isFooterVisible', v)}
                                />
                            </div>
                        </GlassCard>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-primary mb-4">تنسيق الخط والهوامش</h2>
                        <GlassCard className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">نوع الخط العربي</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Amiri', 'Cairo', 'NotoNaskhArabic'].map(font => (
                                        <button
                                            key={font}
                                            onClick={() => handleChange('fontFamily', font)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-sm border transition-all
                                                ${settings.fontFamily === font
                                                    ? "bg-primary text-white border-primary"
                                                    : "hover:bg-gray-100 dark:hover:bg-white/5 border-transparent"}
                                            `}
                                        >
                                            {font}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>حجم الخط</span>
                                        <span className="font-bold">{settings.fontSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="8" max="24" step="1"
                                        value={settings.fontSize}
                                        onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>الهوامش (Margins)</span>
                                        <span className="font-bold">{settings.margin}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="50" step="1"
                                        value={settings.margin}
                                        onChange={(e) => handleChange('margin', Number(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    </section>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <section>
                        <h2 className="text-lg font-bold text-primary mb-4">نصوص الترويسة والتذييل</h2>
                        <GlassCard className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium block">نص اليمين (عربي)</label>
                                <textarea
                                    value={settings.rightHeader}
                                    onChange={(e) => handleChange('rightHeader', e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium block">نص اليسار (إنجليزي/إضافي)</label>
                                <textarea
                                    value={settings.leftHeader}
                                    onChange={(e) => handleChange('leftHeader', e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium block">نصوص التذييل (Footer)</label>
                                <textarea
                                    value={settings.footerText}
                                    onChange={(e) => handleChange('footerText', e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
                                    dir="rtl"
                                    placeholder="سطر لكل توقيع..."
                                />
                            </div>
                        </GlassCard>
                    </section>
                </div>
            </div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean, onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`
                w-11 h-6 rounded-full transition-colors flex items-center px-1
                ${value ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"}
            `}
        >
            <div className={`
                w-4 h-4 rounded-full bg-white shadow transition-transform
                ${value ? "translate-x-[-20px] rtl:translate-x-[-20px]" : "translate-x-0"}
            `} />
        </button>
    );
}
