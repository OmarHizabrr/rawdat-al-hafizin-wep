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
    arrayRemove
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
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
    Quote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface Testimonial {
    id: string;
    studentName: string;
    studentId: string;
    studentPhoto?: string;
    content: string;
    isVisible: boolean;
    createdAt?: any;
    likes?: string[];
}

export default function TestimonialsDashboard() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState<Testimonial | null>(null);
    const [editedContent, setEditedContent] = useState("");
    const [saving, setSaving] = useState(false);

    // Likes Modal State
    const [likesModalOpen, setLikesModalOpen] = useState(false);
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
        const unsubscribe = onSnapshot(collection(db, "testimonials"), (snapshot) => {
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
            await updateDoc(doc(db, "testimonials", id), {
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
                await deleteDoc(doc(db, "testimonials", id));
            } catch (e) {
                console.error(e);
                showDialog('danger', 'فشل الحذف', 'حدث خطأ أثناء محاولة حذف الانطباع.');
            }
        });
    };

    const openEdit = (testimonial: Testimonial) => {
        setCurrentTestimonial(testimonial);
        setEditedContent(testimonial.content);
        setEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentTestimonial) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "testimonials", currentTestimonial.id), {
                content: editedContent
            });
            setEditModalOpen(false);
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
        setLikesModalOpen(true);
        if (!testimonial.likes || testimonial.likes.length === 0) {
            setLikedByUsers([]);
            return;
        }

        setLoadingLikes(true);
        try {
            const userPromises = testimonial.likes.map(uid => getDoc(doc(db, "users", uid)));
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
            await updateDoc(doc(db, "testimonials", currentTestimonial.id), {
                likes: arrayRemove(userUid)
            });
            setLikedByUsers(prev => prev.filter(u => u.uid !== userUid));
        } catch (e) {
            console.error("Error removing like:", e);
        }
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-8 pb-20 px-4 max-w-7xl mx-auto">
            {/* Header section with Motion */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-xl backdrop-blur-md"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-500/10 rounded-xl">
                            <Heart className="w-6 h-6 text-pink-500 fill-current" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">مشاعر الطلاب</h1>
                    </div>
                    <p className="text-muted-foreground">إدارة وتدقيق انطباعات وتفاعلات الطلاب حول المنصة.</p>
                </div>

                <div className="relative group min-w-[300px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="ابحث في محتوى المشاعر..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-6 pr-12 py-4 rounded-2xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
            </motion.div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filtered.map((t, index) => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="relative p-0 overflow-hidden group hover:border-primary/40 transition-all flex flex-col h-full bg-white/5 dark:bg-black/20">
                                {/* Status Badge */}
                                <div className={`absolute top-0 left-0 px-4 py-1.5 text-[10px] font-bold rounded-br-2xl uppercase tracking-widest shadow-lg z-10 ${t.isVisible ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                                    {t.isVisible ? 'ظاهر للعامة' : 'مخفي حالياً'}
                                </div>

                                <div className="p-8 space-y-6 flex flex-col h-full">
                                    {/* Student Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/10 overflow-hidden shadow-inner border border-white/10 flex-shrink-0">
                                            {t.studentPhoto ? (
                                                <img src={t.studentPhoto} alt={t.studentName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <User className="w-7 h-7" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-bold text-lg truncate">{t.studentName || "مجهول"}</h3>
                                            <p className="text-xs text-muted-foreground/60 font-mono tracking-tighter truncate">{t.studentId || "Student #ID"}</p>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="relative flex-1">
                                        <Quote className="absolute -top-4 -right-2 w-8 h-8 text-primary/10 -z-0" />
                                        <p className="text-sm leading-relaxed text-muted-foreground/90 bg-white/5 dark:bg-black/30 p-5 rounded-2xl min-h-[120px] relative z-10 border border-white/5 italic">
                                            "{t.content}"
                                        </p>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <button 
                                            onClick={() => openLikesModal(t)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                        >
                                            <Heart className={`w-4 h-4 ${t.likes?.length ? 'fill-current' : ''}`} />
                                            <span>{t.likes?.length || 0} مؤيد</span>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleVisibility(t.id, t.isVisible)}
                                                className={`p-2.5 rounded-xl transition-all hover:scale-110 shadow-sm ${t.isVisible ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}
                                                title={t.isVisible ? 'إخفاء' : 'إظهار'}
                                            >
                                                {t.isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => openEdit(t)}
                                                className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:scale-110 transition-all shadow-sm"
                                                title="تعديل النص"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:scale-110 transition-all shadow-sm"
                                                title="حذف نهائي"
                                            >
                                                <Trash2 className="w-5 h-5" />
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
                <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                    <MessageSquare className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد انطباعات حالياً تطابق بحثك.</p>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <Edit className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">تعديل مشاعر الطالب</h2>
                                        <p className="text-xs text-muted-foreground">قم بتدقيق النص وتصحيح الأخطاء قبل النشر</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full h-40 p-5 rounded-3xl border bg-gray-50 dark:bg-black/30 outline-none focus:ring-4 focus:ring-primary/10 resize-none transition-all leading-relaxed"
                                    placeholder="نص الانطباع هنا..."
                                />

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setEditModalOpen(false)}
                                        className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-bold transition-all"
                                    >
                                        إغلاق
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        حفظ التعديلات
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Liked By Modal */}
            <AnimatePresence>
                {likesModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setLikesModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-red-500/5">
                                <div className="flex items-center gap-3">
                                    <Heart className="w-6 h-6 text-red-500 fill-current" />
                                    <h2 className="text-xl font-bold">المؤيدون لهذه الخاطرة</h2>
                                </div>
                                <button onClick={() => setLikesModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-8">
                                {loadingLikes ? (
                                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                                ) : (
                                    <div className="max-h-[350px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                        {likedByUsers.length === 0 ? (
                                            <div className="text-center py-10 opacity-40">لا يوجد متفاعلون حتى الآن.</div>
                                        ) : (
                                            likedByUsers.map(u => (
                                                <div key={u.uid} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border border-white/10 flex items-center justify-center font-bold">
                                                            {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : u.displayName?.[0]}
                                                        </div>
                                                        <p className="font-bold text-sm tracking-wide">{u.displayName}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveLike(u.uid)}
                                                        className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                        title="إلغاء التأييد"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => setLikesModalOpen(false)}
                                    className="w-full mt-8 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                >
                                    إغلاق القائمة
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
