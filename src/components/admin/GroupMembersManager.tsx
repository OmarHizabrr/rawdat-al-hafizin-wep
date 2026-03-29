"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs,
    limit,
    serverTimestamp
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
    User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
    const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchRole, setSearchRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch Group Info & Members
    useEffect(() => {
        if (!groupId) return;

        const collectionName = groupType === 'course' ? 'courses' : 'groups';
        
        // 1. Fetch Group Info
        const fetchGroup = async () => {
            const snap = await getDoc(doc(db, collectionName, groupId));
            if (snap.exists()) {
                const data = snap.data();
                setGroupName(data.title || data.name || "مجموعة بدون اسم");
            }
        };
        fetchGroup();

        // 2. Realtime Members from members/groupId/members/
        const unsubscribe = onSnapshot(collection(db, "members", groupId, "members"), (snapshot) => {
            const membersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MemberModel[];
            setMembers(membersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [groupId, groupType]);

    // Search Users to Add
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, searchRole]);

    const handleSearch = async () => {
        setSearching(true);
        try {
            const q = query(
                collection(db, "users"),
                where("role", "==", searchRole),
                limit(20)
            );
            
            const snap = await getDocs(q);
            const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserSummary[];
            
            const filtered = allUsers.filter(u => 
                u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            setSearchResults(filtered);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const addMember = async (user: UserSummary) => {
        if (members.some(m => m.id === user.id)) return;
        
        setActionLoading(user.id);
        try {
            await setDoc(doc(db, "members", groupId, "members", user.id), {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL || "",
                role: user.role,
                addedAt: serverTimestamp()
            });
            setSearchTerm("");
            setSearchResults([]);
        } catch (error) {
            console.error("Add member error:", error);
            alert("حدث خطأ أثناء إضافة العضو");
        } finally {
            setActionLoading(null);
        }
    };

    const removeMember = async (userId: string) => {
        if (!confirm("هل أنت متأكد من إزالة هذا العضو من المجموعة؟")) return;
        
        setActionLoading(userId);
        try {
            await deleteDoc(doc(db, "members", groupId, "members", userId));
        } catch (error) {
            console.error("Remove member error:", error);
        } finally {
            setActionLoading(null);
        }
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
                {/* Left: Search & Add Section */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-primary" />
                            إضافة عضو جديد
                        </h2>

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
                                placeholder={`ابحث عن ${getRoleLabel(searchRole)}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                            />
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {searching && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                            
                            {searchResults.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                (user.displayName?.[0] || "?").toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => addMember(user)}
                                        disabled={actionLoading === user.id || members.some(m => m.id === user.id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            members.some(m => m.id === user.id)
                                                ? 'text-green-500 bg-green-500/10'
                                                : 'text-primary hover:bg-primary/10'
                                        }`}
                                    >
                                        {actionLoading === user.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : members.some(m => m.id === user.id) ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <UserPlus className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            ))}

                            {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
                                <p className="text-center py-4 text-sm text-muted-foreground">لا توجد نتائج للبحث.</p>
                            )}
                            
                            {searchTerm.length < 2 && !searching && (
                                <div className="text-center py-8 text-muted-foreground space-y-2">
                                    <Search className="w-8 h-8 mx-auto opacity-20" />
                                    <p className="text-xs">اكتب حرفين على الأقل للبحث</p>
                                </div>
                            )}
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
                                    onRemove={removeMember} 
                                    loading={actionLoading === member.id}
                                    icon={getRoleIcon(member.role)}
                                    label={getRoleLabel(member.role)}
                                />
                            ))}
                            {!loading && staffMembers.length === 0 && (
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
                                    onRemove={removeMember} 
                                    loading={actionLoading === member.id}
                                    label="طالب"
                                />
                            ))}
                            {!loading && studentMembers.length === 0 && (
                                <p className="col-span-full py-6 text-center text-sm text-muted-foreground border border-dashed rounded-2xl">
                                    لا يوجد طلاب مضافون بعد.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MemberCard({ member, onRemove, loading, icon, label }: { 
    member: MemberModel, 
    onRemove: (id: string) => void, 
    loading: boolean,
    icon?: React.ReactNode,
    label: string 
}) {
    return (
        <GlassCard className="p-4 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg relative">
                {member.photoURL ? (
                    <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                    (member.displayName?.[0] || "?").toUpperCase()
                )}
                {icon && (
                    <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-white/10">
                        {icon}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{member.displayName}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-muted-foreground border border-gray-200 dark:border-white/10">
                        {label}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>
            <button
                onClick={() => onRemove(member.id)}
                disabled={loading}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                title="إزالة من المجموعة"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <UserX className="w-4 h-4" />
                )}
            </button>
        </GlassCard>
    );
}
