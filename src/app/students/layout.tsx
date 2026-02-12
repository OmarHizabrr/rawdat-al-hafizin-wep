"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

                // Allow students, admins, and committee
                // Teachers might not have access to student portal actions
                const allowedRoles = ['student', 'admin', 'committee'];
                if (!allowedRoles.includes(userData.role)) {
                    router.push("/"); // Redirect unauthorized roles
                }
            }
        }
    }, [user, userData, loading, router]);

    if (loading || !userData || !['student', 'admin', 'committee'].includes(userData.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 dir-rtl">
            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pt-24 pb-20">
                {children}
            </main>
        </div>
    );
}
