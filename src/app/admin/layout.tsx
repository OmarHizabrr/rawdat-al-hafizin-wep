"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { adminDashboardNavItems } from "@/config/navigation";
import { RoleDashboardShell } from "@/components/layout/RoleDashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading, signOut } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (userData && userData.role !== "admin" && userData.role !== "committee") {
                router.push("/"); // Redirect non-admins
            }
        }
    }, [user, userData, loading, router]);

    if (loading || !userData || (userData.role !== "admin" && userData.role !== "committee")) {
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
            title="لوحة الإدارة"
            titleIcon={ShieldCheck}
            searchLabel="بحث"
            navItems={adminDashboardNavItems}
            onSignOut={handleSignOut}
        >
            {children}
        </RoleDashboardShell>
    );
}
