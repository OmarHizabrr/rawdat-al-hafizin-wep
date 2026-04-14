"use client";

import React, { useState, useEffect } from "react";
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    serverTimestamp,
    updateDoc,
    increment,
    getDocs,
    where,
    writeBatch,
    getDoc,
    orderBy,
    limit,
    collectionGroup,
    addDoc,
    deleteDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    Star,
    Heart,
    MessageCircle,
    Clock,
    Calendar,
    CheckCircle,
    Sparkles,
    User as UserIcon,
    Settings,
    Target,
    MessageSquarePlus,
    Users,
    Loader2,
    X,
    Quote,
    Globe,
    Search,
    Hash,
    BookOpen,
    GraduationCap,
    ArrowUpRight,
    Clock3,
    Trophy,
    Library,
    Radio,
    Zap,
    Shield,
    Coins,
    Flame,
    FileCheck,
    Layers as LayersIcon,
} from "lucide-react";
import { SUNNAH_VOLUMES, SunnahVolume } from "@/lib/volumes";
import { PlanTemplate, TierTask } from "@/types/plan";
import { logSessionAttendance } from "@/lib/recitation-service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationBellLink } from "@/components/layout/NotificationBellLink";
import { GlassCard } from "@/components/ui/GlassCard";
import { ActivityChart } from "../../components/students/ActivityChart";
import { EliteModal } from "@/components/ui/EliteModal";
import { cn } from "@/lib/utils";
import type { UserDocument } from "@/lib/user-document";

type DailyLogDoc = {
    userId: string;
    courseId: string;
    date: string;
    pages?: number;
    completedTasks: string[];
    completed: boolean;
};

type RecitationSessionRow = {
    id: string;
    targetType?: string;
    targetId?: string;
    url?: string;
    title?: string;
    creatorName?: string;
    type?: string;
};

type BadgeRow = {
    id: string;
    name?: string;
    iconKey?: string;
    color?: string;
    rarity?: string;
    requiredPoints?: number;
};

type PointsLogRow = {
    id: string;
    amount?: number;
    reason?: string;
    type?: string;
    timestamp?: { toDate: () => Date };
};

type CourseWirdStatus = {
    courseId: string;
    totalTodayPages: number;
    dailyMinPages: number;
};

type LeaderboardRow = {
    id: string;
    displayName?: string;
    photoURL?: string;
    totalPoints?: number;
};

interface Course {
    id: string;
    title: string;
    description: string;
    startDate?: Timestamp | null;
    endDate?: Timestamp | null;
    registrationEnd?: Timestamp | null;
    visibility?: "public" | "private";
    folderId?: string;
    selectedVolumeIds?: string[];
    planTemplateId?: string;
    dailyMinPages?: number;
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
    likesCount?: number;
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

    const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
    const [newTestimonialContent, setNewTestimonialContent] = useState("");
    const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);
    const [myLikedPostIds, setMyLikedPostIds] = useState<Set<string>>(new Set());

    const [dailyLog, setDailyLog] = useState<DailyLogDoc | null>(null);
    const [lastWeekLogs, setLastWeekLogs] = useState<Record<string, unknown>[]>([]);
    const [todayPlan, setTodayPlan] = useState<PlanDay | null>(null);
    const [userData, setUserData] = useState<UserDocument | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [, setLastRank] = useState<number | null>(null);
    const [isLoggingDaily, setIsLoggingDaily] = useState(false);
    const isEnrolled = activeCourse ? joinedCourseIds.has(activeCourse.id) : false;

    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        type: 'success' as 'success'|'danger'|'warning'|'info',
        title: '',
        description: ''
    });
    const [volumeProgress, setVolumeProgress] = useState<Record<string, number>>({});
    const [activeSessions, setActiveSessions] = useState<RecitationSessionRow[]>([]);

    const [pointsSettings, setPointsSettings] = useState<Record<string, unknown>>({ dailyTask: 5 });
    const [badgesLibrary, setBadgesLibrary] = useState<BadgeRow[]>([]);
    const [myBadges, setMyBadges] = useState<BadgeRow[]>([]);
    const [pointsLogs, setPointsLogs] = useState<PointsLogRow[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<PlanTemplate | null>(null);
    const [templateVolumes, setTemplateVolumes] = useState<{volumeId: string, tierId?: string}[]>([]);
    const [courseVolumes, setCourseVolumes] = useState<string[]>([]);
    const [celebratedVolume, setCelebratedVolume] = useState<SunnahVolume | null>(null);
    const [dailyWirdStatuses, setDailyWirdStatuses] = useState<CourseWirdStatus[]>([]);

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

    useEffect(() => {
        if (!user || joinedCourseIds.size === 0) {
            setDailyWirdStatuses([]);
            return;
        }
        const todayKey = new Date().toISOString().split("T")[0];
        const loadDailyStatuses = async () => {
            const joined = courses.filter(c => joinedCourseIds.has(c.id));
            const statuses = await Promise.all(joined.map(async (course) => {
                const entriesQ = query(
                    collection(db, "daily_wird", course.id, "users", user.uid, "entries"),
                    where("date", "==", todayKey)
                );
                const snap = await getDocs(entriesQ);
                const totalTodayPages = snap.docs.reduce((sum, entry) => sum + Number(entry.data().computedPages || 0), 0);
                return {
                    courseId: course.id,
                    totalTodayPages,
                    dailyMinPages: Number(course.dailyMinPages || 1)
                };
            }));
            setDailyWirdStatuses(statuses);
        };
        void loadDailyStatuses();
    }, [courses, joinedCourseIds, user]);

    // Fetch Testimonials
    useEffect(() => {
        const q = query(collection(db, "testimonials"), where("isVisible", "==", true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Testimonial[]);
        });
        return () => unsubscribe();
    }, []);

    // Fetch My Likes for Testimonials
    useEffect(() => {
        if (!user) return;
        const q = query(collectionGroup(db, "testimonial_likes"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const likedIds = new Set(snapshot.docs.map(doc => doc.data().testimonialId));
            setMyLikedPostIds(likedIds);
        });
        return () => unsubscribe();
    }, [user]);

    // Dashboard Data Effect
    useEffect(() => {
        if (!user || !activeCourse) return;

        const fetchData = async () => {
            try {
                // Fetch Daily Log
                const logRef = doc(db, "daily_logs", user.uid, "daily_logs", todayStr);
                const logSnap = await getDoc(logRef);
                if (logSnap.exists()) setDailyLog(logSnap.data() as DailyLogDoc);
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
                if (uSnap.exists()) setUserData(uSnap.data() as UserDocument);

                // Fetch Gamification Config (Standardized Nested Paths)
                const settingsRef = doc(db, "points_config", "global", "points_config", "settings");
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) setPointsSettings(settingsSnap.data() as Record<string, unknown>);

                // Fetch Badges Library
                const libSnap = await getDocs(collection(db, "badges_library", "global", "badges_library"));
                setBadgesLibrary(libSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BadgeRow)));

                // Fetch My Earned Badges
                const myBadgesRef = collection(db, "badges", user.uid, "badges");
                const myBadgesSnap = await getDocs(myBadgesRef);
                setMyBadges(myBadgesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BadgeRow)));

                // Fetch My Points Logs (Last 10)
                const logsRef = query(
                    collection(db, "points_logs", user.uid, "points_logs"),
                    orderBy("timestamp", "desc"),
                    limit(10)
                );
                const pLogsSnap = await getDocs(logsRef);
                setPointsLogs(pLogsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PointsLogRow)));

                // Fetch Leaderboard (Top 5)
                const qLeaderboard = query(
                    collection(db, "users"),
                    where("role", "==", "student"),
                    orderBy("totalPoints", "desc"),
                    limit(5)
                );
                const lbSnap = await getDocs(qLeaderboard);
                setLeaderboard(
                    lbSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderboardRow))
                );

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
            
            try {
                const q = query(collection(db, "course_plans", activeCourse.id, "course_plans"), where("dayIndex", "==", dayNum));
                const snap = await getDocs(q);
                if (!snap.empty) setTodayPlan(snap.docs[0].data() as PlanDay);
                else setTodayPlan(null);

                // Fetch Course Volumes
                const cvSnap = await getDocs(collection(db, "course_volumes", activeCourse.id, "course_volumes"));
                setCourseVolumes(cvSnap.docs.map(d => d.data().volumeId));

                // Fetch Template and its volumes
                if (activeCourse.planTemplateId) {
                    const tSnap = await getDoc(doc(db, "plan_templates", activeCourse.planTemplateId));
                    if (tSnap.exists()) {
                        setActiveTemplate({ id: tSnap.id, ...tSnap.data() } as PlanTemplate);
                        const tvSnap = await getDocs(collection(db, "template_volumes", tSnap.id, "template_volumes"));
                        setTemplateVolumes(tvSnap.docs.map(d => ({ 
                            volumeId: d.data().volumeId, 
                            tierId: d.data().tierId 
                        })));
                    }
                }
            } catch (error) {
                console.error("Error fetching plan/volumes:", error);
            }
        };
        fetchPlan();

        // Fetch All Volumes Progress
        const fetchVolumesProgress = async () => {
            if (!user) return;
            try {
                const q = query(collection(db, "volume_progress", user.uid, "volume_progress"));
                const snap = await getDocs(q);

                const aggProgress: Record<string, number> = {};
                snap.forEach((d) => {
                    aggProgress[d.id] = Number(d.data().completedPages || 0);
                });

                Object.entries(aggProgress).forEach(([vid, completed]) => {
                    const vol = SUNNAH_VOLUMES.find((v) => v.id === vid);
                    const prev = volumeProgress[vid];
                    if (
                        vol &&
                        completed >= vol.totalPages &&
                        prev !== undefined &&
                        prev < vol.totalPages
                    ) {
                        setCelebratedVolume(vol);
                    }
                });

                setVolumeProgress(aggProgress);
            } catch (error) {
                console.error("Error fetching volumes progress:", error);
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
            if (snap.exists()) setPointsSettings(snap.data() as Record<string, unknown>);
        };
        fetchPointsConfig();

        // Listen for Live Recitation Sessions using nested path collection group
        const qLive = query(collectionGroup(db, "recitation_sessions"), where("status", "==", "active"));
        const unsubscribeLive = onSnapshot(qLive, async (snapshot) => {
            const sessions = snapshot.docs.map(
                (d) => ({ id: d.id, ...d.data() } as RecitationSessionRow)
            );

            const mySessions: RecitationSessionRow[] = [];
            for (const s of sessions) {
                if (s.targetType === "all") {
                    mySessions.push(s);
                    continue;
                }

                const targetsSnap = await getDocs(collection(db, "session_targets", s.id, "session_targets"));
                const targetIds = targetsSnap.docs
                    .map((d) => d.data()?.targetId)
                    .filter((id): id is string => typeof id === "string");

                const gid = userData?.groupId;
                const isMyGroup =
                    s.targetType === "group" &&
                    ((typeof s.targetId === "string" && s.targetId === gid) ||
                        (typeof gid === "string" && targetIds.includes(gid)));
                const isMyCourse =
                    s.targetType === "course" &&
                    ((typeof s.targetId === "string" && joinedCourseIds.has(s.targetId)) ||
                        targetIds.some((id) => joinedCourseIds.has(id)));
                const isMe = s.targetType === "individual" && targetIds.includes(user.uid);

                if (isMyGroup || isMyCourse || isMe) {
                    mySessions.push(s);
                }
            }
            setActiveSessions(mySessions);
        });

        return () => {
            unsubscribeLive();
        };
    // volumeProgress مقصود استبعاده لتجنب حلقات إعادة الجلب عند كل تحديث تقدم
    // eslint-disable-next-line react-hooks/exhaustive-deps -- يعتمد على لقطة volumeProgress داخل المعالج فقط
    }, [user, activeCourse, todayStr, courses, userData?.groupId, joinedCourseIds]);

    const handleJoinSession = async (session: RecitationSessionRow) => {
        if (!user) return;
        await logSessionAttendance(session.id, user.uid, user.displayName || userData?.displayName || "طالب");
        if (session.url) window.open(session.url, "_blank");
    };

    useEffect(() => {
        if (!userData) return;
        const currentRank = getLevelInfo(userData.totalPoints || 0).rank;
        setLastRank((prev) => {
            if (prev !== null && currentRank > prev) {
                /* يمكن لاحقاً إظهار احتفال بالترقية */
            }
            return currentRank;
        });
    }, [userData]);

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
                const rewardPoints = Number(pointsSettings?.dailyTask) || 5;
                
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
                const lastActiveTs = userData?.lastActiveDate as Timestamp | undefined;
                const lastDate = lastActiveTs?.toDate?.()?.toISOString()?.split("T")[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) batch.update(userRef, { streak: increment(1) });
                else if (lastDate !== todayStr) batch.update(userRef, { streak: 1 });
                
                // Identify target volume (Standardized Subcollection Logic)
                let targetVolumeId = courseVolumes[0] || activeCourse.folderId;
                if (typeof taskData !== 'string' && activeTemplate) {
                    // Try to find volume associated with this specific tier
                    const tierVol = templateVolumes.find(v => v.tierId === taskData.tierId);
                    if (tierVol) targetVolumeId = tierVol.volumeId;
                    else if (templateVolumes.length > 0) {
                        // Fallback to template-level volume (no tierId)
                        const templateLevelVol = templateVolumes.find(v => !v.tierId);
                        if (templateLevelVol) targetVolumeId = templateLevelVol.volumeId;
                    }
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
                let targetVolumeId = courseVolumes[0] || activeCourse.folderId;
                if (typeof taskData !== 'string' && activeTemplate) {
                    const tierVol = templateVolumes.find(v => v.tierId === taskData.tierId);
                    if (tierVol) targetVolumeId = tierVol.volumeId;
                    else if (templateVolumes.length > 0) {
                        const templateLevelVol = templateVolumes.find(v => !v.tierId);
                        if (templateLevelVol) targetVolumeId = templateLevelVol.volumeId;
                    }
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
                const newTotalPoints =
                    (userData?.totalPoints || 0) + (Number(pointsSettings?.dailyTask) || 5);
                const eligibleBadges = badgesLibrary.filter(
                    (b) =>
                        b.requiredPoints != null &&
                        newTotalPoints >= b.requiredPoints &&
                        !myBadges.some((mb) => mb.id === b.id)
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

            const memberRef = doc(db, "members", targetCourse.id, "members", user.uid);
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

    const handleToggleLike = async (tid: string) => {
        if (!user) return;
        const likeRef = doc(db, "testimonial_likes", tid, "testimonial_likes", user.uid);
        const testimonialRef = doc(db, "testimonials", tid);
        const isLiked = myLikedPostIds.has(tid);

        try {
            if (isLiked) {
                await deleteDoc(likeRef);
                await updateDoc(testimonialRef, { likesCount: increment(-1) });
            } else {
                await setDoc(likeRef, { 
                    testimonialId: tid,
                    userId: user.uid, 
                    createdAt: serverTimestamp() 
                });
                await updateDoc(testimonialRef, { likesCount: increment(1) });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
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
                            <p className="text-sm text-muted-foreground italic font-medium">
                                {`"سيتم إشعارك فور قبول طلبك، نسأل الله لك التوفيق والسداد."`}
                            </p>
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
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-32 font-arabic" dir="rtl">
            {/* Motivation Header */}
            <motion.div 
                initial={{ opacity: 0, y: -30 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 bg-white/5 border border-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden card-shine"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full -ml-32 -mb-32" />
                
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-10 w-full lg:w-auto">
                    <div className="relative group mx-auto md:mx-0">
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-gradient-to-br from-primary via-primary/80 to-purple-600 p-[2px] shadow-2xl shadow-primary/20 transition-all duration-500"
                        >
                            <div className="w-full h-full rounded-[0.9rem] md:rounded-[1.3rem] bg-[#0a0a0a] flex items-center justify-center overflow-hidden border-2 border-black/20">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-primary/30" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 -right-1 md:-bottom-1.5 md:-right-1.5 px-2.5 md:px-3 py-0.5 md:py-1 bg-amber-500 text-white text-[7px] md:text-xs font-black rounded-lg shadow-2xl border-2 border-[#0a0a0a] flex items-center gap-1"
                        >
                            <Trophy className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current animate-pulse" /> 
                            <span>{userData?.totalPoints || 0} XP</span>
                        </motion.div>
                    </div>
                    
                    <div className="text-center md:text-right space-y-2">
                        <div className="space-y-0.5">
                            <h1 className="text-xl md:text-2xl font-black tracking-tight flex flex-col md:flex-row items-center gap-2.5 text-white">
                                {user?.displayName || "طالب العلم"}
                                <span className={cn(
                                    "px-3 py-0.5 text-[7px] md:text-[9px] font-black rounded-full border border-current/10 uppercase tracking-[0.15em] shadow-xl backdrop-blur-md", 
                                    getLevelInfo(userData?.totalPoints || 0).bg, 
                                    getLevelInfo(userData?.totalPoints || 0).color
                                )}>
                                    {getLevelInfo(userData?.totalPoints || 0).label}
                                </span>
                            </h1>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                            <div className="flex items-center gap-2 text-orange-500 font-black text-[9px] md:text-xs px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-lg shadow-orange-500/5">
                                <Flame className="w-3.5 h-3.5 animate-bounce" />
                                <span>الالتزام: {Number(userData?.streak) || 0} يوم</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black opacity-60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-widest">
                                <Target className="w-3 h-3 text-primary" />
                                <span>المستوى {getLevelInfo(userData?.totalPoints || 0).rank} / 4</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner group transition-all hover:bg-white/10">
                        <ActivityChart logs={lastWeekLogs} />
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBellLink className="h-11 w-11 border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/30 text-muted-foreground hover:text-primary" />
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/students/profile')} 
                            className="p-3.5 bg-white/5 hover:bg-primary/20 rounded-xl transition-all border border-white/10 hover:border-primary/30 group shadow-2xl relative"
                        >
                            <UserIcon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/settings')} 
                            className="p-3.5 bg-white/5 hover:bg-primary/20 rounded-xl transition-all border border-white/10 hover:border-primary/30 group shadow-2xl relative"
                        >
                            <Settings className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Live Sessions */}
            <AnimatePresence>
                {activeSessions.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <div className="flex items-center gap-2 px-4 md:px-6"><Radio className="w-5 h-5 text-red-500 animate-pulse" /><h3 className="text-xl font-black">تسميع مباشر الآن</h3></div>
                        <div className="flex flex-wrap gap-4 md:gap-5">
                            {activeSessions.map(session => (
                                <GlassCard key={session.id} className="flex-1 min-w-[280px] md:min-w-[320px] p-2.5 md:p-4 border-red-500/20 bg-red-500/5 relative group overflow-hidden rounded-xl">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="space-y-0.5">
                                            <div className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> {session.type === 'video' ? 'بث فيديو' : 'صوتي مباشر'}</div>
                                            <h4 className="text-base font-black tracking-tight">{session.title}</h4>
                                            <p className="text-[9px] opacity-50">المبادر: {session.creatorName}</p>
                                        </div>
                                        <button onClick={() => handleJoinSession(session)} className="px-3.5 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-lg shadow-red-500/20 active:scale-95 transition-all">دخول <ArrowUpRight className="w-3 h-3" /></button>
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
                    <section className="space-y-4">
                        <h3 className="text-xl font-black flex items-center gap-3 px-2"><Calendar className="w-5 h-5 text-primary" /> أكمل وردك اليومي</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courses.filter(c => joinedCourseIds.has(c.id)).map((course) => {
                                const status = dailyWirdStatuses.find(s => s.courseId === course.id);
                                const todayPages = status?.totalTodayPages || 0;
                                const minPages = status?.dailyMinPages || Number(course.dailyMinPages || 1);
                                const done = todayPages >= minPages;
                                return (
                                    <GlassCard key={`daily-${course.id}`} className={cn("p-5 rounded-2xl border", done ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-black text-sm truncate">{course.title}</p>
                                            <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg", done ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                                                {done ? "مكتمل" : "قيد المتابعة"}
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-70 mt-2">اليوم: {todayPages} / {minPages} صفحة</p>
                                        <Link href={`/students/courses/${course.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-black text-primary hover:underline">
                                            أكمل الورد الآن <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="space-y-6">
                    <div className="space-y-1 px-2">
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-primary" /> دوراتي الحالية
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                            استخدم «متابعة المنهج اليومي» للدخول إلى الخطة والمهام، أو «تفاصيل الدورة» للموارد والمستويات. يمكنك أيضاً النقر على البطاقة لتعيين الدورة النشطة في البوابة.
                        </p>
                    </div>
                    {joinedCourseIds.size > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.filter(c => joinedCourseIds.has(c.id)).map(course => (
                                <CourseCard key={course.id} course={course} isJoined={true} isActive={activeCourse?.id === course.id} onSelect={() => setActiveCourse(course)} />
                            ))}
                        </div>
                    ) : (
                        <GlassCard className="p-8 md:p-10 text-center space-y-3 rounded-2xl border-dashed border-white/10 bg-white/[0.02]">
                            <BookOpen className="w-10 h-10 mx-auto text-primary/40" />
                            <p className="text-sm md:text-base font-bold text-foreground">لا توجد دورات مسجّل بها حالياً</p>
                            <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                                إن كنت منضماً لحلقة دون تسجيل في دورة، قد تظهر حلقتك أدناه. يمكنك استكشاف الدورات المتاحة أو التواصل مع الإدارة لتأكيد اشتراكك.
                            </p>
                        </GlassCard>
                    )}
                </section>

                {joinedGroupIds.size > 0 && (
                    <section className="space-y-6">
                        <h3 className="text-2xl font-black flex items-center gap-3 px-2">
                            <Users className="w-6 h-6 text-violet-400" /> حلقاتي
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.filter((g) => joinedGroupIds.has(g.id)).map((g) => {
                                const isPrimaryGroup = userData?.groupId === g.id;
                                const firstEnrolledCourse = courses.find((c) =>
                                    joinedCourseIds.has(c.id)
                                );
                                return (
                                    <GlassCard
                                        key={g.id}
                                        className="flex flex-col gap-4 p-5 rounded-xl border-white/10 bg-white/[0.03]"
                                    >
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-black text-base">{g.name}</p>
                                                {isPrimaryGroup && (
                                                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                                                        حلقتك
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                                                {g.gender === "female" ? "حلقة نسائية" : "حلقة رجالية"}
                                            </p>
                                            <div className="mt-3 space-y-1.5 text-[10px] font-bold text-muted-foreground/80">
                                                <p className="flex items-center gap-2">
                                                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    {g.schedule.startTime} – {g.schedule.endTime}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    <span className="truncate">
                                                        {g.schedule.recitationDays?.join(" • ") || "—"}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-4">
                                            {firstEnrolledCourse && (
                                                <Link
                                                    href={`/students/courses/${firstEnrolledCourse.id}/plan`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-center text-[10px] font-black text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
                                                >
                                                    متابعة المنهج اليومي
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                </Link>
                                            )}
                                            <Link
                                                href="/students#student-daily-plan"
                                                className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-[10px] font-black text-foreground transition-colors hover:bg-white/10"
                                            >
                                                ورد اليوم في البوابة
                                            </Link>
                                            <Link
                                                href="/notifications"
                                                className="flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-center text-[9px] font-bold text-muted-foreground transition-colors hover:text-primary"
                                            >
                                                التواصل مع الطاقم
                                            </Link>
                                        </div>
                                    </GlassCard>
                                );
                            })}
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 md:px-4">
                    <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-black flex items-center gap-3 text-primary"><Library className="w-6 h-6" /> مسار إنجاز المجلدات المطلوبة</h3>
                        <p className="text-muted-foreground text-xs md:text-sm font-medium italic">
                            {`"وخيرُ العلم ما ضُبطت أصولُه.."`}
                        </p>
                    </div>
                    
                    {/* Aggregated Progress Card */}
                    {(activeTemplate || activeCourse?.folderId) && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-primary/10 border border-primary/20 rounded-xl md:rounded-2xl p-2.5 md:p-3.5 flex items-center gap-3 md:gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative w-10 h-10 md:w-14 md:h-14">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="20" cy="20" r="18" fill="transparent" stroke="currentColor" strokeWidth="2.5" className="text-white/5 md:hidden" />
                                    <circle cx="28" cy="28" r="25" fill="transparent" stroke="currentColor" strokeWidth="3.5" className="text-white/5 hidden md:block" />
                                    <motion.circle 
                                        cx="20" cy="20" r="18" fill="transparent" stroke="currentColor" strokeWidth="2.5" 
                                        className="text-primary md:hidden"
                                        strokeDasharray={113}
                                        initial={{ strokeDashoffset: 113 }}
                                        animate={{ 
                                            strokeDashoffset: 113 - (113 * Math.min(
                                                (Object.entries(volumeProgress)
                                                    .filter(([vid]) => templateVolumes.some(tv => tv.volumeId === vid) || courseVolumes.includes(vid) || activeCourse?.folderId === vid)
                                                    .reduce((acc, [, val]) => acc + val, 0) / 
                                                (SUNNAH_VOLUMES
                                                    .filter(v => templateVolumes.some(tv => tv.volumeId === v.id) || courseVolumes.includes(v.id) || activeCourse?.folderId === v.id)
                                                    .reduce((acc, v) => acc + v.totalPages, 0) || 1)
                                                ), 1)
                                            ) 
                                        }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                    <motion.circle 
                                        cx="28" cy="28" r="25" fill="transparent" stroke="currentColor" strokeWidth="3.5" 
                                        className="text-primary hidden md:block"
                                        strokeDasharray={157}
                                        initial={{ strokeDashoffset: 157 }}
                                        animate={{ 
                                            strokeDashoffset: 157 - (157 * Math.min(
                                                (Object.entries(volumeProgress)
                                                    .filter(([vid]) => templateVolumes.some(tv => tv.volumeId === vid) || courseVolumes.includes(vid) || activeCourse?.folderId === vid)
                                                    .reduce((acc, [, val]) => acc + val, 0) / 
                                                (SUNNAH_VOLUMES
                                                    .filter(v => templateVolumes.some(tv => tv.volumeId === v.id) || courseVolumes.includes(v.id) || activeCourse?.folderId === v.id)
                                                    .reduce((acc, v) => acc + v.totalPages, 0) || 1)
                                                ), 1)
                                            ) 
                                        }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[7px] md:text-[9px] font-black">
                                    {Math.round((Object.entries(volumeProgress)
                                        .filter(([vid]) => templateVolumes.some(tv => tv.volumeId === vid) || courseVolumes.includes(vid) || activeCourse?.folderId === vid)
                                        .reduce((acc, [, val]) => acc + val, 0) / 
                                    (SUNNAH_VOLUMES
                                        .filter(v => templateVolumes.some(tv => tv.volumeId === v.id) || courseVolumes.includes(v.id) || activeCourse?.folderId === v.id)
                                        .reduce((acc, v) => acc + v.totalPages, 0) || 1)) * 100)}%
                                </div>
                            </div>
                            <div className="space-y-0 relative z-10">
                                <div className="text-[7px] md:text-[9px] font-black text-primary uppercase tracking-widest opacity-70">الإنجاز الكلي</div>
                                <div className="text-base md:text-lg font-black flex items-baseline gap-1.5">
                                    <span className="text-xl md:text-2xl tracking-tighter">
                                        { (SUNNAH_VOLUMES
                                            .filter(v => templateVolumes.some(tv => tv.volumeId === v.id) || courseVolumes.includes(v.id) || activeCourse?.folderId === v.id)
                                            .reduce((acc, v) => acc + v.totalPages, 0)) - 
                                          (Object.entries(volumeProgress)
                                            .filter(([vid]) => templateVolumes.some(tv => tv.volumeId === vid) || courseVolumes.includes(vid) || activeCourse?.folderId === vid)
                                            .reduce((acc, [, val]) => acc + val, 0)) }
                                    </span>
                                    <span className="text-[9px] opacity-50">متبقية</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {SUNNAH_VOLUMES
                        .filter(volume => {
                            const isTarget = templateVolumes.some(tv => tv.volumeId === volume.id) || courseVolumes.includes(volume.id) || activeCourse?.folderId === volume.id;
                            return isTarget;
                        })
                        .map(volume => {
                            const completed = volumeProgress[volume.id] || 0;
                            const percent = Math.min(Math.round((completed / volume.totalPages) * 100), 100);
                            return (
                                <GlassCard key={volume.id} className={cn("p-3.5 md:p-4.5 hover:-translate-y-1 transition-all duration-500 overflow-hidden relative group rounded-xl", percent >= 100 ? "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/10" : "bg-white/[0.01]")}>
                                    <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-150", "bg-gradient-to-br " + volume.color)} />
                                    <div className="space-y-2.5 md:space-y-3.5 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br shadow-xl transform group-hover:rotate-12 transition-transform", volume.color)}>{percent >= 100 ? <Trophy className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" /> : <BookOpen className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />}</div>
                                            <div className="text-left"><p className="text-lg md:text-xl font-black tracking-tighter opacity-80">{percent}%</p></div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs md:text-sm mb-0.5 truncate">{volume.title}</h4>
                                            <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest">{completed} / {volume.totalPages} مـادة</p>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden shadow-inner relative">
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

            {/* Daily ورد — مرساة للتنقل من بطاقات الحلقة/الدورة */}
            <section
                id="student-daily-plan"
                className="scroll-mt-28 space-y-6"
                aria-label="ورد اليوم والمتابعة اليومية"
            >
            {isEnrolled && todayPlan ? (
                <div className="space-y-8">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                             <h3 className="text-2xl font-black flex items-center gap-3 text-primary"><Calendar className="w-6 h-6" /> ورد اليوم {todayPlan.dayIndex}</h3>
                             <p className="text-muted-foreground italic font-medium">{`"نور العلم في العمل به.."`}</p>
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
                                <GlassCard key={idx} className={cn("p-4 md:p-6 cursor-pointer transition-all border-l-4 group relative rounded-2xl", isDone ? "border-emerald-500 bg-emerald-500/5 opacity-80 shadow-emerald-500/5" : `border-transparent bg-white/[0.02] hover:bg-white/[0.04] flex flex-col`)} onClick={() => handleToggleTask(taskData, !isDone)}>
                                    <div className="flex items-center gap-4 md:gap-5">
                                        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all duration-500", isDone ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-white/5 text-muted-foreground")}>
                                            {isLoggingDaily ? <Loader2 className="animate-spin" /> : isDone ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-current opacity-30" />}
                                        </div>
                                        <div className="flex-1 space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                {typeof taskData !== 'string' && <div className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", accentColor)} />}
                                                <p className={cn("text-base md:text-lg font-black transition-all leading-tight", isDone && "line-through opacity-50")}>{taskLabel}</p>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded uppercase tracking-widest">+5 XP</div>
                                                {typeof taskData !== 'string' && taskData.type === 'hadiths' && <span className="text-[8px] opacity-40 font-bold uppercase tracking-widest flex items-center gap-1"><Hash className="w-2.5 h-2.5" /> أحاديث</span>}
                                                {typeof taskData !== 'string' && taskData.type === 'pages' && <span className="text-[8px] opacity-40 font-bold uppercase tracking-widest flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" /> صفحات</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {!isDone && typeof taskData !== 'string' && (taskData.start || taskData.end) && (
                                        <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                                            <p className="text-[10px] font-bold opacity-60 flex items-center gap-1.5">
                                                <Target className="w-3.5 h-3.5 text-primary" />
                                                نطاق المهمة: {taskData.start} {taskData.end ? `إلى ${taskData.end}` : ''}
                                            </p>
                                        </div>
                                    )}
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <GlassCard className="space-y-4 p-6 md:p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                    <Calendar className="mx-auto h-9 w-9 text-primary/40" />
                    <h3 className="text-base font-black text-foreground">ورد اليوم والمهام اليومية</h3>
                    <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
                        عند تسجيلك في دورة وتفعيلها من «دوراتي الحالية» يظهر هنا وردك ومهامك. يمكنك فتح المنهج مباشرة من زر «متابعة المنهج اليومي» على بطاقة الدورة.
                    </p>
                    {courses.some((c) => joinedCourseIds.has(c.id)) && (
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {courses
                                .filter((c) => joinedCourseIds.has(c.id))
                                .map((c) => (
                                    <Link
                                        key={c.id}
                                        href={`/students/courses/${c.id}/plan`}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[10px] font-black text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                                    >
                                        منهج: {c.title}
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                ))}
                        </div>
                    )}
                </GlassCard>
            )}
            </section>

            {/* Gamification: Badges & History */}
            <div className="grid lg:grid-cols-3 gap-8 pt-6">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-3 text-amber-500 px-4"><Award className="w-6 h-6" /> خزانة الأوسمة الملكية</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {myBadges.length > 0 ? myBadges.map((badge) => {
                            const IconComp = AVAILABLE_ICONS.find(i => i.key === badge.iconKey)?.icon || Star;
                            return (
                                <GlassCard key={badge.id} className="p-5 flex flex-col items-center text-center gap-3 group hover:-translate-y-1 transition-all rounded-xl">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-xl group-hover:rotate-12 transition-all", badge.color)}><IconComp className="w-7 h-7" /></div>
                                    <h4 className="font-black text-[11px] leading-tight">{badge.name}</h4>
                                    <p className="text-[9px] opacity-40 italic">{badge.rarity === 'diamond' ? 'نادر جداً' : 'وسام ملكي'}</p>
                                </GlassCard>
                            );
                        }) : (
                            <div className="col-span-full py-12 border-2 border-dashed border-white/5 rounded-2xl text-center opacity-20"><Shield className="w-10 h-10 mx-auto mb-3" /><p className="text-xs">ابدأ رحلتك لتجمـع الأوسمة</p></div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3 text-primary"><Zap className="w-5 h-5" /> السجل الأكاديمي</h3>
                        <Link
                            href="/students/records"
                            className="text-xs font-bold text-primary hover:underline underline-offset-2 w-fit"
                        >
                            عرض السجل الأكاديمي الشامل ←
                        </Link>
                    </div>
                    <GlassCard className="p-6 bg-primary/5 space-y-4 rounded-xl">
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {pointsLogs.map(log => (
                                <div key={log.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black", log.type === 'penalty' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>{Number(log.amount) > 0 ? `+${log.amount}` : String(log.amount ?? "")}</div>
                                        <div><p className="text-[10px] font-bold">{log.reason}</p><p className="text-[8px] opacity-30">{log.timestamp?.toDate?.().toLocaleDateString("ar-EG")}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center"><span className="text-[9px] opacity-40 font-black">الرصيد الكلي</span><div className="flex items-center gap-2 text-amber-500"><Coins className="w-4 h-4" /><span className="text-xl font-black">{userData?.totalPoints || 0}</span></div></div>
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
                        <GlassCard key={t.id} className="p-6 md:p-8 h-full flex flex-col justify-between hover:border-primary/40 transition-all rounded-2xl relative overflow-hidden">
                            <div className="space-y-4">
                                <Quote className="w-8 h-8 text-primary opacity-20" />
                                <p className="text-sm md:text-base italic font-medium leading-relaxed">{`"${t.content}"`}</p>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/10">
                                        {t.photoURL ? <img src={t.photoURL} alt={t.studentName} className="w-full h-full object-cover" /> : <div className="text-xs font-black">{t.studentName?.[0]}</div>}
                                    </div>
                                    <span className="text-xs font-black truncate max-w-[100px]">{t.studentName}</span>
                                </div>
                                <button 
                                    onClick={() => handleToggleLike(t.id)} 
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs", 
                                        myLikedPostIds.has(t.id) ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 opacity-60 hover:opacity-100 border border-white/10"
                                    )}
                                >
                                    <Heart className={cn("w-3.5 h-3.5", myLikedPostIds.has(t.id) && "fill-white")} /> 
                                    <span className="font-bold">{t.likesCount || 0}</span>
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Dialogs */}
            <EliteModal 
                isOpen={dialogConfig.isOpen} 
                onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
                title={dialogConfig.title}
                description={dialogConfig.description}
                maxWidth="sm"
                footer={(
                    <button 
                        onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))} 
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm"
                    >
                        فهمت، استمرار
                    </button>
                )}
            >
                <div className="flex flex-col items-center justify-center p-4">
                    <div className={cn(
                        "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4 shadow-inner border", 
                        dialogConfig.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                        {dialogConfig.type === 'success' ? <CheckCircle className="w-10 h-10" /> : <X className="w-10 h-10" />}
                    </div>
                </div>
            </EliteModal>

            <EliteModal 
                isOpen={isTestimonialModalOpen} 
                onClose={() => setIsTestimonialModalOpen(false)}
                title="شارك تجربتك العلمية"
                description="كلماتك قد تكون نبراساً ينير الطريق لزملائك الجدد"
                maxWidth="lg"
                footer={(
                    <button 
                        onClick={handleSubmitTestimonial} 
                        disabled={isSubmittingTestimonial || !newTestimonialContent.trim()} 
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-sm"
                    >
                        {isSubmittingTestimonial ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />} 
                        نشر الخاطرة الآن
                    </button>
                )}
            >
                <div className="p-2">
                    <textarea 
                        value={newTestimonialContent} 
                        onChange={e => setNewTestimonialContent(e.target.value)} 
                        placeholder="ماذا وجدت في رحاب السنة؟ شاركنا أثر العلم في نفسك..." 
                        className="w-full h-48 p-6 bg-white/5 rounded-[2rem] resize-none outline-none border border-white/10 focus:ring-8 focus:ring-primary/5 transition-all font-bold text-base leading-relaxed" 
                    />
                </div>
            </EliteModal>

            {/* Achievement Celebration Modal */}
            <AnimatePresence>
                {celebratedVolume && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCelebratedVolume(null)} className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
                        <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} className="relative bg-background border border-amber-500/30 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl max-w-lg w-full text-center space-y-8 md:space-y-10 overflow-hidden group max-h-[90vh] overflow-y-auto custom-scrollbar">
                           {/* Decorative Elements */}
                            <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
                            
                            <div className="relative pt-4 md:pt-0">
                                <motion.div initial={{ rotate: -15, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", damping: 12 }} className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative z-10">
                                    <Trophy className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
                                </motion.div>
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 rounded-full" />
                            </div>

                            <div className="space-y-4 md:space-y-6 relative z-10">
                                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-amber-500 mb-2">مبارك الإتمام! ✨</h2>
                                <p className="text-lg md:text-xl font-medium opacity-90 leading-relaxed">
                                    هنيئاً لك يا <span className="text-primary font-black underline decoration-amber-500/30 underline-offset-4 md:underline-offset-8 decoration-2 md:decoration-4">{user?.displayName || "طالب العلم"}</span> 
                                    <br /> 
                                    إنجازك التام لـ <span className="text-amber-500 font-black">{celebratedVolume.title}</span>
                                </p>
                                
                                <div className="flex justify-center gap-2 md:gap-3 py-4 md:py-6">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                                            <Star className="h-6 w-6 text-amber-500 fill-current drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] md:h-8 md:w-8" />
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner text-center md:text-right">
                                    <div>
                                        <p className="text-[10px] md:text-[10px] font-black uppercase text-amber-500 tracking-[0.1em] md:tracking-[0.2em] mb-1">إجمالي الصفحات التي ضُبطت</p>
                                        <p className="text-2xl md:text-3xl font-black tracking-tighter">{celebratedVolume.totalPages} صفحة</p>
                                    </div>
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl">
                                        <FileCheck className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 md:pt-4">
                                <button onClick={() => setCelebratedVolume(null)} className="w-full py-4 md:py-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl md:rounded-[2rem] font-black shadow-2xl shadow-amber-500/40 hover:scale-[1.03] active:scale-95 transition-all text-lg md:text-xl flex items-center justify-center gap-3">
                                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                                    تابِع مسير البركة
                                </button>
                                <p className="text-xs md:text-sm opacity-50 font-black tracking-wide italic">
                                    {`"فإذا فرغت فانصب وإلى ربك فارغب"`}
                                </p>
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
        <GlassCard 
            className={cn(
                "p-0 flex flex-col h-full transition-all duration-500 hover:-translate-y-1.5 border-white/5 card-shine group rounded-[1.5rem] md:rounded-[2rem] overflow-hidden", 
                isActive ? "border-primary ring-4 ring-primary/5 bg-primary/5 shadow-2xl shadow-primary/10" : "hover:border-primary/30",
                isJoined && onSelect ? "cursor-pointer" : ""
            )} 
            onClick={isJoined ? () => onSelect?.() : undefined}
        >
            <div className="p-6 md:p-8 space-y-4 md:space-y-6 flex-1">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-lg", 
                        isJoined ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5" : "bg-primary/10 text-primary border-primary/20 shadow-primary/5"
                    )}>
                        {isJoined ? 'نشط' : 'متاح'}
                    </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                    <h4 className="text-xl md:text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{course.title}</h4>
                    <p className="text-[12px] md:text-sm text-muted-foreground font-medium opacity-60 line-clamp-2 md:line-clamp-3 leading-relaxed">{course.description}</p>
                </div>
            </div>
            <div
                className={cn(
                    "mt-auto border-t border-white/5 bg-white/[0.02] px-6 py-4 md:px-8 md:py-6",
                    isJoined ? "flex flex-col gap-3 sm:flex-row sm:items-stretch" : "flex items-center justify-between"
                )}
            >
                {isJoined ? (
                    <>
                        <Link
                            href={`/students/courses/${course.id}/plan`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-[10px] font-black text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                        >
                            متابعة المنهج اليومي
                            <ArrowUpRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Link>
                        <Link
                            href={`/students/courses/${course.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-[10px] font-black text-primary transition-colors hover:bg-white/10"
                        >
                            تفاصيل الدورة
                            <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4 opacity-80" />
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>مجتمع المعرفة</span>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onJoin?.();
                            }}
                            className="px-4 py-2 md:px-6 md:py-2.5 bg-primary text-white text-[9px] md:text-[10px] font-black rounded-lg md:rounded-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all btn-elite"
                        >
                            التحاق
                        </button>
                    </>
                )}
            </div>
        </GlassCard>
    );
}
