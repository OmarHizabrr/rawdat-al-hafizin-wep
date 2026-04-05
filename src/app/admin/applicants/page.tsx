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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-4">
                        <Users className="w-8 h-8 text-primary" />
                        إدارة طلبات الالتحاق
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">مراجعة بيانات المتقدمين الجدد واعتماد عضوياتهم</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <div className="relative group">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الدولة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-3 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none w-full sm:w-64 transition-all text-sm font-bold"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${statusFilter === 'pending' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                    طلبات معلقة ({applicants.filter(a => !a.enrollmentStatus.isAccepted).length})
                </button>
                <button
                    onClick={() => setStatusFilter('accepted')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${statusFilter === 'accepted' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                    مقبولون ({applicants.filter(a => a.enrollmentStatus.isAccepted).length})
                </button>
            </div>

            {/* Applicants Grid */}
            <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredApplicants.map((app, index) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="p-0 overflow-hidden group hover:border-primary/30 transition-all border-white/5">
                                <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                                    {/* User Branding */}
                                    <div className="flex flex-col items-center gap-4 lg:w-48 shrink-0">
                                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/20 to-purple-600/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                                            <User className="w-10 h-10 text-primary opacity-50" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">تاريخ الطلب</p>
                                            <p className="text-xs font-bold mt-1">
                                                {app.updatedAt ? new Date(app.updatedAt.seconds * 1000).toLocaleDateString('ar-SA') : 'قيد المراجعة'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-xl font-black">{app.personalInfo.fullName}</h3>
                                                <p className="text-xs font-bold text-primary flex items-center gap-1 mt-1">
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

                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">التخصص والعمل</p>
                                                <p className="text-sm font-bold">{app.personalInfo.major || 'غير محدد'}</p>
                                                <p className="text-xs opacity-60">{app.personalInfo.job || 'طالب'}</p>
                                            </div>
                                            <div className="pt-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">رقم الواتساب</p>
                                                <a href={`https://wa.me/${app.personalInfo.phonePrefix}${app.personalInfo.phone}`} target="_blank" className="text-sm font-bold text-green-600 hover:underline dir-ltr inline-block mt-1">
                                                    {app.personalInfo.phonePrefix} {app.personalInfo.phone}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row lg:flex-col items-center justify-center gap-3 lg:w-40 shrink-0 bg-white/5 rounded-[2rem] p-4 border border-white/5">
                                        {!app.enrollmentStatus.isAccepted ? (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(app)}
                                                    disabled={!!processing}
                                                    className="w-full py-3 bg-primary text-white rounded-2xl font-black text-xs hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {processing === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                                    اعتماد وقبول
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app)}
                                                    className="w-full py-3 bg-red-500/10 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                    رفض الطلب
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-green-500">
                                                <CheckCircle2 className="w-8 h-8" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">تم القبول</span>
                                            </div>
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
