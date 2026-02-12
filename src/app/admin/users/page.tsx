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
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Ban,
    CheckCircle,
    Shield,
    User,
    GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("الكل");
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesRole = roleFilter === "الكل" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'teacher': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'student': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'committee': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'مسؤول';
            case 'teacher': return 'معلم';
            case 'student': return 'طالب';
            case 'committee': return 'لجنة';
            default: return role;
        }
    };

    const handleEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setEditForm({ ...user });
        setIsEditOpen(true);
    };

    const handleSaveUser = async () => {
        if (!selectedUser || !editForm) return;
        try {
            await updateDoc(doc(db, "users", selectedUser.id), {
                displayName: editForm.displayName,
                email: editForm.email,
                phoneNumber: editForm.phoneNumber,
                role: editForm.role,
                isActive: editForm.isActive
            });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("حدث خطأ أثناء التحديث");
        }
    };

    const toggleStatus = async (user: UserProfile) => {
        try {
            await updateDoc(doc(db, "users", user.id), {
                isActive: !user.isActive
            });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            await deleteDoc(doc(db, "users", selectedUser.id));
            setIsDeleteOpen(false);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("حدث خطأ أثناء الحذف");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
                    <p className="text-muted-foreground">إدارة حسابات وصلاحيات المسجلين في النظام</p>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-2 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="الكل">الكل</option>
                        <option value="admin">مشرف</option>
                        <option value="teacher">معلم</option>
                        <option value="student">طالب</option>
                        <option value="committee">لجنة</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredUsers.map((user) => (
                    <GlassCard key={user.id} className="p-4 flex flex-col md:flex-row items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                (user.displayName?.[0] || "?").toUpperCase()
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-right space-y-1">
                            <h3 className="font-bold">{user.displayName || "مستخدم بدون اسم"}</h3>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                                    {getRoleLabel(user.role)}
                                </span>
                                {user.isActive === false && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 border border-red-200">
                                        محظور
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleEdit(user)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-blue-500 transition-colors"
                                title="تعديل"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => toggleStatus(user)}
                                className={`p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors ${user.isActive === false ? 'text-green-500' : 'text-orange-500'}`}
                                title={user.isActive === false ? "تفعيل" : "حظر"}
                            >
                                {user.isActive === false ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-red-500 transition-colors"
                                title="حذف"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </GlassCard>
                ))}

                {loading && <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>}
                {!loading && filteredUsers.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">لا توجد نتائج.</p>
                )}
            </div>

            {/* Edit Dialog */}
            <AnimatePresence>
                {isEditOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b">
                                <h2 className="text-lg font-bold">تعديل بيانات المستخدم</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        value={editForm.displayName || ""}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                        className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={editForm.email || ""}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={editForm.phoneNumber || ""}
                                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5 dir-ltr text-right"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">الصلاحية</label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                        className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-white/5"
                                    >
                                        <option value="admin">مسؤول</option>
                                        <option value="teacher">معلم</option>
                                        <option value="student">طالب</option>
                                        <option value="committee">لجنة</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={editForm.isActive !== false}
                                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="isActive" className="text-sm">حساب نشط</label>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
                                <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg">إلغاء</button>
                                <button onClick={handleSaveUser} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">حفظ التعديلات</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {isDeleteOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden"
                        >
                            <div className="p-6 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-bold">تأكيد الحذف</h2>
                                <p className="text-muted-foreground">هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-white/5 flex gap-3">
                                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-4 py-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg">إلغاء</button>
                                <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">حذف</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
