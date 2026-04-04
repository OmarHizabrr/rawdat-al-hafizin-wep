"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { Loader2, Printer, Download, Share2, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CertificateData {
    studentName: string;
    courseName: string;
    completedAt: Timestamp | null;
    certificateId: string;
}

export default function CertificatePage() {
    const { courseId, userId } = useParams<{ courseId: string; userId: string }>();
    const [data, setData] = useState<CertificateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCertificate = async () => {
            if (!courseId || !userId) return;
            try {
                // 1. Get Enrollment Info
                const enrollRef = doc(db, "enrollments", courseId, "enrollments", userId);
                const enrollSnap = await getDoc(enrollRef);

                if (!enrollSnap.exists() || enrollSnap.data().status !== 'completed') {
                    setError("هذه الشهادة غير متوفرة حالياً أو لم يتم اكتمال متطلباتها.");
                    setLoading(false);
                    return;
                }

                const enrollData = enrollSnap.data();

                // 2. Get Course Info
                const courseRef = doc(db, "courses", courseId);
                const courseSnap = await getDoc(courseRef);
                const courseName = courseSnap.exists() ? courseSnap.data().title : "دورة السنة النبوية";

                setData({
                    studentName: enrollData.studentName || "طالب العلم",
                    courseName: courseName,
                    completedAt: enrollData.completedAt || null,
                    certificateId: `${courseId.substring(0, 4)}-${userId.substring(0, 4)}`
                });
            } catch (err) {
                console.error(err);
                setError("حدث خطأ أثناء تحميل الشهادة.");
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, [courseId, userId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-600 mx-auto" />
                    <p className="text-stone-500 font-bold">جاري استخراج الوثيقة الرسمية...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
                <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-stone-800">{error}</h2>
                    <button onClick={() => window.history.back()} className="px-6 py-2 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors font-bold">العودة</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col items-center py-12 px-4 print:p-0 print:bg-white overflow-x-hidden">
            {/* Action Bar - Hidden during print */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-center gap-4 print:hidden sticky top-6 z-50 bg-white/50 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl"
            >
                <button 
                    onClick={() => window.history.back()} 
                    className="p-3 hover:bg-stone-100 rounded-xl transition-all"
                    title="العودة"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-stone-200 mx-2" />
                <button 
                    onClick={handlePrint}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-600/20"
                >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الشهادة</span>
                </button>
                <button 
                    className="px-6 py-2.5 bg-stone-800 hover:bg-black text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
                >
                    <Download className="w-4 h-4" />
                    <span>تحميل كملف</span>
                </button>
            </motion.div>

            {/* Certificate Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-[1000px] aspect-[1.414/1] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.1)] print:shadow-none overflow-hidden"
                id="certificate-content"
            >
                {/* Background Frame Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/assets/certificate_frame.png" 
                        alt="Frame" 
                        className="w-full h-full object-cover opacity-90"
                    />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col items-center justify-between py-[12%] px-[15%] text-stone-800 text-center font-serif leading-relaxed">
                    
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4 mb-2">
                             <div className="w-16 h-16 bg-amber-600/5 rounded-full flex items-center justify-center border border-amber-600/10">
                                <ShieldCheck className="w-10 h-10 text-amber-700" />
                             </div>
                        </div>
                        <h1 className="text-3xl font-black tracking-[0.2em] uppercase text-stone-400">روضة الحافظين</h1>
                        <p className="text-lg font-bold text-amber-800 italic">برنامج تحفيظ السنة النبوية بالمدينة النبوية</p>
                    </div>

                    {/* Main Title */}
                    <div className="space-y-6">
                        <div className="relative inline-block pb-2">
                            <h2 className="text-5xl font-black text-stone-800">شهادة إتمام ومباركة</h2>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-amber-600/30" />
                        </div>
                        <p className="text-2xl font-serif mt-8">يشهد برنامج تحفيظ السنة النبوية بأن</p>
                        <h3 className="text-5xl font-bold py-6 text-amber-900 drop-shadow-sm font-arabic">{data.studentName}</h3>
                        <p className="text-xl">قد أتمّ بفضل الله ومنّته متطلبات الحفظ والمراجعة في</p>
                        <h4 className="text-3xl font-black text-stone-800">{data.courseName}</h4>
                    </div>

                    {/* Prophetic Hadith */}
                    <div className="max-w-2xl text-lg font-medium italic text-stone-500 leading-loose border-t border-b border-stone-100 py-6">
                        "نضّر الله امرأً سمع مقالتي فوعاها فأداها كما سمعها"
                    </div>

                    {/* Footer / Signatures */}
                    <div className="w-full flex items-end justify-between px-10">
                        <div className="text-right space-y-2">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">تاريخ الإصدار</p>
                            <p className="text-lg font-bold">{data.completedAt?.toDate().toLocaleDateString('ar-SA') || '-'}</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 bg-amber-600/10 rounded-full border-4 border-double border-amber-600/20 flex items-center justify-center opacity-50 mb-4 scale-75">
                                <div className="text-stone-400 font-bold text-[10px] text-center uppercase tracking-widest">
                                    Official Seal
                                </div>
                            </div>
                            <p className="text-xs font-bold text-stone-400">الختم الرسمي للمنصة</p>
                        </div>

                        <div className="text-left space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">المُشرف العام</p>
                                <p className="text-xl font-bold text-stone-800">الشيخ يحيى اليحيى</p>
                            </div>
                            <div className="w-40 h-px bg-stone-300" />
                            <p className="text-[8px] font-bold text-stone-400 italic">Signature Placeholder</p>
                        </div>
                    </div>

                    {/* unique ID */}
                    <div className="absolute bottom-6 right-6 text-[10px] font-mono text-stone-300 font-bold opacity-50">
                        Verify ID: {data.certificateId}
                    </div>
                </div>
            </motion.div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                    body {
                        background: white !important;
                    }
                    #certificate-content {
                        width: 100vw !important;
                        height: 100vh !important;
                        max-width: none !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                    }
                }
                .font-arabic {
                    font-family: 'Amiri', serif;
                }
            `}</style>
        </div>
    );
}
