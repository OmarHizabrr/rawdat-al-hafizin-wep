"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";

const STUDENT_AREA_ROLES = new Set(["student", "admin", "committee", "applicant"]);

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (userData) {
                // Pending users go to access code
                if (userData.role === 'pending') {
                    router.push("/access-code");
                    return;
                }

                // Allow students, admins, committee, and applicants
                const role = userData.role;
                if (!role || !STUDENT_AREA_ROLES.has(role)) {
                    router.push("/"); // Redirect unauthorized roles
                    return;
                }

                // If applicant, force profile completion
                const pathname = window.location.pathname;
                if (userData.role === 'applicant' && pathname !== '/students/profile') {
                    router.push("/students/profile");
                }
            }
        }
    }, [user, userData, loading, router]);

    if (loading || !userData?.role || !STUDENT_AREA_ROLES.has(userData.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 dir-rtl">
            <main className="mx-auto max-w-7xl space-y-6 p-4 pb-20 pt-24 md:p-8">
                <div className="flex flex-wrap justify-end gap-2">
                    <Link
                        href="/notifications"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                    >
                        <Bell className="h-4 w-4 shrink-0" />
                        الإشعارات والمحادثات
                    </Link>
                </div>
                {children}
            </main>
        </div>
    );
}
