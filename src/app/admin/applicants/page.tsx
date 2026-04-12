"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
    collectionGroup, 
    query, 
    onSnapshot, 
    doc, 
    updateDoc, 
    getDoc,
    serverTimestamp,
    deleteDoc,
    where
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
    UserCheck, 
    UserX, 
    Search, 
    Filter, 
    Loader2, 
    MapPin, 
    Globe, 
    Calendar,
    GraduationCap,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    XCircle,
    User,
    Users,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface Applicant {
    id: string; // The user ID
    personalInfo: {
        fullName: string;
        age: string;
        gender: string;
        nationality: string;
        residence: string;
        country: string;
        phone: string;
        phonePrefix: string;
        educationLevel: string;
        major: string;
        job: string;
    };
    enrollmentStatus: {
        internetAvailable: boolean;
        canAttendOnline: boolean;
        agreesToAttendance: boolean;
        hasMemorizedQuran: boolean;
        isAccepted: boolean;
        joinedAt: any;
    };
    updatedAt?: any;
}

export default function ApplicantsManagement() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted'>('pending');
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

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

    useEffect(() => {
        // Use collectionGroup to find all applicant documents across the nested structure
        const q = query(collectionGroup(db, "applicants"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Applicant[];
            
            // Sort by updatedAt descending
            setApplicants(data.sort((a, b) => {
                const timeA = a.updatedAt?.seconds || 0;
                const timeB = b.updatedAt?.seconds || 0;
                return timeB - timeA;
            }));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const showDialog = (type: any, title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const handleAccept = async (applicant: Applicant) => {
        showDialog('warning', 'تأكيد القبول', `هل أنت متأكد من قبول "${applicant.personalInfo.fullName}" كطالب رسمي في المنصة؟`, async () => {
            setProcessing(applicant.id);
            try {
                // 1. Update application status
                const appRef = doc(db, "applicants", "pending", "applicants", applicant.id);
                await updateDoc(appRef, {
                    "enrollmentStatus.isAccepted": true,
                    "updatedAt": serverTimestamp()
                });

                // 2. Update user role to 'student'
                const userRef = doc(db, "users", applicant.id);
                await updateDoc(userRef, {
                    role: 'student',
                    updatedAt: serverTimestamp()
                });

                showDialog('success', 'تم القبول', `تم اعتماد "${applicant.personalInfo.fullName}" طالباً في المنصة بنجاح.`);
            } catch (error) {
                console.error("Error accepting applicant:", error);
                showDialog('danger', 'فشل الإجراء', 'حدث خطأ أثناء محاولة قبول الطلب.');
            } finally {
                setProcessing(null);
            }
        });
    };

    const handleDelete = async (applicant: Applicant) => {
        showDialog('danger', 'حذف الطلب', `هل أنت متأكد من حذف طلب "${applicant.personalInfo.fullName}"؟ هذا الإجراء لا يمكن التراجع عنه.`, async () => {
            setProcessing(applicant.id);
            try {
                const appRef = doc(db, "applicants", "pending", "applicants", applicant.id);
                await deleteDoc(appRef);
                showDialog('success', 'تم الحذف', 'تم حذف طلب الالتحاق بنجاح.');
            } catch (error) {
                console.error("Error deleting applicant:", error);
                showDialog('danger', 'فشل الحذف', 'حدث خطأ أثناء حذف الطلب.');
            } finally {
                setProcessing(null);
            }
        });
    };

    const filteredApplicants = applicants.filter(app => {
        const matchesStatus = statusFilter === 'accepted' ? app.enrollmentStatus.isAccepted : !app.enrollmentStatus.isAccepted;
        const matchesSearch = 
            app.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.personalInfo.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.personalInfo.phone.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-40">جاري جلب طلبات الالتحاق...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl relative overflow-hidden card-shine">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full -mr-16 -mt-16" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-elite-gradient">طلبات الحافظين الجدد</h1>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium opacity-60">مراجعة وفحص بيانات المتقدمين للانضمام للبرنامج</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-all duration-300" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الدولة أو الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-6 pr-11 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-[11px] md:text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-5 py-1.5 rounded-lg text-[11px] md:text-xs font-black transition-all ${statusFilter === 'pending' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                    طلبات معلقة ({applicants.filter(a => !a.enrollmentStatus.isAccepted).length})
                </button>
                <button
                    onClick={() => setStatusFilter('accepted')}
                    className={`px-5 py-1.5 rounded-lg text-[11px] md:text-xs font-black transition-all ${statusFilter === 'accepted' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                    مقبولون ({applicants.filter(a => a.enrollmentStatus.isAccepted).length})
                </button>
            </div>

            {/* Applicants Grid */}
            <div className="grid gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredApplicants.map((app, index) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <GlassCard className="p-0 overflow-hidden group hover:border-primary/30 transition-all border-white/5 rounded-2xl">
                                <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 md:gap-8">
                                    {/* User Branding */}
                                    <div className="flex flex-col items-center gap-4 lg:w-40 shrink-0 border-b lg:border-b-0 lg:border-l border-white/5 pb-4 lg:pb-0">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-600/10 to-transparent flex items-center justify-center border border-white/5 shadow-xl relative group-hover:scale-105 transition-all">
                                            <User className="w-10 h-10 text-primary opacity-40" />
                                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0a0a0a] border border-white/5 rounded-lg flex items-center justify-center shadow-xl">
                                                <div className={`w-2 h-2 rounded-full ${app.enrollmentStatus.isAccepted ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                                            </div>
                                        </div>
                                        <div className="text-center font-black">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mb-0.5">تاريخ التقديم</p>
                                            <p className="text-[11px] bg-white/5 px-3 py-1 rounded-full border border-white/5 opacity-60">
                                                {app.updatedAt ? new Date(app.updatedAt.seconds * 1000).toLocaleDateString('ar-SA') : 'قيد المراجعة'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="text-lg font-black group-hover:text-primary transition-colors">{app.personalInfo.fullName}</h3>
                                                <p className="text-[11px] font-bold text-primary/80 flex items-center gap-1 mt-0.5">
                                                    <Globe className="w-3 h-3" />
                                                    {app.personalInfo.nationality} | {app.personalInfo.country}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge icon={Calendar} text={`${app.personalInfo.age} سنة`} />
                                                <Badge icon={MapPin} text={app.personalInfo.residence} />
                                                <Badge icon={GraduationCap} text={app.personalInfo.educationLevel} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" />
                                                    الحالة والالتزام
                                                </p>
                                                <div className="space-y-1">
                                                    <CheckItem label="حفظ القرآن كاملاً" checked={app.enrollmentStatus.hasMemorizedQuran} />
                                                    <CheckItem label="التزام بالحضور" checked={app.enrollmentStatus.agreesToAttendance} />
                                                    <CheckItem label="توفر الإنترنت" checked={app.enrollmentStatus.internetAvailable} />
                                                    <CheckItem label="الاتصال المرئي" checked={app.enrollmentStatus.canAttendOnline} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-30">تخصص الطالب</p>
                                                <p className="text-xs font-black">{app.personalInfo.major || 'غير محدد'}</p>
                                                <p className="text-[10px] opacity-50 font-medium">{app.personalInfo.job || 'طالب'}</p>
                                            </div>
                                            <div className="pt-1.5 border-t border-white/5">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-30">واتساب</p>
                                                <a href={`https://wa.me/${app.personalInfo.phonePrefix}${app.personalInfo.phone}`} target="_blank" className="text-[11px] font-black text-emerald-500 hover:text-emerald-400 dir-ltr inline-block mt-0.5 transition-colors">
                                                    {app.personalInfo.phonePrefix} {app.personalInfo.phone}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row lg:flex-col items-center justify-center gap-2 lg:w-40 shrink-0 bg-white/5 rounded-xl md:rounded-2xl p-4 border border-white/5">
                                        {!app.enrollmentStatus.isAccepted ? (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(app)}
                                                    disabled={!!processing}
                                                    className="w-full py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg font-black text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95"
                                                >
                                                    {processing === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                    <span>اعتماد القبول</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app)}
                                                    className="w-full py-2.5 bg-red-500/5 text-red-500/60 hover:text-red-500 rounded-lg font-black text-[11px] hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 border border-red-500/5 active:scale-95"
                                                >
                                                    <UserX className="w-3.5 h-3.5" />
                                                    <span>رفض الطلب</span>
                                                </button>
                                            </>
                                        ) : (
                                            <motion.div 
                                                initial={{ scale: 0 }} 
                                                animate={{ scale: 1 }} 
                                                className="flex flex-col items-center gap-2 text-green-500"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                                    <ShieldCheck className="w-7 h-7" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">عضو معتمد</span>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredApplicants.length === 0 && (
                    <div className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8 text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-muted-foreground font-medium">لا توجد طلبات {statusFilter === 'pending' ? 'معلقة حالياً' : 'مقبولة'}.</p>
                    </div>
                )}
            </div>

            <EliteDialog
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
                onConfirm={() => {
                    if (dialogConfig.onConfirm) dialogConfig.onConfirm();
                    setDialogConfig({ ...dialogConfig, isOpen: false });
                }}
                type={dialogConfig.type as any}
                title={dialogConfig.title}
                description={dialogConfig.description}
                confirmText={dialogConfig.onConfirm ? "نعم، استمر" : "حسناً"}
            />
        </div>
    );
}

function Badge({ icon: Icon, text }: any) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold opacity-70">
            <Icon className="w-3 h-3 text-primary" />
            {text}
        </div>
    );
}

function CheckItem({ label, checked }: { label: string, checked: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {checked ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500/30 shrink-0" />}
            <span className={`text-[11px] font-bold ${checked ? 'opacity-90' : 'opacity-40 line-through'}`}>{label}</span>
        </div>
    );
}
