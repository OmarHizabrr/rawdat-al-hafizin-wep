"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { NotificationsCenter } from "@/components/notifications/NotificationsCenter";

export default function NotificationsPage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <NotificationsCenter
            actorId={user.uid}
            displayName={userData?.displayName || user.displayName || "مستخدم"}
            photoURL={userData?.photoURL ?? user.photoURL}
            role={userData?.role}
        />
    );
}
