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
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface MemberModel {
    id: string; // userId
    displayName: string;
    email: string;
    photoURL?: string;
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
            if (searchTerm.trim().length >= 3) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = async () => {
        setSearching(true);
        try {
            // Find users where role is student (or any role the admin wants to add)
            // For now, let's allow adding anyone but focus on students
            const q = query(
                collection(db, "users"),
                where("role", "==", "student"),
                limit(10)
            );
            
            const snap = await getDocs(q);
            const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserSummary[];
            
            // Filter local search for better UX if needed, or just use Firestore results
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
            // Path: members/groupId/members/userId
            await setDoc(doc(db, "members", groupId, "members", user.id), {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL || "",
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
                        
                        <div className="relative mb-4">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="ابحث عن اسم الطالب أو البريد..."
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
                                        <div>
                                            <p className="text-sm font-bold">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
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

                            {!searching && searchTerm.length >= 3 && searchResults.length === 0 && (
                                <p className="text-center py-4 text-sm text-muted-foreground">لا توجد نتائج للبحث.</p>
                            )}
                            
                            {searchTerm.length < 3 && !searching && (
                                <div className="text-center py-8 text-muted-foreground space-y-2">
                                    <Search className="w-8 h-8 mx-auto opacity-20" />
                                    <p className="text-xs">اكتب 3 أحرف على الأقل للبحث</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Right: Members List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            الأعضاء المنضمون ({members.length})
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />
                            ))
                        ) : members.map(member => (
                            <GlassCard key={member.id} className="p-4 flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {member.photoURL ? (
                                        <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        (member.displayName?.[0] || "?").toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate">{member.displayName}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                </div>
                                <button
                                    onClick={() => removeMember(member.id)}
                                    disabled={actionLoading === member.id}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                    title="إزالة من المجموعة"
                                >
                                    {actionLoading === member.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <UserX className="w-4 h-4" />
                                    )}
                                </button>
                            </GlassCard>
                        ))}

                        {!loading && members.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                    <Users className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="text-muted-foreground font-medium">لا يوجد أعضاء في هذه المجموعة بعد.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

