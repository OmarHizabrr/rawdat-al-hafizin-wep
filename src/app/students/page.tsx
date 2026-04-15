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
import { SUNNAH_VOLUMES, type SunnahVolume } from "@/lib/volumes";
import { PlanTemplate, type TierTask } from "@/types/plan";
import { logSessionAttendance } from "@/lib/recitation-service";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { UserDocument } from "@/lib/user-document";
import {
    getLevelInfo,
    type Course,
    type Group,
    type Testimonial,
    type DailyLogDoc,
    type RecitationSessionRow,
    type BadgeRow,
    type PointsLogRow,
    type LeaderboardRow,
    type PlanDay,
    type CourseWirdStatus,
    type DialogConfig,
} from "./_lib/student-dashboard-types";
import { ApplicantPendingView } from "./_components/ApplicantPendingView";
import { StudentQuickAccessRow } from "./_components/StudentQuickAccessRow";
import { StudentDashboardHero } from "./_components/StudentDashboardHero";
import { StudentLiveSessionsSection } from "./_components/StudentLiveSessionsSection";
import { StudentCoursesGroupsSection } from "./_components/StudentCoursesGroupsSection";
import { StudentVolumesProgressSection } from "./_components/StudentVolumesProgressSection";
import { StudentDailyPlanSection } from "./_components/StudentDailyPlanSection";
import { StudentGamificationSection } from "./_components/StudentGamificationSection";
import { StudentTestimonialsSection } from "./_components/StudentTestimonialsSection";
import { StudentDashboardModals } from "./_components/StudentDashboardModals";

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

    const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
        isOpen: false,
        type: "success",
        title: "",
        description: "",
    });
    const [volumeProgress, setVolumeProgress] = useState<Record<string, number>>({});
    const [activeSessions, setActiveSessions] = useState<RecitationSessionRow[]>([]);

    const [pointsSettings, setPointsSettings] = useState<Record<string, unknown>>({ dailyTask: 5 });
    const [badgesLibrary, setBadgesLibrary] = useState<BadgeRow[]>([]);
    const [myBadges, setMyBadges] = useState<BadgeRow[]>([]);
    const [pointsLogs, setPointsLogs] = useState<PointsLogRow[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<PlanTemplate | null>(null);
    const [templateVolumes, setTemplateVolumes] = useState<{ volumeId: string; tierId?: string }[]>([]);
    const [courseVolumes, setCourseVolumes] = useState<string[]>([]);
    const [celebratedVolume, setCelebratedVolume] = useState<SunnahVolume | null>(null);
    const [dailyWirdStatuses, setDailyWirdStatuses] = useState<CourseWirdStatus[]>([]);

    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch Initial Data
    useEffect(() => {
        if (!user) return;

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const coursesSnap = await getDocs(collection(db, "courses"));
                const allCourses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
                setCourses(allCourses);

                const groupsSnap = await getDocs(collection(db, "groups"));
                const allGroups = groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
                setGroups(allGroups);

                const enrolledChecks = await Promise.all(
                    allCourses.map(async (c) => {
                        const snap = await getDoc(doc(db, "enrollments", c.id, "enrollments", user.uid));
                        return snap.exists() ? c.id : null;
                    })
                );
                const enrolledIds = new Set(enrolledChecks.filter((id) => id !== null) as string[]);
                setJoinedCourseIds(enrolledIds);

                const groupChecks = await Promise.all(
                    allGroups.map(async (g) => {
                        const snap = await getDoc(doc(db, "members", g.id, "members", user.uid));
                        return snap.exists() ? g.id : null;
                    })
                );
                const memberIds = new Set(groupChecks.filter((id) => id !== null) as string[]);
                setJoinedGroupIds(memberIds);

                const active =
                    allCourses.find((c) => enrolledIds.has(c.id)) ||
                    allCourses.find((c) => c.visibility !== "private");
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
            const joined = courses.filter((c) => joinedCourseIds.has(c.id));
            const statuses = await Promise.all(
                joined.map(async (course) => {
                    const entriesQ = query(
                        collection(db, "daily_wird", course.id, "users", user.uid, "entries"),
                        where("date", "==", todayKey)
                    );
                    const snap = await getDocs(entriesQ);
                    const totalTodayPages = snap.docs.reduce(
                        (sum, entry) => sum + Number(entry.data().computedPages || 0),
                        0
                    );
                    const fallbackMin = Number(course.dailyMinPages || 1);
                    const tracks = course.planTracks?.length ? course.planTracks : [];

                    if (tracks.length === 0) {
                        return {
                            courseId: course.id,
                            totalTodayPages,
                            dailyMinPages: fallbackMin,
                            usesPerTrackTargets: false,
                            tracksComplete: 0,
                            tracksTotal: 0,
                            incompleteTrackLabels: [],
                        };
                    }

                    const byTrack: Record<string, number> = {};
                    snap.docs.forEach((entry) => {
                        const data = entry.data();
                        const tid = typeof data.trackId === "string" ? data.trackId : "";
                        if (!tid) return;
                        byTrack[tid] = (byTrack[tid] || 0) + Number(data.computedPages || 0);
                    });

                    let tracksComplete = 0;
                    const incompleteTrackLabels: string[] = [];
                    for (const t of tracks) {
                        const need = Math.max(1, Number(t.dailyRequiredPages ?? fallbackMin));
                        const got = byTrack[t.id] || 0;
                        if (got >= need) tracksComplete += 1;
                        else incompleteTrackLabels.push(`${t.title} (${got}/${need})`);
                    }

                    return {
                        courseId: course.id,
                        totalTodayPages,
                        dailyMinPages: fallbackMin,
                        usesPerTrackTargets: true,
                        tracksComplete,
                        tracksTotal: tracks.length,
                        incompleteTrackLabels,
                    };
                })
            );
            setDailyWirdStatuses(statuses);
        };
        void loadDailyStatuses();
    }, [courses, joinedCourseIds, user]);

    useEffect(() => {
        const q = query(collection(db, "testimonials"), where("isVisible", "==", true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTestimonials(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Testimonial[]);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const q = query(collectionGroup(db, "testimonial_likes"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const likedIds = new Set(snapshot.docs.map((d) => d.data().testimonialId));
            setMyLikedPostIds(likedIds);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!user || !activeCourse) return;

        const fetchData = async () => {
            try {
                const logRef = doc(db, "daily_logs", user.uid, "daily_logs", todayStr);
                const logSnap = await getDoc(logRef);
                if (logSnap.exists()) setDailyLog(logSnap.data() as DailyLogDoc);
                else setDailyLog(null);

                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const qLastWeek = query(
                    collection(db, "daily_logs", user.uid, "daily_logs"),
                    where("userId", "==", user.uid),
                    where("date", ">=", sevenDaysAgo.toISOString().split("T")[0]),
                    orderBy("date", "desc"),
                    limit(7)
                );
                const weekSnap = await getDocs(qLastWeek);
                setLastWeekLogs(weekSnap.docs.map((d) => d.data()));

                const uSnap = await getDoc(doc(db, "users", user.uid));
                if (uSnap.exists()) setUserData(uSnap.data() as UserDocument);

                const settingsRef = doc(db, "points_config", "global", "points_config", "settings");
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) setPointsSettings(settingsSnap.data() as Record<string, unknown>);

                const libSnap = await getDocs(collection(db, "badges_library", "global", "badges_library"));
                setBadgesLibrary(libSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BadgeRow)));

                const myBadgesRef = collection(db, "badges", user.uid, "badges");
                const myBadgesSnap = await getDocs(myBadgesRef);
                setMyBadges(myBadgesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BadgeRow)));

                const logsRef = query(
                    collection(db, "points_logs", user.uid, "points_logs"),
                    orderBy("timestamp", "desc"),
                    limit(10)
                );
                const pLogsSnap = await getDocs(logsRef);
                setPointsLogs(pLogsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PointsLogRow)));

                const qLeaderboard = query(
                    collection(db, "users"),
                    where("role", "==", "student"),
                    orderBy("totalPoints", "desc"),
                    limit(5)
                );
                const lbSnap = await getDocs(qLeaderboard);
                setLeaderboard(lbSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderboardRow)));
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };
        fetchData();

        const fetchPlan = async () => {
            if (!activeCourse.startDate) return;
            const start = activeCourse.startDate.toDate();
            const today = new Date();
            const dayNum = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            try {
                const q = query(
                    collection(db, "course_plans", activeCourse.id, "course_plans"),
                    where("dayIndex", "==", dayNum)
                );
                const snap = await getDocs(q);
                if (!snap.empty) setTodayPlan(snap.docs[0].data() as PlanDay);
                else setTodayPlan(null);

                const cvSnap = await getDocs(collection(db, "course_volumes", activeCourse.id, "course_volumes"));
                setCourseVolumes(cvSnap.docs.map((d) => d.data().volumeId));

                if (activeCourse.planTemplateId) {
                    const tSnap = await getDoc(doc(db, "plan_templates", activeCourse.planTemplateId));
                    if (tSnap.exists()) {
                        setActiveTemplate({ id: tSnap.id, ...tSnap.data() } as PlanTemplate);
                        const tvSnap = await getDocs(collection(db, "template_volumes", tSnap.id, "template_volumes"));
                        setTemplateVolumes(
                            tvSnap.docs.map((d) => ({
                                volumeId: d.data().volumeId,
                                tierId: d.data().tierId,
                            }))
                        );
                    }
                }
            } catch (error) {
                console.error("Error fetching plan/volumes:", error);
            }
        };
        fetchPlan();

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
                    if (vol && completed >= vol.totalPages && prev !== undefined && prev < vol.totalPages) {
                        setCelebratedVolume(vol);
                    }
                });

                setVolumeProgress(aggProgress);
            } catch (error) {
                console.error("Error fetching volumes progress:", error);
            }
        };
        fetchVolumesProgress();

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

        const fetchPointsConfig = async () => {
            const docRef = doc(db, "points_config", "global", "points_config", "settings");
            const snap = await getDoc(docRef);
            if (snap.exists()) setPointsSettings(snap.data() as Record<string, unknown>);
        };
        fetchPointsConfig();

        const qLive = query(collectionGroup(db, "recitation_sessions"), where("status", "==", "active"));
        const unsubscribeLive = onSnapshot(qLive, async (snapshot) => {
            const sessions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RecitationSessionRow));

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
            const taskLabel = typeof taskData === "string" ? taskData : taskData.label;
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
                    completed: false,
                };
                batch.set(logRef, { ...currentLog, createdAt: serverTimestamp() });
            }

            const newTasks = isCompleted
                ? [...(currentLog.completedTasks || []), taskLabel]
                : (currentLog.completedTasks || []).filter((t) => t !== taskLabel);

            const isDayCompleted = newTasks.length === (todayPlan?.tasks?.length || 0);

            batch.update(logRef, {
                completedTasks: newTasks,
                completed: isDayCompleted,
            });

            if (isCompleted) {
                const userRef = doc(db, "users", user.uid);
                const rewardPoints = Number(pointsSettings?.dailyTask) || 5;

                batch.update(userRef, {
                    totalPoints: increment(rewardPoints),
                    lastActiveDate: serverTimestamp(),
                });

                const pointLogRef = doc(collection(db, "points_logs", user.uid, "points_logs"));
                batch.set(pointLogRef, {
                    amount: rewardPoints,
                    reason: `إنجاز مهمة يومية: ${taskLabel}`,
                    timestamp: serverTimestamp(),
                    type: "reward",
                });

                const lastActiveTs = userData?.lastActiveDate as Timestamp | undefined;
                const lastDate = lastActiveTs?.toDate?.()?.toISOString()?.split("T")[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split("T")[0];

                if (lastDate === yesterdayStr) batch.update(userRef, { streak: increment(1) });
                else if (lastDate !== todayStr) batch.update(userRef, { streak: 1 });

                let targetVolumeId = courseVolumes[0] || activeCourse.folderId;
                if (typeof taskData !== "string" && activeTemplate) {
                    const tierVol = templateVolumes.find((v) => v.tierId === taskData.tierId);
                    if (tierVol) targetVolumeId = tierVol.volumeId;
                    else if (templateVolumes.length > 0) {
                        const templateLevelVol = templateVolumes.find((v) => !v.tierId);
                        if (templateLevelVol) targetVolumeId = templateLevelVol.volumeId;
                    }
                }

                if (targetVolumeId) {
                    const volRef = doc(db, "volume_progress", user.uid, "volume_progress", targetVolumeId);
                    batch.set(
                        volRef,
                        {
                            volumeId: targetVolumeId,
                            completedPages: increment(1),
                            lastUpdated: serverTimestamp(),
                        },
                        { merge: true }
                    );
                }
            } else {
                let targetVolumeId = courseVolumes[0] || activeCourse.folderId;
                if (typeof taskData !== "string" && activeTemplate) {
                    const tierVol = templateVolumes.find((v) => v.tierId === taskData.tierId);
                    if (tierVol) targetVolumeId = tierVol.volumeId;
                    else if (templateVolumes.length > 0) {
                        const templateLevelVol = templateVolumes.find((v) => !v.tierId);
                        if (templateLevelVol) targetVolumeId = templateLevelVol.volumeId;
                    }
                }

                if (targetVolumeId) {
                    const volRef = doc(db, "volume_progress", user.uid, "volume_progress", targetVolumeId);
                    batch.set(
                        volRef,
                        {
                            completedPages: increment(-1),
                            lastUpdated: serverTimestamp(),
                        },
                        { merge: true }
                    );
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
                    eligibleBadges.forEach((badge) => {
                        const myBadgeRef = doc(db, "badges", user.uid, "badges", badge.id);
                        bBatch.set(myBadgeRef, { ...badge, earnedAt: serverTimestamp() });
                    });
                    await bBatch.commit();
                    setMyBadges((prev) => [...prev, ...eligibleBadges]);
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
                status: "active",
            });

            const memberRef = doc(db, "members", targetCourse.id, "members", user.uid);
            batch.set(memberRef, {
                userId: user.uid,
                displayName: user.displayName || userData?.displayName || "طالب العلم",
                email: user.email,
                role: "student",
                addedAt: serverTimestamp(),
                photoURL: user.photoURL || userData?.photoURL || "",
            });

            await batch.commit();
            setJoinedCourseIds((prev) => {
                const next = new Set(prev);
                next.add(targetCourse.id);
                return next;
            });
            setDialogConfig({
                isOpen: true,
                type: "success",
                title: "تم الانضمام بنجاح",
                description: `مبارك انضمامك لدورة ${targetCourse.title}. نسأل الله لك النفع والبركة.`,
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
                    createdAt: serverTimestamp(),
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
                createdAt: serverTimestamp(),
            });
            setNewTestimonialContent("");
            setIsTestimonialModalOpen(false);
        } catch (error) {
            console.error("Error submitting testimonial", error);
        } finally {
            setIsSubmittingTestimonial(false);
        }
    };

    if (loading && !activeCourse)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
            </div>
        );

    if (userData?.role === "applicant") {
        return (
            <ApplicantPendingView
                user={user}
                onOpenProfile={() => router.push("/students/profile")}
                onSignOut={() => void signOut()}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-32 font-arabic" dir="rtl">
            <StudentQuickAccessRow
                courses={courses}
                groups={groups}
                joinedCourseIds={joinedCourseIds}
                joinedGroupIds={joinedGroupIds}
            />

            <StudentDashboardHero
                user={user}
                userData={userData}
                lastWeekLogs={lastWeekLogs}
                onProfile={() => router.push("/students/profile")}
                onSettings={() => router.push("/settings")}
            />

            <StudentLiveSessionsSection sessions={activeSessions} onJoinSession={handleJoinSession} />

            <StudentCoursesGroupsSection
                courses={courses}
                groups={groups}
                joinedCourseIds={joinedCourseIds}
                joinedGroupIds={joinedGroupIds}
                userData={userData}
                dailyWirdStatuses={dailyWirdStatuses}
                activeCourse={activeCourse}
                onSelectActiveCourse={setActiveCourse}
                onJoinCourse={handleJoinCourse}
            />

            <StudentVolumesProgressSection
                activeTemplate={activeTemplate}
                activeCourse={activeCourse}
                templateVolumes={templateVolumes}
                courseVolumes={courseVolumes}
                volumeProgress={volumeProgress}
            />

            <StudentDailyPlanSection
                isEnrolled={isEnrolled}
                todayPlan={todayPlan}
                dailyLog={dailyLog}
                isLoggingDaily={isLoggingDaily}
                activeTemplate={activeTemplate}
                courses={courses}
                joinedCourseIds={joinedCourseIds}
                onToggleTask={handleToggleTask}
            />

            <StudentGamificationSection
                user={user}
                userData={userData}
                myBadges={myBadges}
                pointsLogs={pointsLogs}
                leaderboard={leaderboard}
            />

            <StudentTestimonialsSection
                testimonials={testimonials}
                myLikedPostIds={myLikedPostIds}
                onOpenCompose={() => setIsTestimonialModalOpen(true)}
                onToggleLike={handleToggleLike}
            />

            <StudentDashboardModals
                user={user}
                dialogConfig={dialogConfig}
                onCloseDialog={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
                isTestimonialModalOpen={isTestimonialModalOpen}
                onCloseTestimonialModal={() => setIsTestimonialModalOpen(false)}
                newTestimonialContent={newTestimonialContent}
                onTestimonialContentChange={setNewTestimonialContent}
                isSubmittingTestimonial={isSubmittingTestimonial}
                onSubmitTestimonial={() => void handleSubmitTestimonial()}
                celebratedVolume={celebratedVolume}
                onDismissCelebration={() => setCelebratedVolume(null)}
            />
        </div>
    );
}
