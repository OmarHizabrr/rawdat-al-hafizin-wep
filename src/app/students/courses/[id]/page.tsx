"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Calendar,
    Clock,
    Hourglass,
    BookOpen,
    FileText,
    Video,
    Music,
    Link as LinkIcon,
    ExternalLink,
    ChevronDown,
    Loader2,
    CheckCircle
} from "lucide-react";

interface Course {
    id: string;
    title: string;
    description: string;
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    registrationStart: Timestamp | null;
    registrationEnd: Timestamp | null;
    cost: string;
    mechanism: string;
    features: string[];
}

interface Resource {
    type: string;
    title: string;
    url: string;
}

interface Level {
    id: string;
    name: string;
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    resources: Resource[];
}

export default function CourseDetails() {
    const { id } = useParams<{ id: string }>();
    // const { user } = useAuth(); // Not used for now, public view? Or protected? Flutter implies protected.
    const [course, setCourse] = useState<Course | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCourse = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "courses", id);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    setCourse({ id: snap.id, ...snap.data() } as Course);

                    // Load Levels
                    const levelsRef = collection(db, "courses", id, "levels");
                    // Assuming 'order' field or just simplistic fetch
                    const levelsQ = query(levelsRef);
                    const levelsSnap = await getDocs(levelsQ);
                    const levelsData = levelsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Level[];
                    setLevels(levelsData);
                }
            } catch (error) {
                console.error("Error loading course:", error);
            } finally {
                setLoading(false);
            }
        };
        loadCourse();
    }, [id]);

    const formatDate = (ts: Timestamp | null) => {
        if (!ts) return "غير محدد";
        return ts.toDate().toLocaleDateString("ar-SA");
    };

    const getDuration = (start: Timestamp | null, end: Timestamp | null) => {
        if (!start || !end) return "";
        const diff = end.toDate().getTime() - start.toDate().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return `${days} يوم`;
    };

    const getProgress = (start: Timestamp | null, end: Timestamp | null) => {
        if (!start || !end) return 0;
        const total = end.toDate().getTime() - start.toDate().getTime();
        const elapsed = new Date().getTime() - start.toDate().getTime();
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
            case 'video': return <Video className="w-5 h-5 text-blue-500" />;
            case 'audio': return <Music className="w-5 h-5 text-orange-500" />;
            default: return <LinkIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-8 text-center">
                <GlassCard>
                    <p className="text-muted-foreground">الدورة غير موجودة.</p>
                </GlassCard>
            </div>
        );
    }

    const progress = getProgress(course.startDate, course.endDate);
    const isStarted = course.startDate && new Date() > course.startDate.toDate();

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <BookOpen className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold">{course.title}</h1>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Info Card */}
                    <GlassCard className="space-y-6 p-6">
                        <p className="leading-relaxed text-muted-foreground">{course.description}</p>

                        <div className="h-px bg-gray-100 dark:bg-gray-800" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">البداية</span>
                                </div>
                                <span className="font-bold">{formatDate(course.startDate)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">النهاية</span>
                                </div>
                                <span className="font-bold">{formatDate(course.endDate)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">المدة الزمنية</span>
                                </div>
                                <span className="font-bold text-primary">{getDuration(course.startDate, course.endDate)}</span>
                            </div>
                        </div>

                        {isStarted && (
                            <div className="space-y-2 pt-4">
                                <div className="flex justify-between text-xs font-bold">
                                    <span>تقدم الدورة</span>
                                    <span className="text-primary">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    {/* Course Content */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">محتوى الدورة</h2>

                        {levels.length === 0 ? (
                            <GlassCard className="p-8 text-center text-muted-foreground">
                                لا يوجد محتوى مضاف بعد.
                            </GlassCard>
                        ) : (
                            <div className="space-y-4">
                                {levels.map((level, index) => (
                                    <GlassCard key={level.id} className="p-0 overflow-hidden">
                                        <details className="group">
                                            <summary className="flex items-center gap-4 p-4 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold">{level.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(level.startDate)} - {formatDate(level.endDate)}
                                                    </p>
                                                </div>
                                                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
                                            </summary>

                                            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5">
                                                {(!level.resources || level.resources.length === 0) ? (
                                                    <p className="p-4 text-sm text-muted-foreground text-center">لا توجد موارد مضافة لهذا المستوى.</p>
                                                ) : (
                                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                        {level.resources.map((res, i) => (
                                                            <a
                                                                href={res.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                key={i}
                                                                className="flex items-center gap-3 p-4 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors"
                                                            >
                                                                {getIconForType(res.type)}
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium">{res.title}</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase">{res.type}</p>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    </GlassCard>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Side Info */}
                    <GlassCard className="p-6 space-y-4 sticky top-24">
                        <h3 className="font-bold">آلية البرنامج</h3>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm leading-relaxed">
                            {course.mechanism}
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-800" />

                        <h3 className="font-bold">المميزات</h3>
                        <div className="space-y-3">
                            {course.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
