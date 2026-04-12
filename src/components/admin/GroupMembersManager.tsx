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
    writeBatch,
    increment,
    orderBy
} from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { PlanTemplate, PlanDay, TierTask } from "@/types/plan";
import { SUNNAH_VOLUMES } from "@/lib/volumes";
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
    UserCog,
    Award,
    BarChart3,
    X,
    Calendar,
    Plus,
    TrendingUp,
    Clock,
    LineChart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EliteDialog } from "@/components/ui/EliteDialog";
import { cn } from "@/lib/utils";

interface CourseModel {
    id: string;
    title: string;
    startDate: any;
    folderId?: string;
    selectedVolumeIds?: string[];
    planTemplateId?: string;
}

interface MemberModel {
    id: string; // userId
    displayName: string;
    email: string;
    photoURL?: string;
    role: string;
    addedAt: any;
    status?: string; // For course graduation
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

    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<MemberModel | null>(null);
    const [studentLogs, setStudentLogs] = useState<any[]>([]);
    const [studentExams, setStudentExams] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [examForm, setExamForm] = useState({ title: '', mark: '', date: new Date().toISOString().split('T')[0] });
    const [isSavingExam, setIsSavingExam] = useState(false);
    const [isLoggingDaily, setIsLoggingDaily] = useState(false);
    
    const [courseInfo, setCourseInfo] = useState<CourseModel | null>(null);
    const [todayPlan, setTodayPlan] = useState<PlanDay | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<PlanTemplate | null>(null);
    const [todayLog, setTodayLog] = useState<any>(null);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch Group Info & Current Members
    useEffect(() => {
        if (!groupId) return;

        const collectionName = groupType === 'course' ? 'courses' : 'groups';
        
        const fetchGroup = async () => {
            const snap = await getDoc(doc(db, collectionName, groupId));
            if (snap.exists()) {
                const data = snap.data();
                setGroupName(data.title || data.name || "مجموعة بدون اسم");
                if (groupType === 'course') {
                    // Fetch nested volumes too
                    const volsSnap = await getDocs(collection(db, "course_volumes", groupId, "course_volumes"));
                    const vols = volsSnap.docs.map(d => d.data().volumeId);
                    setCourseInfo({ id: snap.id, ...data, selectedVolumeIds: vols } as CourseModel);
                }
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

    const handleViewProgress = async (student: MemberModel) => {
        setSelectedStudent(student);
        setShowProgressModal(true);
        setLoadingLogs(true);
        try {
            const q = query(
                collection(db, "daily_logs", student.id, "daily_logs"),
                orderBy("date", "desc"),
                limit(14)
            );
            const snap = await getDocs(q);
            setStudentLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Exams
            const eq = query(
                collection(db, "exams", groupId, "exams"),
                where("userId", "==", student.id),
                orderBy("date", "desc")
            );
            const esnap = await getDocs(eq);
            setStudentExams(esnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Today's log for the student
            const tLogRef = doc(db, "daily_logs", student.id, "daily_logs", todayStr);
            const tLogSnap = await getDoc(tLogRef);
            setTodayLog(tLogSnap.exists() ? tLogSnap.data() : null);

            // Fetch Course Plan for today
            if (groupType === 'course' && courseInfo?.startDate) {
                const start = courseInfo.startDate.toDate();
                const today = new Date();
                const dayNum = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                if (dayNum > 0) {
                    const pq = query(collection(db, "course_plans", groupId, "course_plans"), where("dayIndex", "==", dayNum));
                    const psnap = await getDocs(pq);
                    if (!psnap.empty) setTodayPlan(psnap.docs[0].data() as PlanDay);
                    else setTodayPlan(null);
                }

                // Fetch Template and its volumes
                if (courseInfo.planTemplateId) {
                    const tSnap = await getDoc(doc(db, "plan_templates", courseInfo.planTemplateId));
                    if (tSnap.exists()) {
                        const tData = tSnap.data();
                        const vSnap = await getDocs(collection(db, "template_volumes", tSnap.id, "template_volumes"));
                        const vIds = vSnap.docs.map(d => d.data().volumeId);
                        setActiveTemplate({ id: tSnap.id, ...tData, selectedVolumeIds: vIds } as PlanTemplate);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleToggleStudentTask = async (taskData: string | TierTask, isCompleted: boolean) => {
        if (!selectedStudent || !groupId || !todayPlan || !courseInfo) return;
        setIsLoggingDaily(true);
        try {
            const taskLabel = typeof taskData === 'string' ? taskData : taskData.label;
            const logRef = doc(db, "daily_logs", selectedStudent.id, "daily_logs", todayStr);
            const batch = writeBatch(db);
            
            let currentLog = todayLog;
            if (!currentLog) {
                currentLog = {
                    userId: selectedStudent.id,
                    courseId: groupId,
                    date: todayStr,
                    pages: 0,
                    completedTasks: [],
                    completed: false
                };
                batch.set(logRef, { ...currentLog, createdAt: serverTimestamp(), createdBy: 'teacher' });
            }

            const newTasks = isCompleted 
                ? [...(currentLog.completedTasks || []), taskLabel]
                : (currentLog.completedTasks || []).filter((t: string) => t !== taskLabel);

            const isDayCompleted = newTasks.length === (todayPlan?.tasks?.length || 0);
            
            batch.update(logRef, {
                completedTasks: newTasks,
                completed: isDayCompleted,
                updatedAt: serverTimestamp(),
                updatedBy: 'teacher'
            });

            // Reward Points
            const userRef = doc(db, "users", selectedStudent.id);
            const rewardPoints = 5; // Default

            if (isCompleted) {
                batch.update(userRef, {
                    totalPoints: increment(rewardPoints),
                    lastActiveDate: serverTimestamp()
                });

                const pointLogRef = doc(collection(db, "points_logs", selectedStudent.id, "points_logs"));
                batch.set(pointLogRef, {
                    amount: rewardPoints,
                    reason: `إنجاز مهمة يومية (بواسطة المعلم): ${taskLabel}`,
                    timestamp: serverTimestamp(),
                    type: 'reward'
                });

                // Identify target volume
                let targetVolumeId = courseInfo.selectedVolumeIds?.[0] || courseInfo.folderId;
                if (typeof taskData !== 'string' && activeTemplate) {
                    const tier = activeTemplate.tiers.find(t => t.id === taskData.tierId);
                    if (tier?.selectedVolumeIds?.length) targetVolumeId = tier.selectedVolumeIds[0];
                }

                if (targetVolumeId) {
                    const volRef = doc(db, "volume_progress", selectedStudent.id, "volume_progress", targetVolumeId);
                    batch.set(volRef, {
                        volumeId: targetVolumeId,
                        completedPages: increment(1),
                        lastUpdated: serverTimestamp()
                    }, { merge: true });
                }
            } else {
                batch.update(userRef, { totalPoints: increment(-rewardPoints) });
                
                let targetVolumeId = courseInfo.selectedVolumeIds?.[0] || courseInfo.folderId;
                if (typeof taskData !== 'string' && activeTemplate) {
                    const tier = activeTemplate.tiers.find(t => t.id === taskData.tierId);
                    if (tier?.selectedVolumeIds?.length) targetVolumeId = tier.selectedVolumeIds[0];
                }

                if (targetVolumeId) {
                    const volRef = doc(db, "volume_progress", selectedStudent.id, "volume_progress", targetVolumeId);
                    batch.set(volRef, {
                        completedPages: increment(-1),
                        lastUpdated: serverTimestamp()
                    }, { merge: true });
                }
            }

            await batch.commit();
            setTodayLog({ ...currentLog, completedTasks: newTasks, completed: isDayCompleted });
            
            // Refresh student logs in list
            setStudentLogs(prev => prev.map(l => l.date === todayStr ? { ...l, completedTasks: newTasks, completed: isDayCompleted } : l));
            if (!studentLogs.some(l => l.date === todayStr)) {
                setStudentLogs([{ date: todayStr, completedTasks: newTasks, completed: isDayCompleted }, ...studentLogs]);
            }

        } catch (error) {
            console.error("Error toggling student task:", error);
        } finally {
            setIsLoggingDaily(false);
        }
    };

    const handleAddExam = async () => {
        if (!selectedStudent || !examForm.title || !examForm.mark) return;
        setIsSavingExam(true);
        try {
            const examRef = doc(collection(db, "exams", groupId, "exams"));
            const examData = {
                ...examForm,
                userId: selectedStudent.id,
                courseId: groupId,
                createdBy: "teacher", // Placeholder for actual teacher name
                createdAt: serverTimestamp()
            };
            await setDoc(examRef, examData);
            setStudentExams([examData, ...studentExams]);
            setExamForm({ title: '', mark: '', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error saving exam:", error);
        } finally {
            setIsSavingExam(false);
        }
    };

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

                // If adding a student to a COURSE, also create an enrollment record
                if (groupType === 'course' && user.role === 'student') {
                    const enrollmentRef = doc(db, "enrollments", groupId, "enrollments", user.id);
                    batch.set(enrollmentRef, {
                        studentName: user.displayName,
                        email: user.email,
                        enrolledAt: serverTimestamp(),
                        status: 'accepted'
                    });
                }
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
                    const batch = writeBatch(db);
                    
                    // Always remove from members
                    batch.delete(doc(db, "members", groupId, "members", member.id));
                    
                    // If removing from a course, also remove from enrollments
                    if (groupType === 'course') {
                        batch.delete(doc(db, "enrollments", groupId, "enrollments", member.id));
                    }
                    
                    await batch.commit();
                    setDialogConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Delete error:", error);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const toggleGraduation = async (member: MemberModel) => {
        if (groupType !== 'course') return;
        
        const isGraduating = member.status !== 'completed';
        setActionLoading(member.id);
        
        try {
            const batch = writeBatch(db);
            
            // 1. Update status in course members
            const memberRef = doc(db, "members", groupId, "members", member.id);
            batch.update(memberRef, {
                status: isGraduating ? 'completed' : 'accepted'
            });
            
            // 2. Update status in enrollments
            const enrollmentRef = doc(db, "enrollments", groupId, "enrollments", member.id);
            batch.update(enrollmentRef, {
                status: isGraduating ? 'completed' : 'accepted',
                completedAt: isGraduating ? serverTimestamp() : null
            });
            
            await batch.commit();
            setDialogConfig({ ...dialogConfig, isOpen: false });
        } catch (error) {
            console.error("Graduation toggle error:", error);
        } finally {
            setActionLoading(null);
        }
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
            case 'admin': return Shield;
            case 'teacher': return GraduationCap;
            case 'student': return User;
            default: return User;
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
                {/* Analytics & Overview (New Add) */}
                <div className="col-span-full">
                    <div className="grid md:grid-cols-4 gap-4">
                        <GlassCard className="p-6 border-primary/20 bg-primary/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><BarChart3 className="w-6 h-6" /></div>
                            <div><p className="text-sm font-bold opacity-60">متوسط الإنجاز اليومي</p><p className="text-2xl font-black">{Math.round((studentMembers.filter(m => m.status === 'completed').length / (studentMembers.length || 1)) * 100)}%</p></div>
                        </GlassCard>
                        <GlassCard className="p-6 border-green-500/20 bg-green-500/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500"><Users className="w-6 h-6" /></div>
                            <div><p className="text-sm font-bold opacity-60">إجمالي طلاب الحلقة</p><p className="text-2xl font-black">{studentMembers.length}</p></div>
                        </GlassCard>
                        <GlassCard className="p-6 border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Award className="w-6 h-6" /></div>
                            <div><p className="text-sm font-bold opacity-60">المتميزون للأسبوع</p><p className="text-xl font-black">أكثر من 90%</p></div>
                        </GlassCard>
                        <GlassCard className="p-6 border-blue-500/20 bg-blue-500/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><LineChart className="w-6 h-6" /></div>
                            <div><p className="text-sm font-bold opacity-60">نشاط المجموعة</p><p className="text-2xl font-black">مستقر</p></div>
                        </GlassCard>
                    </div>
                </div>

                {/* Top Performers (Quick View) */}
                <div className="col-span-full">
                    <div className="flex items-center gap-4 mb-4">
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                        <h2 className="text-xl font-bold">فرسان الحلقة (الأوائل)</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {studentMembers.slice(0, 3).map((m, i) => (
                            <div key={i} className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                                <GlassCard className="relative p-4 flex items-center gap-4 border-amber-500/30">
                                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black shadow-lg">#{i+1}</div>
                                    <div className="flex-1 text-right">
                                        <p className="font-bold text-sm">{m.displayName}</p>
                                        <p className="text-[10px] text-muted-foreground">صاحب همة عالية</p>
                                    </div>
                                    <Award className="w-5 h-5 text-amber-500" />
                                </GlassCard>
                            </div>
                        ))}
                        {studentMembers.length === 0 && <p className="col-span-full text-center text-sm opacity-40 py-10 border border-dashed rounded-3xl">سيظهر المتصدرون هنا بعد تقييم الأداء..</p>}
                    </div>
                </div>

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
                                    onViewProgress={() => handleViewProgress(member)}
                                    onToggleGraduation={() => {
                                        const isGraduating = member.status !== 'completed';
                                        setDialogConfig({
                                            isOpen: true,
                                            type: isGraduating ? 'success' : 'warning',
                                            title: isGraduating ? "تخريج طالب" : "إلغاء التخرج",
                                            description: isGraduating 
                                                ? `هل أنت متأكد من ترقية ${member.displayName} إلى حالة "خريج"؟ سيتمكن الطالب من إصدار شهادته فوراً.`
                                                : `هل تريد إلغاء حالة التخرج لـ ${member.displayName}؟ سيتم سحب صلاحية عرض الشهادة.`,
                                            onConfirm: () => toggleGraduation(member)
                                        });
                                    }}
                                    canGraduate={groupType === 'course'}
                                    loading={actionLoading === member.id}
                                    icon={User}
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

            {/* Progress Modal */}
            <AnimatePresence>
                {showProgressModal && selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProgressModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <BarChart3 className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">سجل إنجاز الطالب</h2>
                                        <p className="text-xs text-muted-foreground">{selectedStudent.displayName} • متابعة آخر 14 يوماً</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowProgressModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8">
                                {loadingLogs ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                                        <p className="text-xs font-bold opacity-40">جاري تحميل السجلات...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {/* Log Achievement for Today */}
                                        {groupType === 'course' && todayPlan && (
                                            <div className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-bold flex items-center gap-2 text-blue-500">
                                                        <CheckSquare className="w-4 h-4" />
                                                        تسجيل إنجاز اليوم ({todayStr})
                                                    </h3>
                                                    {isLoggingDaily && <Loader2 className="w-4 h-4 animate-spin opacity-40" />}
                                                </div>
                                                
                                                <div className="grid gap-3">
                                                    {todayPlan.tasks.map((task, idx) => {
                                                        const label = typeof task === 'string' ? task : task.label;
                                                        const isDone = todayLog?.completedTasks?.includes(label);
                                                        
                                                        return (
                                                            <button
                                                                key={idx}
                                                                disabled={isLoggingDaily}
                                                                onClick={() => handleToggleStudentTask(task, !isDone)}
                                                                className={cn(
                                                                    "w-full p-4 rounded-xl border flex items-center justify-between transition-all group",
                                                                    isDone 
                                                                        ? "bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/20" 
                                                                        : "bg-background border-white/10 hover:border-blue-500/30"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                                        isDone ? "bg-white/20" : "bg-gray-100 dark:bg-white/5"
                                                                    )}>
                                                                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-bold text-xs">{label}</p>
                                                                        {typeof task !== 'string' && task.start && (
                                                                            <p className={cn("text-[8px] font-black uppercase tracking-widest opacity-60", isDone ? "text-white" : "text-primary")}>
                                                                                {task.start} {task.end ? `- ${task.end}` : ''}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <ChevronDown className={cn("w-4 h-4 transition-transform", isDone ? "rotate-90" : "opacity-20")} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Exam Recording Form */}
                                        <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-4">
                                            <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                                                <Award className="w-4 h-4" />
                                                تسجيل نتيجة اختبار جديد
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input 
                                                    type="text" placeholder="عنوان الاختبار (مثل: جزء عم)" 
                                                    value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})}
                                                    className="col-span-full p-3 rounded-xl border bg-background text-xs"
                                                />
                                                <input 
                                                    type="text" placeholder="الدرجة / التقدير" 
                                                    value={examForm.mark} onChange={e => setExamForm({...examForm, mark: e.target.value})}
                                                    className="p-3 rounded-xl border bg-background text-xs"
                                                />
                                                <input 
                                                    type="date" 
                                                    value={examForm.date} onChange={e => setExamForm({...examForm, date: e.target.value})}
                                                    className="p-3 rounded-xl border bg-background text-xs"
                                                />
                                            </div>
                                            <button 
                                                disabled={isSavingExam || !examForm.title}
                                                onClick={handleAddExam}
                                                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSavingExam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                حفظ نتيجة الاختبار
                                            </button>
                                        </div>

                                        {/* Exams List */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold flex items-center gap-2 opacity-60">
                                                <TrendingUp className="w-4 h-4" />
                                                سجل الاختبارات السابقة
                                            </h3>
                                            {studentExams.length === 0 ? (
                                                <p className="text-[10px] opacity-40 text-center py-4 border border-dashed rounded-xl">لا توجد اختبارات مسجلة بعد</p>
                                            ) : studentExams.map((exam, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border bg-white/5 flex items-center justify-between">
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold">{exam.title}</p>
                                                        <p className="text-[10px] opacity-50">{exam.date}</p>
                                                    </div>
                                                    <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-black">{exam.mark}</div>
                                                </div>
                                            ))}
                                        </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-bold flex items-center gap-2 opacity-60">
                                                        <Clock className="w-4 h-4" />
                                                        سجل الإنجاز اليومي
                                                    </h3>
                                                    {studentLogs.length === 0 ? (
                                                        <div className="text-center py-10 space-y-4">
                                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20"><Calendar className="w-6 h-6" /></div>
                                                            <p className="text-[10px] opacity-40">لا توجد سجلات إنجاز مؤخراً.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {studentLogs.map((log, idx) => (
                                                                <div key={idx} className="p-4 rounded-2xl border bg-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-mono">{log.date}</div>
                                                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${log.completed ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                                                            {log.completed ? 'مكتمل' : 'جزئي'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {log.completedTasks?.map((tid: string, tidx: number) => (
                                                                            <div key={tidx} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[8px] font-bold">
                                                                                {tid}
                                                                            </div>
                                                                        ))}
                                                                        {!log.completedTasks?.length && <span className="text-[8px] opacity-40 italic font-medium">لا مهام مسجلة</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                            <div className="p-6 border-t border-white/5 bg-white/5">
                                <button onClick={() => setShowProgressModal(false)} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all">إغلاق</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MemberCard({ member, onRemove, onChangeRole, onViewProgress, onToggleGraduation, canGraduate, loading, icon: Icon, label }: { 
    member: MemberModel, 
    onRemove: () => void, 
    onChangeRole: (role: string) => void,
    onViewProgress?: () => void,
    onToggleGraduation?: () => void,
    canGraduate?: boolean,
    loading: boolean,
    icon: any,
    label: string 
}) {
    const [showActions, setShowActions] = useState(false);

    return (
        <GlassCard className={cn(
            "p-4 flex flex-col gap-4 group !overflow-visible relative transition-all duration-300",
            showActions ? "z-50" : "z-0"
        )}>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg relative">
                    {member.photoURL ? <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : (member.displayName?.[0] || "?").toUpperCase()}
                    <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-white/10"><Icon className="w-3 h-3" /></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{member.displayName}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-muted-foreground border border-gray-200 dark:border-white/10">{label}</span>
                    </div>
                     <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    {member.status === 'completed' && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-green-500 uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>خريج / مُتم</span>
                        </div>
                    )}
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
                                    className="absolute left-0 bottom-full mb-2 w-48 bg-background border rounded-2xl shadow-xl z-50 overflow-hidden"
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
                                    {canGraduate && member.role === 'student' && (
                                        <button onClick={() => { onToggleGraduation?.(); setShowActions(false); }} className="w-full text-right px-4 py-2.5 text-xs hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-2 transition-colors font-bold text-amber-600">
                                            <Award className="w-3 h-3" /> 
                                            {member.status === 'completed' ? 'إلغاء حالة التخرج' : 'اعتماد كتخرج'}
                                        </button>
                                    )}
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

