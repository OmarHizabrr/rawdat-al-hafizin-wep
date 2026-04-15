import type { Timestamp } from "firebase/firestore";
import {
    Award,
    Star,
    Heart,
    Shield,
    Trophy,
    Zap,
    Target,
    Flame,
    Sparkles,
} from "lucide-react";
import type { TierTask } from "@/types/plan";
import type { CoursePlanTrack } from "@/lib/daily-wird";

export type DailyLogDoc = {
    userId: string;
    courseId: string;
    date: string;
    pages?: number;
    completedTasks: string[];
    completed: boolean;
};

export type RecitationSessionRow = {
    id: string;
    targetType?: string;
    targetId?: string;
    url?: string;
    title?: string;
    creatorName?: string;
    type?: string;
};

export type BadgeRow = {
    id: string;
    name?: string;
    iconKey?: string;
    color?: string;
    rarity?: string;
    requiredPoints?: number;
};

export type PointsLogRow = {
    id: string;
    amount?: number;
    reason?: string;
    type?: string;
    timestamp?: { toDate: () => Date };
};

export type CourseWirdStatus = {
    courseId: string;
    totalTodayPages: number;
    dailyMinPages: number;
    usesPerTrackTargets: boolean;
    tracksComplete: number;
    tracksTotal: number;
    incompleteTrackLabels: string[];
};

export type LeaderboardRow = {
    id: string;
    displayName?: string;
    photoURL?: string;
    totalPoints?: number;
};

export interface Course {
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
    planTracks?: CoursePlanTrack[];
}

export interface Group {
    id: string;
    name: string;
    gender: "male" | "female";
    visibility?: "public" | "private";
    schedule: {
        startTime: string;
        endTime: string;
        recitationDays: string[];
    };
}

export interface Testimonial {
    id: string;
    studentName: string;
    content: string;
    likesCount?: number;
    photoURL?: string;
}

export interface PlanDay {
    id?: string;
    dayIndex: number;
    tasks: (string | TierTask)[];
}

export function isDailyWirdDoneForCourse(
    status: CourseWirdStatus | undefined,
    course: Course
): boolean {
    if (!status) return false;
    if (status.usesPerTrackTargets && status.tracksTotal > 0) {
        return status.tracksComplete >= status.tracksTotal;
    }
    const min = status.dailyMinPages || Number(course.dailyMinPages || 1);
    return (status.totalTodayPages || 0) >= min;
}

export const getLevelInfo = (points: number) => {
    if (points >= 1500)
        return { label: "صاحب إتقان", color: "text-amber-500", bg: "bg-amber-500/10", rank: 4 };
    if (points >= 500)
        return { label: "همّة علية", color: "text-purple-500", bg: "bg-purple-500/10", rank: 3 };
    if (points >= 100)
        return { label: "طالب بصيرة", color: "text-blue-500", bg: "bg-blue-500/10", rank: 2 };
    return { label: "بداية النور", color: "text-emerald-500", bg: "bg-emerald-500/10", rank: 1 };
};

export const AVAILABLE_ICONS = [
    { key: "Star", icon: Star },
    { key: "Award", icon: Award },
    { key: "Shield", icon: Shield },
    { key: "Trophy", icon: Trophy },
    { key: "Zap", icon: Zap },
    { key: "Target", icon: Target },
    { key: "Heart", icon: Heart },
    { key: "Flame", icon: Flame },
    { key: "Sparkles", icon: Sparkles },
] as const;

export type DialogConfig = {
    isOpen: boolean;
    type: "success" | "danger" | "warning" | "info";
    title: string;
    description: string;
};
