"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap } from "lucide-react";
import { teacherDashboardNavItems } from "@/config/navigation";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading, signOut } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (userData && userData.role !== "teacher") {
                router.push("/"); // Redirect non-teachers
            }
        }
    }, [user, userData, loading, router]);

    if (loading || !userData || userData.role !== "teacher") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        await signOut();
        router.push("/login");
    };

    return (
        <RoleDashboardShell
            title="بوابة المعلم"
            titleIcon={GraduationCap}
            searchLabel="بحث الحلقات"
            navItems={teacherDashboardNavItems}
            onSignOut={handleSignOut}
        >
            {children}
        </RoleDashboardShell>
    );
}
