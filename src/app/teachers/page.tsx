"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users, Calendar, Clock, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface GroupModel {
    id: string;
    name: string;
    gender: 'male' | 'female';
    schedule: {
        recitationDays: string[];
        startTime: string;
        endTime: string;
    };
}

export default function TeacherDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [myGroups, setMyGroups] = useState<GroupModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "groups"),
            where("supervisorId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GroupModel[];
            setMyGroups(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded-md" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold">حلقاتي</h1>
                <p className="text-muted-foreground">الحلقات التي تشرف عليها</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map(group => (
                    <GlassCard key={group.id} className="group relative overflow-hidden transition-all hover:border-primary/50">
                        <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-xs font-bold text-white ${group.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                            {group.gender === 'male' ? 'بنين' : 'بنات'}
                        </div>

                        <div className="p-6 space-y-4">
                            <h3 className="text-xl font-bold mb-4">{group.name}</h3>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{group.schedule?.recitationDays?.join(" • ") || "لم يحدد أيام"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{group.schedule?.startTime || "--:--"} - {group.schedule?.endTime || "--:--"}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                <Link 
                                    href={`/teachers/halaqat/${group.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-colors font-medium text-sm"
                                >
                                    <Users className="w-4 h-4" />
                                    <span>إدارة الطلاب</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </GlassCard>
                ))}

                {myGroups.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed">
                        لا توجد حلقات مسندة إليك حالياً.
                    </div>
                )}
            </div>
        </div>
    );
}
