"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Search,
    Edit,
    Trash2,
    Ban,
    CheckCircle,
    Shield,
    User,
    GraduationCap,
    Loader2,
    X,
    UserCheck,
    ShieldCheck,
    Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    role: 'admin' | 'teacher' | 'student' | 'committee';
    isActive?: boolean;
    photoURL?: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("الكل");
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    
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

    // Edit Form State
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

    useEffect(() => {
        const q = query(collection(db, "users"), orderBy("displayName"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as UserProfile[];
            setUsers(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const showDialog = (type: 'success' | 'danger' | 'warning', title: string, description: string, onConfirm?: () => void) => {
        setDialogConfig({ isOpen: true, type, title, description, onConfirm });
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (user.phoneNumber?.includes(searchTerm) ?? false);
        const matchesRole = roleFilter === "الكل" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleInfo = (role: string) => {
        switch (role) {
            case 'admin': return { label: 'مسؤول', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldCheck };
            case 'teacher': return { label: 'معلم', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: GraduationCap };
            case 'student': return { label: 'طالب', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: UserCheck };
            case 'committee': return { label: 'لجنة', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Lock };
            default: return { label: role, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: User };
        }
    };

    const handleEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setEditForm({ ...user });
        setIsEditOpen(true);
    };

    const handleSaveUser = async () => {
        if (!selectedUser || !editForm) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", selectedUser.id), {
                displayName: editForm.displayName,
                email: editForm.email,
                phoneNumber: editForm.phoneNumber,
                role: editForm.role,
                isActive: editForm.isActive
            });
            setIsEditOpen(false);
            showDialog('success', 'تم التحديث', `تم تحديث بيانات ${editForm.displayName} بنجاح.`);
        } catch (error) {
            console.error("Error updating user:", error);
            showDialog('danger', 'فشل التحديث', 'حدث خطأ أثناء محاولة حفظ التغييرات.');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (user: UserProfile) => {
        const action = user.isActive === false ? 'تفعيل' : 'حظر';
        showDialog('warning', `تأكيد ${action}`, `هل أنت متأكد من ${action} حساب ${user.displayName}؟`, async () => {
            try {
                await updateDoc(doc(db, "users", user.id), {
                    isActive: !user.isActive
                });
            } catch (error) {
                console.error("Error toggling status:", error);
            }
        });
    };

    const confirmDelete = (user: UserProfile) => {
        setSelectedUser(user);
        showDialog('danger', 'حذف المستخدم', `هل أنت متأكد من حذف ${user.displayName}؟ هذا الإجراء نهائي ولا يمكن التراجع عنه.`, async () => {
            try {
                await deleteDoc(doc(db, "users", user.id));
            } catch (error) {
                console.error("Error deleting user:", error);
                showDialog('danger', 'فشل الحذف', 'حدث خطأ أثناء محاولة حذف المستخدم.');
            }
        });
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
                    <p className="text-muted-foreground mt-1">التحكم الكامل في حسابات وصلاحيات المسجلين</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم، الإيميل، أو الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-3 rounded-xl border bg-background/50 focus:ring-4 focus:ring-primary/10 outline-none w-full sm:w-72 transition-all"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-3 rounded-xl border bg-background/50 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    >
                        <option value="الكل">جميع الرتب</option>
                        <option value="admin">مسؤول نظام</option>
                        <option value="teacher">هيئة تعليمية</option>
                        <option value="student">طلاب</option>
                        <option value="committee">لجنة علمية</option>
                    </select>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user, index) => {
                        const roleInfo = getRoleInfo(user.role);
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <GlassCard className="p-0 overflow-hidden group hover:border-primary/30 transition-all">
                                    <div className="p-5 flex flex-col md:flex-row items-center gap-6">
                                        {/* Avatar with Status Ring */}
                                        <div className={`relative p-1 rounded-full border-2 ${user.isActive === false ? 'border-red-500/30' : 'border-primary/20'}`}>
                                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden shadow-inner">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    (user.displayName?.[0] || "?").toUpperCase()
                                                )}
                                            </div>
                                            <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background ${user.isActive === false ? 'bg-red-500' : 'bg-green-500'}`} />
                                        </div>

                                        {/* User Main Info */}
                                        <div className="flex-1 text-center md:text-right space-y-1">
                                            <div className="flex flex-col md:flex-row items-center gap-2">
                                                <h3 className="font-bold text-lg">{user.displayName || "مستخدم جديد"}</h3>
                                                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.bg} ${roleInfo.color} ${roleInfo.border} uppercase tracking-wider`}>
                                                    <roleInfo.icon className="w-3 h-3" />
                                                    {roleInfo.label}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground/70">
                                                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {user.email}</span>
                                                {user.phoneNumber && <span className="flex items-center gap-1 dir-ltr"><User className="w-3 h-3" /> {user.phoneNumber}</span>}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-blue-500/10 rounded-xl text-blue-500 transition-all hover:scale-110"
                                                title="تعديل المستخدم"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                className={`w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-110 ${user.isActive === false ? 'text-green-500' : 'text-orange-500'}`}
                                                title={user.isActive === false ? "تفعيل الحساب" : "حظر الحساب"}
                                            >
                                                {user.isActive === false ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                            </button>
                                            <div className="w-[1px] h-6 bg-white/10 mx-1" />
                                            <button
                                                onClick={() => confirmDelete(user)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-red-500/10 rounded-xl text-red-500 transition-all hover:scale-110"
                                                title="حذف نهائي"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredUsers.length === 0 && !loading && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10"
                    >
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground">لم يتم العثور على أي مستخدمين يطابقون بحثك.</p>
                    </motion.div>
                )}
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditOpen(false)}
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
                                        <h2 className="text-xl font-bold">تعديل بيانات المستخدم</h2>
                                        <p className="text-xs text-muted-foreground">تعديل المعلومات الأساسية والصلاحيات</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsEditOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="p-8 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">الاسم الكامل</label>
                                        <input
                                            required
                                            type="text"
                                            value={editForm.displayName || ""}
                                            onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                            className="w-full p-3 rounded-2xl border bg-gray-50 dark:bg-black/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">الرتبة / الصلاحية</label>
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                            className="w-full p-3 rounded-2xl border bg-gray-50 dark:bg-black/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                        >
                                            <option value="student">طالب</option>
                                            <option value="teacher">معلم / هيئة تعليمية</option>
                                            <option value="committee">لجنة علمية</option>
                                            <option value="admin">مسؤول نظام (أدمن)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">البريد الإلكتروني</label>
                                    <input
                                        required
                                        type="email"
                                        value={editForm.email || ""}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full p-3 rounded-2xl border bg-gray-50 dark:bg-black/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={editForm.phoneNumber || ""}
                                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        className="w-full p-3 rounded-2xl border bg-gray-50 dark:bg-black/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all dir-ltr text-right"
                                        placeholder="+967..."
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-white/10">
                                        <input
                                            type="checkbox"
                                            id="isActive-modal"
                                            checked={editForm.isActive !== false}
                                            onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                        />
                                        <span className={`h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${editForm.isActive !== false ? 'translate-x-6 bg-primary' : 'translate-x-1'}`} />
                                    </div>
                                    <label htmlFor="isActive-modal" className="text-sm font-bold">حالة الحساب: {editForm.isActive !== false ? 'نشط' : 'محظور'}</label>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditOpen(false)} 
                                        className="flex-1 py-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl font-bold transition-all"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={saving}
                                        className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                        تطبيق كافة التعديلات
                                    </button>
                                </div>
                            </form>
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
