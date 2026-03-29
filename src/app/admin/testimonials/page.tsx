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
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا الانطباع؟")) {
            try {
                await deleteDoc(doc(db, "testimonials", id));
            } catch (e) {
                console.error(e);
            }
        }
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
        } catch (e) {
            console.error(e);
            alert("فشل التحديث");
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
            // Update local state
            setLikedByUsers(prev => prev.filter(u => u.uid !== userUid));
        } catch (e) {
            console.error("Error removing like:", e);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold">مشاعر الطلاب</h1>
                <p className="text-muted-foreground">إدارة انطباعات الطلاب وتفاعلاتهم</p>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="بحث في الانطباعات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(t => (
                    <GlassCard key={t.id} className="relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 px-3 py-1 text-xs font-bold rounded-br-xl ${t.isVisible ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {t.isVisible ? 'ظاهر' : 'مخفي'}
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                    {t.studentPhoto ? (
                                        <img src={t.studentPhoto} alt={t.studentName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <User className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{t.studentName || "مجهول"}</h3>
                                    <p className="text-xs text-muted-foreground">{t.studentId || "---"}</p>
                                </div>
                            </div>

                            <p className="text-sm bg-gray-50 dark:bg-white/5 p-3 rounded-xl min-h-[80px]">
                                {t.content}
                            </p>

                            <div className="flex items-center justify-between pt-2">
                                <button 
                                    onClick={() => openLikesModal(t)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Heart className="w-3 h-3 text-red-500" />
                                    <span>{t.likes?.length || 0} تأييد</span>
                                </button>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => toggleVisibility(t.id, t.isVisible)}
                                        className={`p-2 rounded-lg transition-colors ${t.isVisible ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                                        title={t.isVisible ? 'إخفاء' : 'إظهار'}
                                    >
                                        {t.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => openEdit(t)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="تعديل"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        لا توجد انطباعات حالياً.
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">تعديل الانطباع</h2>
                                <button onClick={() => setEditModalOpen(false)}><X className="w-5 h-5" /></button>
                            </div>

                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full h-32 p-3 rounded-xl border bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
                                placeholder="نص الانطباع..."
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    حفظ
                                </button>
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
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                                    المؤيدون لهذه الخاطرة
                                </h2>
                                <button onClick={() => setLikesModalOpen(false)}><X className="w-5 h-5" /></button>
                            </div>

                            {loadingLikes ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                            ) : (
                                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                                    {likedByUsers.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-10">لا يوجد متفاعلون بعد.</p>
                                    ) : (
                                        likedByUsers.map(u => (
                                            <div key={u.uid} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden text-xs flex items-center justify-center font-bold">
                                                        {u.photoURL ? <img src={u.photoURL} alt="" /> : u.displayName?.[0]}
                                                    </div>
                                                    <p className="text-sm font-bold">{u.displayName}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveLike(u.uid)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="إزالة هذا التأييد"
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
                                className="w-full mt-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 font-bold"
                            >
                                إغلاق
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
