"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    limit,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Search,
    UserPlus,
    UserX,
    ArrowRight,
    Users,
    Loader2,
    Shield,
    GraduationCap,
    CheckCircle2,
    Briefcase,
    User,
    CheckSquare,
    Square,
    ChevronDown,
    ShieldAlert,
    UserCog
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EliteDialog } from "@/components/ui/EliteDialog";

interface MemberModel {
    id: string; // userId
    displayName: string;
    email: string;
    photoURL?: string;
    role: string;
    addedAt: any;
}

interface UserSummary {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role: string;
}

interface GroupMembersManagerProps {
    groupId: string;
    groupType: 'course' | 'halaqa';
    backUrl: string;
}

export function GroupMembersManager({ groupId, groupType, backUrl }: GroupMembersManagerProps) {
    const [groupName, setGroupName] = useState("");
    const [members, setMembers] = useState<MemberModel[]>([]);
    const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchRole, setSearchRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    
    // Multi-selection state
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        type: 'danger' | 'warning' | 'info' | 'success';
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        onConfirm: () => {}
    });

    // 1. Fetch Group Info & Current Members
    useEffect(() => {
        if (!groupId) return;

        const collectionName = groupType === 'course' ? 'courses' : 'groups';
        
        const fetchGroup = async () => {
            const snap = await getDoc(doc(db, collectionName, groupId));
            if (snap.exists()) {
                const data = snap.data();
                setGroupName(data.title || data.name || "مجموعة بدون اسم");
            }
        };
        fetchGroup();

        const unsubscribe = onSnapshot(collection(db, "members", groupId, "members"), (snapshot) => {
            const membersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MemberModel[];
            setMembers(membersData);
            setLoadingMembers(false);
        });

        return () => unsubscribe();
    }, [groupId, groupType]);

    // 2. Fetch Available Users based on role (Auto-fetch)
    useEffect(() => {
        const fetchAvailable = async () => {
            setLoadingAvailable(true);
            try {
                const q = query(
                    collection(db, "users"),
                    where("role", "==", searchRole),
                    limit(100)
                );
                const snap = await getDocs(q);
                const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserSummary));
                setAvailableUsers(users);
            } catch (error) {
                console.error("Error fetching available users:", error);
            } finally {
                setLoadingAvailable(false);
            }
        };
        fetchAvailable();
        setSelectedUserIds(new Set());
    }, [searchRole]);

    // 3. Candidates Filter
    const candidates = useMemo(() => {
        const memberIds = new Set(members.map(m => m.id));
        return availableUsers.filter(u => {
            const isNotMember = !memberIds.has(u.id);
            const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                u.email?.toLowerCase().includes(searchTerm.toLowerCase());
            return isNotMember && matchesSearch;
        });
    }, [availableUsers, members, searchTerm]);

    const toggleSelect = (userId: string) => {
        const next = new Set(selectedUserIds);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        setSelectedUserIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.size === candidates.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(candidates.map(u => u.id)));
        }
    };

    const addSelectedMembers = async () => {
        if (selectedUserIds.size === 0) return;
        setBulkLoading(true);
        try {
            const batch = writeBatch(db);
            const usersToAdd = candidates.filter(u => selectedUserIds.has(u.id));
            
            usersToAdd.forEach(user => {
                const memberRef = doc(db, "members", groupId, "members", user.id);
                batch.set(memberRef, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL || "",
                    role: user.role, // Initial role set from their global role
                    addedAt: serverTimestamp()
                });
            });
            
            await batch.commit();
            setSelectedUserIds(new Set());
            setSearchTerm("");
        } catch (error) {
            console.error("Bulk add error:", error);
            alert("حدث خطأ أثناء الإضافة الجماعية");
        } finally {
            setBulkLoading(false);
        }
    };

    const updateMemberRole = async (userId: string, newRole: string) => {
        setActionLoading(userId);
        try {
            await updateDoc(doc(db, "members", groupId, "members", userId), {
                role: newRole
            });
            setDialogConfig({ ...dialogConfig, isOpen: false });
        } catch (error) {
            console.error("Error updating role:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const confirmRemoveMember = (member: MemberModel) => {
        setDialogConfig({
            isOpen: true,
            type: 'danger',
            title: "إزالة عضو",
            description: `هل أنت متأكد من إزالة ${member.displayName} من هذه المجموعة؟ لن تظهر بياناته هنا مجدداً.`,
            onConfirm: async () => {
                setActionLoading(member.id);
                try {
                    await deleteDoc(doc(db, "members", groupId, "members", member.id));
                    setDialogConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Delete error:", error);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const confirmChangeRole = (member: MemberModel, newRole: string) => {
        const labels: any = { admin: 'مشرف مجموعة', teacher: 'معلم مجموعة', student: 'طالب' };
        setDialogConfig({
            isOpen: true,
            type: 'warning',
            title: "تغيير صلاحية",
            description: `هل تريد تغيير دور ${member.displayName} داخل هذه المجموعة إلى "${labels[newRole]}"؟ لن يتأثر حسابه العام بهذا الإجراء.`,
            onConfirm: () => updateMemberRole(member.id, newRole)
        });
    };

    const staffMembers = members.filter(m => m.role === 'teacher' || m.role === 'admin');
    const studentMembers = members.filter(m => m.role === 'student');

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
            case 'teacher': return <GraduationCap className="w-4 h-4 text-blue-500" />;
            case 'student': return <User className="w-4 h-4 text-green-500" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'مشرف';
            case 'teacher': return 'معلم';
            case 'student': return 'طالب';
            default: return role;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={backUrl} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowRight className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{groupName || "جاري التحميل..."}</h1>
                    <p className="text-muted-foreground">إدارة أعضاء {groupType === 'course' ? 'الدورة' : 'الحلقة'}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Candidates Section */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="p-6 relative">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                إضافة أعضاء
                            </h2>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">
                                {candidates.length} متاح
                            </span>
                        </div>

                        {/* Role Tabs */}
                        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-4">
                            {(['student', 'teacher', 'admin'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSearchRole(role)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        searchRole === role 
                                            ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {getRoleLabel(role)}
                                </button>
                            ))}
                        </div>
                        
                        <div className="relative mb-4">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={`فلترة القائمة...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                            />
                        </div>

                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 mb-6">
                            <div className="flex items-center justify-between px-3 py-2 text-xs border-b border-gray-100 dark:border-white/5 mb-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                    {selectedUserIds.size === candidates.length && candidates.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                                    <span>تحديد الكل</span>
                                </button>
                                <span>{selectedUserIds.size} مختار</span>
                            </div>

                            {loadingAvailable ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin opacity-20" /></div>
                            ) : candidates.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => toggleSelect(user.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                                        selectedUserIds.has(user.id) ? 'bg-primary/5 border-primary ring-1 ring-primary/20' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-primary/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                                            selectedUserIds.has(user.id) ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                                        }`}>
                                            {selectedUserIds.has(user.id) ? <CheckSquare className="w-5 h-5" /> : (user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : (user.displayName?.[0] || "?").toUpperCase())}
                                        </div>
                                        <div className="text-right min-w-0">
                                            <p className="text-sm font-bold truncate">{user.displayName}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    {!selectedUserIds.has(user.id) && <Square className="w-4 h-4 text-gray-300 dark:text-white/10" />}
                                </button>
                            ))}
                        </div>

                        <div className="sticky bottom-0 bg-background pt-4 border-t">
                            <button
                                onClick={addSelectedMembers}
                                disabled={selectedUserIds.size === 0 || bulkLoading}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40"
                            >
                                {bulkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                <span>إضافة {selectedUserIds.size > 0 ? `(${selectedUserIds.size}) أعضاء` : "المحددين"}</span>
                            </button>
                        </div>
                    </GlassCard>
                </div>

                {/* Right: Members List Sections */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Staff Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-blue-500" />
                                الهيئة التعليمية والإدارية ({staffMembers.length})
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {staffMembers.map(member => (
                                <MemberCard 
                                    key={member.id} 
                                    member={member} 
                                    onRemove={() => confirmRemoveMember(member)} 
                                    onChangeRole={(r) => confirmChangeRole(member, r)}
                                    loading={actionLoading === member.id}
                                    icon={getRoleIcon(member.role)}
                                    label={getRoleLabel(member.role)}
                                />
                            ))}
                            {!loadingMembers && staffMembers.length === 0 && (
                                <p className="col-span-full py-6 text-center text-sm text-muted-foreground border border-dashed rounded-2xl">
                                    لا يوجد معلمون أو مشرفون مضافون بعد.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Students Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-6 h-6 text-green-500" />
                                الطلاب المنضمون ({studentMembers.length})
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {studentMembers.map(member => (
                                <MemberCard 
                                    key={member.id} 
                                    member={member} 
                                    onRemove={() => confirmRemoveMember(member)} 
                                    onChangeRole={(r) => confirmChangeRole(member, r)}
                                    loading={actionLoading === member.id}
                                    label="طالب"
                                />
                            ))}
                            {!loadingMembers && studentMembers.length === 0 && (
                                <p className="col-span-full py-6 text-center text-sm text-muted-foreground border border-dashed rounded-2xl">
                                    لا يوجد طلاب مضافون بعد.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Elite Dialog */}
            <EliteDialog 
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
                onConfirm={dialogConfig.onConfirm}
                title={dialogConfig.title}
                description={dialogConfig.description}
                type={dialogConfig.type}
                loading={actionLoading !== null}
            />
        </div>
    );
}

function MemberCard({ member, onRemove, onChangeRole, loading, icon, label }: { 
    member: MemberModel, 
    onRemove: () => void, 
    onChangeRole: (role: string) => void,
    loading: boolean,
    icon?: React.ReactNode,
    label: string 
}) {
    const [showActions, setShowActions] = useState(false);

    return (
        <GlassCard className="p-4 flex flex-col gap-4 group">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg relative">
                    {member.photoURL ? <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : (member.displayName?.[0] || "?").toUpperCase()}
                    {icon && <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-white/10">{icon}</div>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{member.displayName}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-muted-foreground border border-gray-200 dark:border-white/10">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                
                {/* Independent Role Management Menu */}
                <div className="relative">
                    <button 
                        onClick={() => setShowActions(!showActions)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-muted-foreground transition-all"
                    >
                        <UserCog className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowActions(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute left-0 top-full mt-2 w-48 bg-background border rounded-2xl shadow-xl z-30 overflow-hidden"
                                >
                                    <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground bg-gray-50 dark:bg-white/5 border-b uppercase tracking-wider">تغيير الصلاحية داخل المجموعة</p>
                                    <button onClick={() => { onChangeRole('admin'); setShowActions(false); }} className="w-full text-right px-4 py-2.5 text-xs hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                                        <Shield className="w-3 h-3 text-red-500" /> جعل مشرف مجموعة
                                    </button>
                                    <button onClick={() => { onChangeRole('teacher'); setShowActions(false); }} className="w-full text-right px-4 py-2.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2 transition-colors">
                                        <GraduationCap className="w-3 h-3 text-blue-500" /> جعل معلم للمجموعة
                                    </button>
                                    <button onClick={() => { onChangeRole('student'); setShowActions(false); }} className="w-full text-right px-4 py-2.5 text-xs hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center gap-2 transition-colors">
                                        <User className="w-3 h-3 text-green-500" /> جعل طالب (عضو عادي)
                                    </button>
                                    <div className="border-t mt-1" />
                                    <button onClick={() => { onRemove(); setShowActions(false); }} className="w-full text-right px-4 py-3 text-xs text-red-500 hover:bg-red-500/5 flex items-center gap-2 font-bold transition-colors">
                                        <UserX className="w-3 h-3" /> إزالة من المجموعة
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </GlassCard>
    );
}

