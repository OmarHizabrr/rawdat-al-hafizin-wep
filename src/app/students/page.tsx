"use client";

import React, { useState, useEffect } from "react";
import { 
    collection, query, onSnapshot, doc, setDoc, 
    serverTimestamp, updateDoc, increment, arrayUnion, 
    getDocs, where, writeBatch, getDoc, orderBy, limit,
    collectionGroup, addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Award, Star, Heart, MessageCircle, Clock, 
    Calendar, CheckCircle, Timer, Sparkles, 
    User as UserIcon, Settings, Target, 
    MessageSquarePlus, ChevronDown, 
    ArrowRight, Info, CreditCard, Users, 
    Download, ScrollText, Loader2, X,
    Layout, Quote, HelpCircle, Mail, Globe, Search,
    Lock as LockIcon, Hash, BookOpen, TrendingUp,
    GraduationCap, ArrowUpRight, Clock3, Trophy, ScrollText as ScrollTextIcon,
    Library, Radio, Zap, Shield, Coins, Flame,
    ArrowLeftRight, FileCheck, Layers as LayersIcon
} from "lucide-react";
import { SUNNAH_VOLUMES, SunnahVolume } from "@/lib/volumes";
import { PlanTemplate, PlanTierDefinition, TierTask } from "@/types/plan";
import { logSessionAttendance } from "@/lib/recitation-service";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { ActivityChart } from "../../components/students/ActivityChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

interface Course {
    id: string;
    title: string;
    description: string;
    startDate: any;
    endDate: any;
    registrationEnd: any;
    visibility?: 'public' | 'private';
    folderId?: string;
    selectedVolumeIds?: string[];
    planTemplateId?: string;
}

interface Group {
    id: string;
    name: string;
    gender: 'male' | 'female';
    visibility?: 'public' | 'private';
    schedule: {
        startTime: string;
        endTime: string;
        recitationDays: string[];
    };
}

interface Testimonial {
    id: string;
    studentName: string;
    content: string;
    likes: string[];
    photoURL?: string;
}

interface PlanDay {
    id?: string;
    dayIndex: number;
    tasks: (string | TierTask)[];
}

const getLevelInfo = (points: number) => {
    if (points >= 1500) return { label: 'صاحب إتقان', color: 'text-amber-500', bg: 'bg-amber-500/10', rank: 4 };
    if (points >= 500) return { label: 'همّة علية', color: 'text-purple-500', bg: 'bg-purple-500/10', rank: 3 };
    if (points >= 100) return { label: 'طالب بصيرة', color: 'text-blue-500', bg: 'bg-blue-500/10', rank: 2 };
    return { label: 'بداية النور', color: 'text-emerald-500', bg: 'bg-emerald-500/10', rank: 1 };
};

const AVAILABLE_ICONS = [
    { key: 'Star', icon: Star },
    { key: 'Award', icon: Award },
    { key: 'Shield', icon: Shield },
    { key: 'Trophy', icon: Trophy },
    { key: 'Zap', icon: Zap },
    { key: 'Target', icon: Target },
    { key: 'Heart', icon: Heart },
    { key: 'Flame', icon: Flame },
    { key: 'Sparkles', icon: Sparkles }
];

export default function StudentsDashboard() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [joinedCourseIds, setJoinedCourseIds] = useState<Set<string>>(new Set());
    const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
    
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [timeLeftToRegister, setTimeLeftToRegister] = useState({ d: '00', h: '00', m: '00' });
    const [timeLeftToStart, setTimeLeftToStart] = useState({ d: '00', h: '00', m: '00' });
    
    const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
    const [newTestimonialContent, setNewTestimonialContent] = useState("");
    const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

    const [dailyLog, setDailyLog] = useState<{ userId: string, courseId: string, date: string, pages: number, completedTasks: string[], completed: boolean } | null>(null);
    const [lastWeekLogs, setLastWeekLogs] = useState<any[]>([]);
    const [todayPlan, setTodayPlan] = useState<PlanDay | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [lastRank, setLastRank] = useState<number | null>(null);
    const [streak, setStreak] = useState(0);
    const [isLoggingDaily, setIsLoggingDaily] = useState(false);
    const [completedEnrollments, setCompletedEnrollments] = useState<any[]>([]);
    const isEnrolled = activeCourse ? joinedCourseIds.has(activeCourse.id) : false;
    const [showCelebrate, setShowCelebrate] = useState(false);

    const [progressPercent, setProgressPercent] = useState(0);
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [totalDays, setTotalDays] = useState(0);

    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        type: 'success' as 'success'|'danger'|'warning'|'info',
        title: '',
        description: ''
    });
    const [volumeProgress, setVolumeProgress] = useState<Record<string, number>>({});
    const [fetchingVolumes, setFetchingVolumes] = useState(false);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);

    // New Gamification States
    const [pointsSettings, setPointsSettings] = useState<any>({ dailyTask: 5 });
    const [badgesLibrary, setBadgesLibrary] = useState<any[]>([]);
    const [myBadges, setMyBadges] = useState<any[]>([]);
    const [pointsLogs, setPointsLogs] = useState<any[]>([]);
    const [isCheckingBadges, setIsCheckingBadges] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState<PlanTemplate | null>(null);
    const [celebratedVolume, setCelebratedVolume] = useState<SunnahVolume | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch Initial Data
    useEffect(() => {
        if (!user) return;

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // 1. Fetch All Courses & Groups
                const coursesSnap = await getDocs(collection(db, "courses"));
                const allCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
                setCourses(allCourses);

                const groupsSnap = await getDocs(collection(db, "groups"));
                const allGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
                setGroups(allGroups);

                // 2. Efficiently check enrollments for all courses
                const enrolledChecks = await Promise.all(
                    allCourses.map(async (c) => {
                        const snap = await getDoc(doc(db, "enrollments", c.id, "enrollments", user.uid));
                        return snap.exists() ? c.id : null;
                    })
                );
                const enrolledIds = new Set(enrolledChecks.filter(id => id !== null) as string[]);
                setJoinedCourseIds(enrolledIds);

                // 3. Efficiently check memberships for all groups
                const groupChecks = await Promise.all(
                    allGroups.map(async (g) => {
                        const snap = await getDoc(doc(db, "members", g.id, "members", user.uid));
                        return snap.exists() ? g.id : null;
                    })
                );
                const memberIds = new Set(groupChecks.filter(id => id !== null) as string[]);
                setJoinedGroupIds(memberIds);

                // Determine active course (first joined or first public)
                const active = allCourses.find(c => enrolledIds.has(c.id)) || 
                               allCourses.find(c => c.visibility !== 'private');
                setActiveCourse(active || null);

            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user]);

    // Fetch Testimonials
    useEffect(() => {
        const q = query(collection(db, "testimonials"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Testimonial[]);
        });
        return () => unsubscribe();
    }, []);

    // Dashboard Data Effect
    useEffect(() => {
        if (!user || !activeCourse) return;

        const fetchData = async () => {
            try {
                // Fetch Daily Log
                const logRef = doc(db, "daily_logs", user.uid, "daily_logs", todayStr);
                const logSnap = await getDoc(logRef);
                if (logSnap.exists()) setDailyLog(logSnap.data() as any);
                else setDailyLog(null);

                // Fetch Last Week for Sparkline
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const qLastWeek = query(
                    collection(db, "daily_logs", user.uid, "daily_logs"),
                    where("userId", "==", user.uid),
                    where("date", ">=", sevenDaysAgo.toISOString().split('T')[0]),
                    orderBy("date", "desc"),
                    limit(7)
                );
                const weekSnap = await getDocs(qLastWeek);
                setLastWeekLogs(weekSnap.docs.map(d => d.data()));

                // Fetch User Data for points/streak
                const uSnap = await getDoc(doc(db, "users", user.uid));
                if (uSnap.exists()) setUserData(uSnap.data());

                // Fetch Gamification Config (Standardized Nested Paths)
                const settingsRef = doc(db, "points_config", "global", "points_config", "settings");
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) setPointsSettings(settingsSnap.data());

                // Fetch Badges Library
                const libSnap = await getDocs(collection(db, "badges_library", "global", "badges_library"));
                setBadgesLibrary(libSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Fetch My Earned Badges
                const myBadgesRef = collection(db, "badges", user.uid, "badges");
                const myBadgesSnap = await getDocs(myBadgesRef);
                setMyBadges(myBadgesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Fetch My Points Logs (Last 10)
                const logsRef = query(
                    collection(db, "points_logs", user.uid, "points_logs"),
                    orderBy("timestamp", "desc"),
                    limit(10)
                );
                const pLogsSnap = await getDocs(logsRef);
                setPointsLogs(pLogsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Fetch Leaderboard (Top 5)
                const qLeaderboard = query(
                    collection(db, "users"),
                    where("role", "==", "student"),
                    orderBy("totalPoints", "desc"),
                    limit(5)
                );
                const lbSnap = await getDocs(qLeaderboard);
                setLeaderboard(lbSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };
        fetchData();

        // Fetch Plan
        const fetchPlan = async () => {
            if (!activeCourse.startDate) return;
            const start = activeCourse.startDate.toDate();
            const today = new Date();
            const dayNum = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            if (dayNum > 0) {
                const q = query(collection(db, "course_plans", activeCourse.id, "course_plans"), where("dayIndex", "==", dayNum));
                const snap = await getDocs(q);
                if (!snap.empty) setTodayPlan(snap.docs[0].data() as PlanDay);
                else setTodayPlan(null);
            }
        };
        fetchPlan();

        // Fetch All Volumes Progress
        const fetchVolumesProgress = async () => {
            if (!user) return;
            setFetchingVolumes(true);
            try {
                const q = query(collection(db, "volume_progress", user.uid, "volume_progress"));
                const snap = await getDocs(q);
                
                const aggProgress: Record<string, number> = {};
                snap.forEach(doc => {
                    aggProgress[doc.id] = Number(doc.data().completedPages || 0);
                });
                
                // Detect newly completed volumes
                Object.entries(aggProgress).forEach(([vid, completed]) => {
                    const vol = SUNNAH_VOLUMES.find(v => v.id === vid);
                    if (vol && completed >= vol.totalPages && !volumeProgress[vid]) {
                        // Only celebrate if it was previously not complete or not in state yet
                        // To avoid repeat popups on load, we can compare with previous state if it exists
                        if (volumeProgress[vid] !== undefined) {
                             setCelebratedVolume(vol);
                        }
                    }
                });

                setVolumeProgress(aggProgress);
            } catch (error) {
                console.error("Error fetching volumes progress:", error);
            } finally {
                setFetchingVolumes(false);
            }
        };
        fetchVolumesProgress();

        // Fetch Template Logic
        const fetchTemplate = async () => {
            if (!activeCourse?.planTemplateId) {
                setActiveTemplate(null);
                return;
            }
            const tSnap = await getDoc(doc(db, "plan_templates", activeCourse.planTemplateId));
            if (tSnap.exists()) {
                setActiveTemplate({ id: tSnap.id, ...tSnap.data() } as PlanTemplate);
            } else {
                setActiveTemplate(null);
            }
        };
        fetchTemplate();

        // Fetch Points Settings (Unified Path)
        const fetchPointsConfig = async () => {
            const docRef = doc(db, "points_config", "global", "points_config", "settings");
            const snap = await getDoc(docRef);
            if (snap.exists()) setPointsSettings(snap.data());
        };
        fetchPointsConfig();

        // Listen for Live Recitation Sessions using nested path collection group
        const qLive = query(collectionGroup(db, "recitation_sessions"), where("status", "==", "active"));
        const unsubscribeLive = onSnapshot(qLive, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            const mySessions = sessions.filter(s => {
                const isMyGroup = s.targetType === 'group' && s.targetId === userData?.groupId;
                const isMyCourse = s.targetType === 'course' && joinedCourseIds.has(s.targetId);
                const isMe = s.targetType === 'individual' && s.targetStudentIds?.includes(user.uid);
                const isAll = s.targetType === 'all';
                return isMyGroup || isMyCourse || isMe || isAll;
            });
            setActiveSessions(mySessions);
        });

        return () => {
            unsubscribeLive();
        };
    }, [user, activeCourse, todayStr, courses, userData?.groupId, joinedCourseIds]);

    const handleJoinSession = async (session: any) => {
        if (!user) return;
        await logSessionAttendance(session.id!, user.uid, user.displayName || userData?.displayName || "طالب");
        window.open(session.url, "_blank");
    };

    // Level Up Celebration Effect
    useEffect(() => {
        if (!userData) return;
        const currentRank = getLevelInfo(userData.totalPoints || 0).rank;
        if (lastRank !== null && currentRank > lastRank) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 5000);
        }
        setLastRank(currentRank);
    }, [userData?.totalPoints]);

    const handleToggleTask = async (taskData: string | TierTask, isCompleted: boolean) => {
        if (!user || !activeCourse || !todayPlan) return;
        setIsLoggingDaily(true);
        try {
            const taskLabel = typeof taskData === 'string' ? taskData : taskData.label;
            const logRef = doc(db, "daily_logs", user.uid, "daily_logs", todayStr);
            const batch = writeBatch(db);
            
            let currentLog = dailyLog;
            if (!currentLog) {
                currentLog = {
                    userId: user.uid,
                    courseId: activeCourse.id,
                    date: todayStr,
                    pages: 0,
                    completedTasks: [],
                    completed: false
                };
                batch.set(logRef, { ...currentLog, createdAt: serverTimestamp() });
            }

            const newTasks = isCompleted 
                ? [...(currentLog.completedTasks || []), taskLabel]
                : (currentLog.completedTasks || []).filter(t => t !== taskLabel);

            const isDayCompleted = newTasks.length === (todayPlan?.tasks?.length || 0);
            
            batch.update(logRef, {
                completedTasks: newTasks,
                completed: isDayCompleted
            });

            if (isCompleted) {
                const userRef = doc(db, "users", user.uid);
                const rewardPoints = pointsSettings?.dailyTask || 5;
                
                batch.update(userRef, {
                    totalPoints: increment(rewardPoints),
                    lastActiveDate: serverTimestamp()
                });

                const pointLogRef = doc(collection(db, "points_logs", user.uid, "points_logs"));
                batch.set(pointLogRef, {
                    amount: rewardPoints,
                    reason: `إنجاز مهمة يومية: ${taskLabel}`,
                    timestamp: serverTimestamp(),
                    type: 'reward'
                });

                // Streak Correction
                const lastDate = userData?.lastActiveDate?.toDate()?.toISOString()?.split('T')[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) batch.update(userRef, { streak: increment(1) });
                else if (lastDate !== todayStr) batch.update(userRef, { streak: 1 });
                
                // Identify target volume
                let targetVolumeId = activeCourse.selectedVolumeIds?.[0] || activeCourse.folderId;
                if (typeof taskData !== 'string' && activeTemplate) {
                    const tier = activeTemplate.tiers.find(t => t.id === taskData.tierId);
                    if (tier?.selectedVolumeIds?.length) targetVolumeId = tier.selectedVolumeIds[0];
                }

                if (targetVolumeId) {
                    const volRef = doc(db, "volume_progress", user.uid, "volume_progress", targetVolumeId);
                    batch.set(volRef, {
                        volumeId: targetVolumeId,
                        completedPages: increment(1),
                        lastUpdated: serverTimestamp()
                    }, { merge: true });
                }
            } else {
                let targetVolumeId = activeCourse.selectedVolumeIds?.[0] || activeCourse.folderId;
                if (typeof taskData !== 'string' && activeTemplate) {
                    const tier = activeTemplate.tiers.find(t => t.id === taskData.tierId);
                    if (tier?.selectedVolumeIds?.length) targetVolumeId = tier.selectedVolumeIds[0];
                }

                if (targetVolumeId) {
                    const volRef = doc(db, "volume_progress", user.uid, "volume_progress", targetVolumeId);
                    batch.set(volRef, {
                        completedPages: increment(-1),
                        lastUpdated: serverTimestamp()
                    }, { merge: true });
                }
            }

            await batch.commit();
            setDailyLog({ ...currentLog, completedTasks: newTasks, completed: isDayCompleted });
            
            if (isCompleted) {
                const newTotalPoints = (userData?.totalPoints || 0) + (pointsSettings?.dailyTask || 5);
                const eligibleBadges = badgesLibrary.filter(b => 
                    newTotalPoints >= b.requiredPoints && 
                    !myBadges.some(mb => mb.id === b.id)
                );

                if (eligibleBadges.length > 0) {
                    const bBatch = writeBatch(db);
                    eligibleBadges.forEach(badge => {
                        const myBadgeRef = doc(db, "badges", user.uid, "badges", badge.id);
                        bBatch.set(myBadgeRef, { ...badge, earnedAt: serverTimestamp() });
                    });
                    await bBatch.commit();
                    setMyBadges(prev => [...prev, ...eligibleBadges]);
                }
            }

            if (isDayCompleted && !dailyLog?.completed) {
                setShowCelebrate(true);
                setTimeout(() => setShowCelebrate(false), 3000);
            }
        } catch (error) {
            console.error("Error toggling task", error);
        } finally {
            setIsLoggingDaily(false);
        }
    };

    const handleJoinCourse = async (courseToJoin?: Course) => {
        const targetCourse = courseToJoin || activeCourse;
        if (!user || !targetCourse) return;
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const enrollRef = doc(db, "enrollments", targetCourse.id, "enrollments", user.uid);
            batch.set(enrollRef, {
                userId: user.uid,
                courseId: targetCourse.id,
                courseTitle: targetCourse.title,
                studentName: user.displayName || userData?.displayName || "طالب العلم",
                studentEmail: user.email,
                enrolledAt: serverTimestamp(),
                status: 'active'
            });

            const memberRef = doc(db, "courses", targetCourse.id, "members", user.uid);
            batch.set(memberRef, {
                userId: user.uid,
                displayName: user.displayName || userData?.displayName || "طالب العلم",
                email: user.email,
                role: 'student',
                addedAt: serverTimestamp(),
                photoURL: user.photoURL || userData?.photoURL || ""
            });

            await batch.commit();
            setJoinedCourseIds(prev => {
                const next = new Set(prev);
                next.add(targetCourse.id);
                return next;
            });
            setDialogConfig({
                isOpen: true,
                type: 'success',
                title: 'تم الانضمام بنجاح',
                description: `مبارك انضمامك لدورة ${targetCourse.title}. نسأل الله لك النفع والبركة.`
            });
        } catch (error) {
            console.error("Error joining course", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLike = async (tid: string, likes: string[]) => {
        if (!user) return;
        const ref = doc(db, "testimonials", tid);
        const isLiked = likes.includes(user.uid);
        await updateDoc(ref, {
            likes: isLiked ? likes.filter(id => id !== user.uid) : arrayUnion(user.uid)
        });
    };

    const handleSubmitTestimonial = async () => {
        if (!user || !newTestimonialContent.trim()) return;
        setIsSubmittingTestimonial(true);
        try {
            await addDoc(collection(db, "testimonials"), {
                userId: user.uid,
                studentName: user.displayName || userData?.displayName || "طالب العلم",
                photoURL: user.photoURL || userData?.photoURL || "",
                content: newTestimonialContent,
                likes: [],
                isVisible: true,
                createdAt: serverTimestamp()
            });
            setNewTestimonialContent("");
            setIsTestimonialModalOpen(false);
        } catch (error) {
            console.error("Error submitting testimonial", error);
        } finally {
            setIsSubmittingTestimonial(false);
        }
    };

    if (loading && !activeCourse) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
        </div>
    );

    if (userData?.role === 'applicant') {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    <GlassCard className="p-12 text-center space-y-8 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-primary/10 animate-pulse">
                            <Clock className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black tracking-tight">طلبك قيد المراجعة العلمية</h1>
                            <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                                أهلاً بك يا <span className="text-primary font-bold">{user?.displayName || "طالب العلم"}</span>. لقد استلمنا بياناتك بنجاح، ويقوم أعضاء اللجنة العلمية حالياً بمراجعة طلب التحاقك بالمنصة.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6 pt-8">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <CheckCircle className="text-green-500 mx-auto w-6 h-6" />
                                <p className="text-xs font-black uppercase tracking-widest">اكتمال الملف</p>
                                <p className="text-[10px] opacity-60">تم استلام البيانات</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                                <Search className="text-primary mx-auto w-6 h-6 animate-bounce" />
                                <p className="text-xs font-black uppercase tracking-widest">المراجعة العلمية</p>
                                <p className="text-[10px] text-primary">جاري التحقق من الطلب</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 opacity-30 space-y-2">
                                <Sparkles className="mx-auto w-6 h-6" />
                                <p className="text-xs font-black uppercase tracking-widest">تفعيل الحساب</p>
                                <p className="text-[10px]">بدء الرحلة العلمية</p>
                            </div>
                        </div>
                        <div className="pt-8">
                            <p className="text-sm text-muted-foreground italic font-medium">"سيتم إشعارك فور قبول طلبك، نسأل الله لك التوفيق والسداد."</p>
                        </div>
                    </GlassCard>
                    <button onClick={() => router.push('/students/profile')} className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black transition-all flex items-center justify-center gap-3">
                        <Settings className="w-5 h-5 opacity-50" /> مراجعة بيانات الملف الشخصي
                    </button>
                    <button onClick={() => signOut()} className="w-full py-4 text-red-500 font-bold hover:underline opacity-60">تسجيل الخروج</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-32" dir="rtl">
            {/* Motivation Header */}
            <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row items-center justify-between gap-10 bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-20 -mt-20" />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 w-full lg:w-auto">
                    <div className="relative group">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/80 to-purple-600 p-[3px] shadow-2xl shadow-primary/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                            <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background">
                                {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <UserIcon className="w-12 h-12 text-primary opacity-40" />}
                            </div>
                        </div>
                        <div className="absolute -bottom-3 -right-3 px-4 py-1.5 bg-amber-500 text-white text-xs font-black rounded-2xl shadow-xl border-4 border-background flex items-center gap-2 animate-bounce">
                            <Star className="w-4 h-4 fill-current" /> {userData?.totalPoints || 0} XP
                        </div>
                    </div>
                    <div className="text-center md:text-right space-y-3">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight flex flex-col md:flex-row items-center gap-4">
                            {user?.displayName || "طالب العلم"}
                            <span className={cn("px-5 py-1.5 text-[10px] font-black rounded-full border border-current/20 uppercase tracking-[0.2em] shadow-lg backdrop-blur-md", getLevelInfo(userData?.totalPoints || 0).bg, getLevelInfo(userData?.totalPoints || 0).color)}>
                                {getLevelInfo(userData?.totalPoints || 0).label}
                            </span>
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-muted-foreground">
                            <div className="flex items-center gap-2.5 text-orange-500 font-black text-sm px-4 py-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                <TrendingUp className="w-5 h-5 animate-pulse" />
                                <span>سلسلة الالتزام: {userData?.streak || 0} يوم</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold opacity-60">
                                <Target className="w-4 h-4" />
                                <span>المستوى {getLevelInfo(userData?.totalPoints || 0).rank} / 4</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto relative z-10">
                    <ActivityChart logs={lastWeekLogs} />
                    <div className="flex gap-4">
                        <button onClick={() => router.push('/students/profile')} className="p-5 bg-white/5 hover:bg-primary/20 rounded-[1.8rem] transition-all border border-white/10 hover:border-primary/30 group shadow-xl">
                            <UserIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                        </button>
                        <button onClick={() => router.push('/settings')} className="p-5 bg-white/5 hover:bg-primary/20 rounded-[1.8rem] transition-all border border-white/10 hover:border-primary/30 group shadow-xl">
                            <Settings className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Live Sessions */}
            <AnimatePresence>
                {activeSessions.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <div className="flex items-center gap-2 px-6"><Radio className="w-5 h-5 text-red-500 animate-pulse" /><h3 className="text-xl font-black">تسميع مباشر الآن</h3></div>
                        <div className="flex flex-wrap gap-6">
                            {activeSessions.map(session => (
                                <GlassCard key={session.id} className="flex-1 min-w-[300px] p-6 border-red-500/30 bg-red-500/5 relative group overflow-hidden">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="space-y-2">
                                            <div className="text-xs font-black text-red-500 uppercase flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> {session.type === 'video' ? 'فيديو' : 'صوتي'}</div>
                                            <h4 className="text-xl font-black">{session.title}</h4>
                                            <p className="text-xs opacity-60">المشرف: {session.creatorName}</p>
                                        </div>
                                        <button onClick={() => handleJoinSession(session)} className="px-6 py-4 bg-red-500 text-white font-black rounded-2xl flex items-center gap-2">دخول <ArrowUpRight className="w-5 h-5" /></button>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Courses & Groups */}
            <div className="space-y-12">
                {joinedCourseIds.size > 0 && (
                    <section className="space-y-6">
                        <h3 className="text-2xl font-black flex items-center gap-3 px-2"><BookOpen className="w-6 h-6 text-primary" /> دوراتي الحالية</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.filter(c => joinedCourseIds.has(c.id)).map(course => (
                                <CourseCard key={course.id} course={course} isJoined={true} isActive={activeCourse?.id === course.id} onSelect={() => setActiveCourse(course)} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-6">
                    <h3 className="text-2xl font-black flex items-center gap-3 px-2"><Globe className="w-6 h-6 text-emerald-500" /> استكشف الدورات</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.filter(c => !joinedCourseIds.has(c.id) && c.visibility !== 'private').map(course => (
                            <CourseCard key={course.id} course={course} isJoined={false} onJoin={() => handleJoinCourse(course)} />
                        ))}
                    </div>
                </section>
            </div>

            {/* Volumes Progress */}
            <section className="space-y-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black flex items-center gap-3 text-primary"><Library className="w-6 h-6" /> مسار إنجاز المجلدات المطلوبة</h3>
                        <p className="text-muted-foreground text-sm font-medium italic">"وخيرُ العلم ما ضُبطت أصولُه.."</p>
                    </div>
                    
                    {/* Aggregated Progress Card */}
                    {(activeTemplate || activeCourse?.folderId) && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-primary/10 border border-primary/20 rounded-[2rem] p-6 flex items-center gap-6 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative w-16 h-16">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                    <motion.circle 
                                        cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" 
                                        className="text-primary"
                                        strokeDasharray={176}
                                        initial={{ strokeDashoffset: 176 }}
                                        animate={{ 
                                            strokeDashoffset: 176 - (176 * Math.min(
                                                (Object.entries(volumeProgress)
                                                    .filter(([vid]) => activeTemplate?.selectedVolumeIds?.includes(vid) || activeCourse?.selectedVolumeIds?.includes(vid) || activeCourse?.folderId === vid)
                                                    .reduce((acc, [, val]) => acc + val, 0) / 
                                                (SUNNAH_VOLUMES
                                                    .filter(v => activeTemplate?.selectedVolumeIds?.includes(v.id) || activeCourse?.selectedVolumeIds?.includes(v.id) || activeCourse?.folderId === v.id)
                                                    .reduce((acc, v) => acc + v.totalPages, 0) || 1)
                                                ), 1)
                                            ) 
                                        }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                                    {Math.round((Object.entries(volumeProgress)
                                        .filter(([vid]) => activeTemplate?.selectedVolumeIds?.includes(vid) || activeCourse?.selectedVolumeIds?.includes(vid) || activeCourse?.folderId === vid)
                                        .reduce((acc, [, val]) => acc + val, 0) / 
                                    (SUNNAH_VOLUMES
                                        .filter(v => activeTemplate?.selectedVolumeIds?.includes(v.id) || activeCourse?.selectedVolumeIds?.includes(v.id) || activeCourse?.folderId === v.id)
                                        .reduce((acc, v) => acc + v.totalPages, 0) || 1)) * 100)}%
                                </div>
                            </div>
                            <div className="space-y-1 relative z-10">
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest opacity-70">الإنجاز الكلي للمسار</div>
                                <div className="text-xl font-black flex items-baseline gap-2">
                                    <span className="text-3xl tracking-tighter">
                                        { (SUNNAH_VOLUMES
                                            .filter(v => activeTemplate?.selectedVolumeIds?.includes(v.id) || activeCourse?.selectedVolumeIds?.includes(v.id) || activeCourse?.folderId === v.id)
                                            .reduce((acc, v) => acc + v.totalPages, 0)) - 
                                          (Object.entries(volumeProgress)
                                            .filter(([vid]) => activeTemplate?.selectedVolumeIds?.includes(vid) || activeCourse?.selectedVolumeIds?.includes(vid) || activeCourse?.folderId === vid)
                                            .reduce((acc, [, val]) => acc + val, 0)) }
                                    </span>
                                    <span className="text-xs opacity-50">صفحة متبقية</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {SUNNAH_VOLUMES
                        .filter(volume => {
                            const isTarget = activeTemplate?.selectedVolumeIds?.includes(volume.id) || activeCourse?.selectedVolumeIds?.includes(volume.id) || activeCourse?.folderId === volume.id;
                            return isTarget;
                        })
                        .map(volume => {
                            const completed = volumeProgress[volume.id] || 0;
                            const percent = Math.min(Math.round((completed / volume.totalPages) * 100), 100);
                            return (
                                <GlassCard key={volume.id} className={cn("p-6 hover:-translate-y-2 transition-all duration-500 overflow-hidden relative group", percent >= 100 ? "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/10" : "bg-white/[0.01]")}>
                                    <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-150", "bg-gradient-to-br " + volume.color)} />
                                    <div className="space-y-6 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-xl transform group-hover:rotate-12 transition-transform", volume.color)}>{percent >= 100 ? <Trophy className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}</div>
                                            <div className="text-left"><p className="text-3xl font-black tracking-tighter">{percent}%</p></div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg mb-1">{volume.title}</h4>
                                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{completed} / {volume.totalPages} صفحة</p>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner relative">
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${percent}%` }} 
                                                className={cn("h-full relative", percent >= 100 ? "bg-emerald-500" : "bg-gradient-to-r " + volume.color)}
                                            >
                                                {percent < 100 && percent > 0 && <div className="absolute top-0 right-0 h-full w-4 bg-white/20 blur-sm animate-pulse" />}
                                            </motion.div>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                    })}
                </div>
                
                {SUNNAH_VOLUMES.filter(v => activeTemplate?.selectedVolumeIds?.includes(v.id) || activeCourse?.folderId === v.id).length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 flex flex-col items-center gap-4">
                        <LayersIcon className="w-12 h-12" />
                        <p className="font-bold">لم يتم رصد مجلدات مطلوبة في خطتك الحالية بعد.</p>
                    </div>
                )}
            </section>

            {/* Daily ورد */}
            {isEnrolled && todayPlan && (
                <div className="space-y-8">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                             <h3 className="text-2xl font-black flex items-center gap-3 text-primary"><Calendar className="w-6 h-6" /> ورد اليوم {todayPlan.dayIndex}</h3>
                             <p className="text-muted-foreground italic font-medium">"نور العلم في العمل به.."</p>
                        </div>
                        {dailyLog?.completed && <div className="px-6 py-3 bg-emerald-500 text-white font-black rounded-2xl">تم الإنجاز بنجاح ✨</div>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {todayPlan.tasks.map((taskData, idx) => {
                            const taskLabel = typeof taskData === 'string' ? taskData : taskData.label;
                            const isDone = dailyLog?.completedTasks?.includes(taskLabel);
                            
                            // Get Tier color if Task
                            let accentColor = "bg-primary";
                            if (typeof taskData !== 'string' && activeTemplate) {
                                const tier = activeTemplate.tiers.find(t => t.id === taskData.tierId);
                                if (tier?.color) accentColor = tier.color;
                            }

                            return (
                                <GlassCard key={idx} className={cn("p-8 cursor-pointer transition-all border-l-4 group relative", isDone ? "border-emerald-500 bg-emerald-500/5 opacity-80" : `border-transparent bg-white/[0.02] hover:bg-white/[0.04] flex flex-col`)} onClick={() => handleToggleTask(taskData, !isDone)}>
                                    <div className="flex items-center gap-6">
                                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500", isDone ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-white/5 text-muted-foreground")}>
                                            {isLoggingDaily ? <Loader2 className="animate-spin" /> : isDone ? <CheckCircle /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                {typeof taskData !== 'string' && <div className={cn("w-2 h-2 rounded-full", accentColor)} />}
                                                <p className={cn("text-xl font-black transition-all", isDone && "line-through opacity-50")}>{taskLabel}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded uppercase tracking-widest">+5 XP</div>
                                                {typeof taskData !== 'string' && taskData.type === 'hadiths' && <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest flex items-center gap-1"><Hash className="w-3 h-3" /> أحاديث</span>}
                                                {typeof taskData !== 'string' && taskData.type === 'pages' && <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest flex items-center gap-1"><BookOpen className="w-3 h-3" /> صفحات</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {!isDone && typeof taskData !== 'string' && (taskData.start || taskData.end) && (
                                        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                                            <p className="text-sm font-bold opacity-60 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-primary" />
                                                نطاق المهمة: {taskData.start} {taskData.end ? `إلى ${taskData.end}` : ''}
                                            </p>
                                        </div>
                                    )}
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Gamification: Badges & History */}
            <div className="grid lg:grid-cols-3 gap-12 pt-10">
                <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-2xl font-black flex items-center gap-3 text-amber-500 px-4"><Award className="w-7 h-7" /> خزانة الأوسمة الملكية</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {myBadges.length > 0 ? myBadges.map((badge, idx) => {
                            const IconComp = AVAILABLE_ICONS.find(i => i.key === badge.iconKey)?.icon || Star;
                            return (
                                <GlassCard key={badge.id} className="p-8 flex flex-col items-center text-center gap-4 group hover:-translate-y-2 transition-all">
                                    <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center text-white bg-gradient-to-br shadow-xl group-hover:rotate-12 transition-all", badge.color)}><IconComp className="w-10 h-10" /></div>
                                    <h4 className="font-black text-sm">{badge.name}</h4>
                                    <p className="text-[10px] opacity-40 italic">{badge.rarity === 'diamond' ? 'نادر جداً' : 'وسام ملكي'}</p>
                                </GlassCard>
                            );
                        }) : (
                            <div className="col-span-full py-16 border-2 border-dashed border-white/5 rounded-[3rem] text-center opacity-20"><Shield className="w-12 h-12 mx-auto mb-4" /><p>ابدأ رحلتك لتجمـع الأوسمة</p></div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <h3 className="text-2xl font-black flex items-center gap-3 text-primary px-4"><Zap className="w-6 h-6" /> السجل الأكاديمي</h3>
                    <GlassCard className="p-8 bg-primary/5 space-y-6">
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {pointsLogs.map(log => (
                                <div key={log.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black", log.type === 'penalty' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>{log.amount > 0 ? `+${log.amount}` : log.amount}</div>
                                        <div><p className="text-xs font-bold">{log.reason}</p><p className="text-[9px] opacity-30">{log.timestamp?.toDate().toLocaleDateString('ar-EG')}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center"><span className="text-[10px] opacity-40 font-black">الرصيد الكلي</span><div className="flex items-center gap-2 text-amber-500"><Coins className="w-5 h-5" /><span className="text-2xl font-black">{userData?.totalPoints || 0}</span></div></div>
                    </GlassCard>

                    {/* Leaderboard Section */}
                    <div className="space-y-4 pt-4">
                        <h4 className="text-sm font-black flex items-center gap-2 px-2"><Trophy className="w-4 h-4 text-amber-500" /> فرسان السنة (المتصدرون)</h4>
                        <div className="space-y-3">
                            {leaderboard.map((student, idx) => (
                                <div key={student.id} className={cn(
                                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                                    student.id === user?.uid ? "bg-primary/10 border-primary/20" : "bg-white/5 border-white/5"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs",
                                            idx === 0 ? "bg-amber-500 text-white" : 
                                            idx === 1 ? "bg-slate-300 text-slate-700" :
                                            idx === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-white"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                                            {student.photoURL ? <img src={student.photoURL} alt="" /> : <UserIcon className="w-full h-full p-2 opacity-20" />}
                                        </div>
                                        <span className="text-xs font-bold truncate max-w-[100px]">{student.displayName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px]">
                                        <Star className="w-3 h-3 fill-current" />
                                        {student.totalPoints || 0}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-10 pt-10">
                <div className="flex justify-between items-center px-4">
                    <h3 className="text-2xl font-black flex items-center gap-3"><MessageCircle className="w-6 h-6 text-primary" /> قناديل الهدى</h3>
                    <button onClick={() => setIsTestimonialModalOpen(true)} className="px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"><MessageSquarePlus className="w-5 h-5" /> شاركنا تجربتك</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map(t => (
                        <GlassCard key={t.id} className="p-10 h-full flex flex-col justify-between hover:border-primary/40 transition-all">
                            <div className="space-y-6"><Quote className="w-10 h-10 text-primary opacity-20" /><p className="text-lg italic font-medium">"{t.content}"</p></div>
                            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">{t.photoURL ? <img src={t.photoURL} alt={t.studentName} /> : t.studentName?.[0]}</div>
                                    <div><span className="text-sm font-black">{t.studentName}</span></div>
                                </div>
                                <button onClick={() => handleToggleLike(t.id, t.likes)} className={cn("px-4 py-2 rounded-xl flex items-center gap-2", t.likes.includes(user?.uid || '') ? "bg-rose-500 text-white" : "bg-white/5")}><Heart className="w-4 h-4" /> {t.likes.length}</button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={dialogConfig.isOpen} onOpenChange={open => setDialogConfig(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent className="max-w-md bg-background rounded-3xl p-8 text-center sm:rounded-3xl">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", dialogConfig.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-rose-500/10 text-rose-500")}>{dialogConfig.type === 'success' ? <CheckCircle /> : <X />}</div>
                    <DialogTitle className="text-2xl font-black">{dialogConfig.title}</DialogTitle>
                    <DialogDescription className="py-4 opacity-60">{dialogConfig.description}</DialogDescription>
                    <button onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))} className="w-full mt-4 py-4 bg-primary text-white font-black rounded-2xl shadow-xl">فهمت</button>
                </DialogContent>
            </Dialog>

            <Dialog open={isTestimonialModalOpen} onOpenChange={setIsTestimonialModalOpen}>
                <DialogContent className="max-w-xl bg-background rounded-3xl p-8 sm:rounded-3xl">
                    <DialogTitle className="text-2xl font-black mb-6">شارك تجربتك العلمية</DialogTitle>
                    <textarea value={newTestimonialContent} onChange={e => setNewTestimonialContent(e.target.value)} placeholder="اكتب هنا تجربتك لزملائك..." className="w-full h-40 p-4 bg-white/5 rounded-2xl resize-none outline-none border border-white/5 focus:border-primary/40 transition-all" />
                    <button onClick={handleSubmitTestimonial} disabled={isSubmittingTestimonial || !newTestimonialContent.trim()} className="w-full mt-6 py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2">{isSubmittingTestimonial ? <Loader2 className="animate-spin" /> : <Sparkles />} نشر الآن</button>
                </DialogContent>
            </Dialog>

            {/* Achievement Celebration Modal */}
            <AnimatePresence>
                {celebratedVolume && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCelebratedVolume(null)} className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
                        <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} className="relative bg-background border border-amber-500/30 rounded-[3.5rem] p-12 shadow-2xl max-w-lg w-full text-center space-y-10 overflow-hidden group">
                           {/* Decorative Elements */}
                            <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
                            
                            <div className="relative">
                                <motion.div initial={{ rotate: -15, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", damping: 12 }} className="w-32 h-32 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative z-10">
                                    <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
                                </motion.div>
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 rounded-full" />
                            </div>

                            <div className="space-y-6 relative z-10">
                                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-amber-500 mb-2">مبارك الإتمام! ✨</h2>
                                <p className="text-xl font-medium opacity-90 leading-relaxed">
                                    هنيئاً لك يا <span className="text-primary font-black underline decoration-amber-500/30 underline-offset-8 decoration-4">{user?.displayName || "طالب العلم"}</span> 
                                    <br /> 
                                    إنجازك التام لـ <span className="text-amber-500 font-black">{celebratedVolume.title}</span>
                                </p>
                                
                                <div className="flex justify-center gap-3 py-6">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                                            <Star className="w-8 h-8 text-amber-500 fill-current drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 flex items-center justify-between shadow-inner">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-1">إجمالي الصفحات التي ضُبطت</p>
                                        <p className="text-3xl font-black tracking-tighter">{celebratedVolume.totalPages} صفحة</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl">
                                        <FileCheck className="w-8 h-8" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <button onClick={() => setCelebratedVolume(null)} className="w-full py-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-[2rem] font-black shadow-2xl shadow-amber-500/40 hover:scale-[1.03] active:scale-95 transition-all text-xl flex items-center justify-center gap-3">
                                    <Sparkles className="w-6 h-6 animate-pulse" />
                                    تابِع مسير البركة
                                </button>
                                <p className="text-sm opacity-50 font-black tracking-wide italic">"فإذا فرغت فانصب وإلى ربك فارغب"</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CourseCard({ course, isJoined, isActive, onSelect, onJoin }: { course: Course, isJoined: boolean, isActive?: boolean, onSelect?: () => void, onJoin?: () => void }) {
    return (
        <GlassCard className={cn("p-8 flex flex-col h-full transition-all duration-500 hover:scale-[1.02]", isActive ? "border-primary ring-2 ring-primary/10 bg-primary/5" : "hover:border-primary/20")} onClick={onSelect}>
            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-start"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><BookOpen /></div><div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase", isJoined ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary")}>{isJoined ? 'منضم' : 'متاح'}</div></div>
                <div className="space-y-2"><h4 className="text-xl font-black">{course.title}</h4><p className="text-sm opacity-60 line-clamp-2">{course.description}</p></div>
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] opacity-40 font-bold"><Users className="w-3 h-3" /> +1.2k طالب</div>
                {isJoined ? <span className="text-primary text-xs font-black flex items-center gap-1">عرض <ArrowUpRight className="w-4 h-4" /></span> : <button onClick={e => { e.stopPropagation(); onJoin?.(); }} className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-xl">انضم الآن</button>}
            </div>
        </GlassCard>
    );
}

function GroupCard({ group, isJoined }: { group: Group, isJoined: boolean }) {
    return (
        <GlassCard className="p-6 space-y-6 hover:border-primary/30 transition-all duration-500 h-full flex flex-col">
            <div className="flex justify-between items-center"><div className={cn("px-3 py-1 rounded-full text-[10px] font-black text-white", group.gender === 'male' ? "bg-blue-600" : "bg-rose-600")}>{group.gender === 'male' ? 'قسم الرجال' : 'قسم النساء'}</div>{isJoined && <CheckCircle className="text-green-500 w-5 h-5" />}</div>
            <h4 className="text-lg font-black">{group.name}</h4>
            <div className="space-y-2 text-xs opacity-60">
                <div className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> <span>{group.schedule.startTime} - {group.schedule.endTime}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span className="truncate">{group.schedule.recitationDays?.join(" • ")}</span></div>
            </div>
            <div className="pt-4 border-t border-white/5 mt-auto">
                {isJoined ? <button className="w-full py-3 bg-primary/5 text-primary text-xs font-black rounded-xl">عرض الزملاء</button> : <button className="w-full py-3 border border-white/5 text-xs font-black rounded-xl">مراسلة المشرف</button>}
            </div>
        </GlassCard>
    );
}
