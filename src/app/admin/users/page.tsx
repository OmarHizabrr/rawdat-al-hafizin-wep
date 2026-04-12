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
    deleteDoc,
    writeBatch,
    getDocs
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { EliteModal } from "@/components/ui/EliteModal";
import {
    Search,
    Edit,
    Trash2,
    Ban,
    CheckCircle,
    Shield,
    User,
    Users,
    GraduationCap,
    Loader2,
    X,
    UserCheck,
    ShieldCheck,
    Lock,
    UserX,
    Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    role: 'admin' | 'teacher' | 'student' | 'committee' | 'applicant';
    isActive?: boolean;
    photoURL?: string;
    adminNotes?: string;
    groupId?: string;
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
            case 'admin': return { label: 'مسؤول نظام', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldCheck };
            case 'teacher': return { label: 'هيئة تعليمية', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: GraduationCap };
            case 'student': return { label: 'طالب العلم', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: UserCheck };
            case 'committee': return { label: 'لجنة علمية', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Lock };
            default: return { label: role, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: User };
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
                isActive: editForm.isActive,
                adminNotes: editForm.adminNotes || "",
                groupId: editForm.groupId || ""
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
        showDialog('danger', 'حذف المستخدم', `هل أنت متأكد من حذف ${user.displayName}؟ هذا الإجراء نهائي وسيمسح كافة سجلاته ونقاطه وأوسمته.`, async () => {
            try {
                const batch = writeBatch(db);
                const uid = user.id;

                const logsSnap = await getDocs(collection(db, "daily_logs", uid, "daily_logs"));
                logsSnap.forEach((doc) => batch.delete(doc.ref));

                const pointsSnap = await getDocs(collection(db, "points_logs", uid, "points_logs"));
                pointsSnap.forEach((doc) => batch.delete(doc.ref));

                const badgesSnap = await getDocs(collection(db, "badges", uid, "badges"));
                badgesSnap.forEach((doc) => batch.delete(doc.ref));

                const recordsSnap = await getDocs(collection(db, "student_records", uid, "student_records"));
                recordsSnap.forEach((doc) => batch.delete(doc.ref));

                const certsSnap = await getDocs(collection(db, "certificates", uid, "certificates"));
                certsSnap.forEach((doc) => batch.delete(doc.ref));

                const progressSnap = await getDocs(collection(db, "volume_progress", uid, "volume_progress"));
                progressSnap.forEach((doc) => batch.delete(doc.ref));

                batch.delete(doc(db, "users", uid));

                await batch.commit();
                showDialog('success', 'تم الحذف', `تم حذف المستخدم ${user.displayName} وكافة سجلاته بنجاح.`);
            } catch (error) {
                console.error("Error deleting user:", error);
                showDialog('danger', 'فشل الحذف', 'حدث خطأ أثناء محاولة حذف المستخدم.');
            }
        });
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-12 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden card-shine">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-[1rem] flex items-center justify-center border border-primary/20 shadow-inner">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-elite-gradient">أركان المسيرة</h1>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium opacity-70 italic">التحكم الكامل في حسابات وصلاحيات المسجلين بالنظام</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 relative z-10">
                    <div className="relative group min-w-[280px]">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-6 pr-12 py-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-bold text-sm"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-6 py-4 rounded-2xl border border-white/10 bg-white/5 outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-sm pr-10 appearance-none bg-slate-900"
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
            <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user, index) => {
                        const roleInfo = getRoleInfo(user.role);
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <GlassCard className="p-0 overflow-hidden group hover:border-primary/40 transition-all duration-500 border-white/5 card-shine rounded-[1.2rem]">
                                    <div className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                        {/* Avatar with Status Ring */}
                                        <div className="relative p-1 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl shrink-0 group-hover:scale-110 transition-transform duration-700">
                                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-primary font-black text-xl md:text-2xl overflow-hidden shadow-inner border border-white/10 relative">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    (user.displayName?.[0] || "?").toUpperCase()
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            </div>
                                            <div className={`absolute -bottom-1 -left-1 w-6 h-6 rounded-xl border-2 border-slate-900 ${user.isActive === false ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'} z-10 flex items-center justify-center`}>
                                                {user.isActive === false ? <X className="w-2.5 h-2.5 text-white" /> : <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                        </div>

                                        {/* User Main Info */}
                                        <div className="flex-1 text-center md:text-right">
                                            <div className="flex flex-col md:flex-row items-center gap-3">
                                                <h3 className="font-black text-lg tracking-tighter">{user.displayName || "عضو غير مسمى"}</h3>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shadow-lg flex items-center gap-1.5",
                                                    roleInfo.bg, roleInfo.color, roleInfo.border
                                                )}>
                                                    <roleInfo.icon className="w-2.5 h-2.5" />
                                                    {roleInfo.label}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 mt-3 text-[10px] font-bold text-muted-foreground/60">
                                                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-primary/30 transition-colors">
                                                    <Shield className="w-3.5 h-3.5 text-primary opacity-60" /> 
                                                    {user.email}
                                                </span>
                                                {user.phoneNumber && (
                                                    <span className="flex items-center gap-2 dir-ltr bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-primary/30 transition-colors">
                                                        <User className="w-3.5 h-3.5 text-primary opacity-60" /> 
                                                        {user.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="w-10 h-10 flex items-center justify-center bg-blue-500/10 rounded-xl text-blue-500 transition-all hover:bg-blue-500 hover:text-white border border-blue-500/20 active:scale-90"
                                                title="تعديل"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                className={cn(
                                                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all border active:scale-90",
                                                    user.isActive === false 
                                                        ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white' 
                                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white'
                                                )}
                                                title={user.isActive === false ? "تفعيل" : "حظر"}
                                            >
                                                {user.isActive === false ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                            </button>
                                            <div className="w-px h-8 bg-white/10 mx-1" />
                                            <button
                                                onClick={() => confirmDelete(user)}
                                                className="w-10 h-10 flex items-center justify-center bg-red-500/10 rounded-xl text-red-500 transition-all hover:bg-red-500 hover:text-white border border-red-500/20 active:scale-90"
                                                title="حذف"
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
                        className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10"
                    >
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-xl font-black text-muted-foreground">لم يتم العثور على أي أركان تطابق بحثك</p>
                    </motion.div>
                )}
            </div>

            <EliteModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="تعديل بيانات العضو"
                description="تعديل المعلومات الأساسية والصلاحيات الممنوحة للعضو في النظام"
                maxWidth="lg"
                footer={(
                    <>
                        <button 
                            type="button"
                            onClick={() => setIsEditOpen(false)} 
                            className="flex-1 py-4 hover:bg-white/10 rounded-2xl font-black transition-all text-sm"
                        >
                            إلغاء الأمر
                        </button>
                        <button 
                            onClick={handleSaveUser}
                            disabled={saving}
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 btn-elite text-sm"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                            <span>حفظ التعديلات</span>
                        </button>
                    </>
                )}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                                <Users className="w-3 h-3 text-primary opacity-50" /> الاسم الكامل
                            </label>
                            <input
                                required
                                type="text"
                                value={editForm.displayName || ""}
                                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-black text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                                <Shield className="w-3 h-3 text-primary opacity-50" /> الرتبة / الصلاحية
                            </label>
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-black text-sm appearance-none bg-slate-900"
                            >
                                <option value="student">طالب العلم</option>
                                <option value="teacher">هيئة تعليمية</option>
                                <option value="committee">لجنة علمية</option>
                                <option value="admin">مسؤول نظام (أدمن)</option>
                                <option value="applicant">متقدم جديد</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">رقم الهاتف</label>
                            <input
                                type="tel"
                                value={editForm.phoneNumber || ""}
                                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-black text-sm ltr text-right"
                                placeholder="+967..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">كود الحلقة</label>
                            <input
                                type="text"
                                value={editForm.groupId || ""}
                                onChange={(e) => setEditForm({ ...editForm, groupId: e.target.value })}
                                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all font-black text-sm"
                                placeholder="معرف الحلقة"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">ملاحظات إدارية</label>
                        <textarea
                            value={editForm.adminNotes || ""}
                            onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                            className="w-full h-32 p-5 rounded-3xl border border-white/10 bg-white/5 focus:ring-8 focus:ring-primary/5 outline-none transition-all resize-none font-bold text-sm"
                            placeholder="سجل أي ملاحظات خاصة بهذا العضو بمتابعة دقيقة..."
                        />
                    </div>

                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-base font-black">حالة الحساب</h4>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">تحكم في وصول العضو للنظام</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-3 border shadow-2xl",
                                editForm.isActive !== false 
                                    ? "bg-green-500 text-white border-green-500/50 shadow-green-500/20" 
                                    : "bg-red-500 text-white border-red-500/50 shadow-red-500/20"
                            )}
                        >
                            {editForm.isActive !== false ? <ShieldCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            {editForm.isActive !== false ? "حساب نشط" : "حساب معطل"}
                        </button>
                    </div>
                </form>
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
