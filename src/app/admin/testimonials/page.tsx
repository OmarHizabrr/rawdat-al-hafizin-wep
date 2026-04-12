"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    collectionGroup,
    getDocs,
    increment,
    setDoc,
    writeBatch,
    Timestamp
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { EliteModal } from "@/components/ui/EliteModal";
import {
    Trash2,
    Search,
    MessageCircle,
    Eye,
    EyeOff,
    Edit,
    User,
    Heart,
    Loader2,
    X,
    CheckCircle2,
    MessageSquare,
    Quote,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { cn } from "@/lib/utils";

interface Testimonial {
    id: string;
    studentName: string;
    studentId: string;
    studentPhoto?: string;
    content: string;
    isVisible: boolean;
    createdAt?: any;
    likesCount?: number;
}

export default function TestimonialsDashboard() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState<Testimonial | null>(null);
    const [editedContent, setEditedContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [likedByUsers, setLikedByUsers] = useState<any[]>([]);
    const [loadingLikes, setLoadingLikes] = useState(false);

    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'warning';
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
        const unsubscribe = onSnapshot(collectionGroup(db, "testimonials"), (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Testimonial[];
            setTestimonials(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const showDialog = (type: 'success' | 'danger' | 'warning', title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const filtered = testimonials.filter(t =>
        t.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleVisibility = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, "testimonials", "global", "testimonials", id), {
                isVisible: !currentStatus
            });
        } catch (e) {
            console.error(e);
            showDialog('danger', 'فشل التحديث', 'حدث خطأ أثناء محاولة تغيير حالة الرؤية.');
        }
    };

    const handleDelete = async (id: string) => {
        showDialog('danger', 'تأكيد الحذف', 'هل أنت متأكد من حذف هذا الانطباع نهائياً؟', async () => {
            try {
                const batch = writeBatch(db);
                const likesSnap = await getDocs(collection(db, "testimonial_likes", id, "testimonial_likes"));
                likesSnap.forEach((doc) => batch.delete(doc.ref));
                batch.delete(doc(db, "testimonials", "global", "testimonials", id));
                await batch.commit();
                showDialog('success', 'تم الحذف', 'تم حذف الانطباع وكافة التفاعلات المرتبطة به بنجاح.');
            } catch (e) {
                console.error(e);
                showDialog('danger', 'فشل الحذف', 'حدث خطأ أثناء محاولة حذف الانطباع.');
            }
        });
    };

    const openEdit = (testimonial: Testimonial) => {
        setCurrentTestimonial(testimonial);
        setEditedContent(testimonial.content);
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentTestimonial) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "testimonials", "global", "testimonials", currentTestimonial.id), {
                content: editedContent,
                updatedAt: Timestamp.now()
            });
            setIsEditModalOpen(false);
            showDialog('success', 'تم الحفظ', 'تم تحديث نص الانطباع بنجاح.');
        } catch (e) {
            console.error(e);
            showDialog('danger', 'فشل الحفظ', 'حدث خطأ أثناء تحديث البيانات.');
        } finally {
            setSaving(false);
        }
    };

    const openLikesModal = async (testimonial: Testimonial) => {
        setCurrentTestimonial(testimonial);
        setIsLikesModalOpen(true);
        setLoadingLikes(true);
        try {
            const likesSnap = await getDocs(collection(db, "testimonial_likes", testimonial.id, "testimonial_likes"));
            const uids = likesSnap.docs.map(doc => doc.data().userId);
            
            if (uids.length === 0) {
                setLikedByUsers([]);
                return;
            }

            const userPromises = uids.map(uid => getDoc(doc(db, "users", uid)));
            const userSnaps = await Promise.all(userPromises);
            const users = userSnaps
                .filter(snap => snap.exists())
                .map(snap => ({ uid: snap.id, ...snap.data() }));
            setLikedByUsers(users);
        } catch (e) {
            console.error("Error fetching liked users:", e);
        } finally {
            setLoadingLikes(false);
        }
    };

    const handleRemoveLike = async (userUid: string) => {
        if (!currentTestimonial) return;
        try {
            await deleteDoc(doc(db, "testimonial_likes", currentTestimonial.id, "testimonial_likes", userUid));
            await updateDoc(doc(db, "testimonials", "global", "testimonials", currentTestimonial.id), {
                likesCount: increment(-1)
            });
            setLikedByUsers(prev => prev.filter(u => u.uid !== userUid));
        } catch (e) {
            console.error("Error removing like:", e);
        }
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-8 pb-40 px-4 max-w-7xl mx-auto text-arabic">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden card-shine">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-[1rem] flex items-center justify-center border border-pink-500/20 shadow-inner">
                        <Heart className="w-6 h-6 text-pink-500 fill-current" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-elite-gradient">صدى المحبة</h1>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium opacity-70 italic">إدارة وتدقيق انطباعات وتفاعلات الطلاب حول المنصة</p>
                    </div>
                </div>

                <div className="relative group min-w-[300px] z-10">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                    <input
                        type="text"
                        placeholder="بحث في محتوى الانطباعات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-6 pr-12 py-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-bold text-sm"
                    />
                </div>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filtered.map((t, index) => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="relative p-0 overflow-hidden group hover:border-primary/40 transition-all flex flex-col h-full bg-white/5 card-shine rounded-[1.5rem] border-white/10">
                                {/* Status Badge */}
                                <div className={cn(
                                    "absolute top-0 right-0 px-4 py-1.5 text-[8px] font-black rounded-bl-[1.2rem] uppercase tracking-widest shadow-lg z-20",
                                    t.isVisible ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-500 text-white shadow-slate-500/20'
                                )}>
                                    {t.isVisible ? 'ظاهر' : 'مخفي'}
                                </div>

                                <div className="p-6 md:p-8 space-y-4 flex flex-col h-full relative z-10">
                                    {/* Student Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden shadow-inner border border-white/10 group-hover:scale-105 transition-transform flex-shrink-0">
                                            {t.studentPhoto ? (
                                                <img src={t.studentPhoto} alt={t.studentName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-white/5">
                                                    <User className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-black text-base truncate tracking-tight">{t.studentName || "مجهول"}</h3>
                                            <p className="text-[8px] text-muted-foreground/50 font-black uppercase tracking-[0.2em] truncate opacity-60">STU-{t.studentId?.slice(-6) || "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="relative flex-1 group/quote">
                                        <Quote className="absolute -top-3 -right-1 w-8 h-8 text-primary/5 -z-0 group-hover/quote:text-primary/10 transition-colors" />
                                        <div className="text-xs leading-[1.6] text-muted-foreground/90 bg-white/5 backdrop-blur-sm p-4 md:p-5 rounded-[1.2rem] min-h-[120px] relative z-10 border border-white/5 italic font-medium">
                                            "{t.content}"
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-3">
                                        <button 
                                            onClick={() => openLikesModal(t)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/5 text-[10px] font-black text-pink-500 hover:bg-pink-500/10 transition-all active:scale-95 border border-pink-500/10 shadow-lg shadow-pink-500/5"
                                        >
                                            <Heart className={cn("w-3.5 h-3.5", t.likesCount ? 'fill-current' : '')} />
                                            <span>{t.likesCount || 0} مؤيد</span>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => toggleVisibility(t.id, t.isVisible)}
                                                className={cn(
                                                    "p-2.5 rounded-lg transition-all hover:scale-110 shadow-xl active:scale-90",
                                                    t.isVisible ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-orange-500/5' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/5'
                                                )}
                                                title={t.isVisible ? 'إخفاء' : 'إظهار'}
                                            >
                                                {t.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => openEdit(t)}
                                                className="p-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl hover:scale-110 shadow-xl shadow-blue-500/5 transition-all active:scale-90"
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:scale-110 shadow-xl shadow-red-500/5 transition-all active:scale-90"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && !loading && (
                <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10 backdrop-blur-md">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground font-black text-xl opacity-40">لا توجد انطباعات حالياً تطابق بحثك</p>
                </div>
            )}

            {/* Edit Modal */}
            <EliteModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="تعديل مشاعر الطالب"
                description="قم بتدقيق النص وتصحيح الأخطاء اللغوية لضمان جودة المحتوى المنشور"
                maxWidth="lg"
                footer={(
                    <>
                        <button 
                            type="button"
                            onClick={() => setIsEditModalOpen(false)} 
                            className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-black transition-all text-sm"
                        >
                            إلغاء
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 btn-elite text-sm"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                            <span>حفظ التعديلات</span>
                        </button>
                    </>
                )}
            >
                <div className="p-2">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">نص الانطباع</label>
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-48 p-6 rounded-[2rem] border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all resize-none font-bold text-base leading-relaxed"
                            placeholder="اكتب هنا..."
                        />
                    </div>
                </div>
            </EliteModal>

            {/* Liked By Modal */}
            <EliteModal
                isOpen={isLikesModalOpen}
                onClose={() => setIsLikesModalOpen(false)}
                title="المؤيدون لهذه الخاطرة"
                description="قائمة الطلاب الذين تفاعلوا بالإعجاب مع هذا المحتوى"
                maxWidth="md"
                footer={(
                    <button
                        onClick={() => setIsLikesModalOpen(false)}
                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-black hover:bg-white/10 transition-all text-sm"
                    >
                        إغلاق القائمة
                    </button>
                )}
            >
                <div>
                    {loadingLikes ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {likedByUsers.length === 0 ? (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-40 font-black text-sm uppercase tracking-widest">لا يوجد متفاعلون حتى الآن</div>
                            ) : (
                                likedByUsers.map(u => (
                                    <div key={u.uid} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-white/20 transition-all group card-shine">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                                                {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : u.displayName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm tracking-tight">{u.displayName}</p>
                                                <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest">العضو النشط</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveLike(u.uid)}
                                            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                            title="إلغاء التأييد"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </EliteModal>

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
                confirmText={dialogConfig.onConfirm ? "نعم، متأكد" : "حسناً"}
            />
        </div>
    );
}
