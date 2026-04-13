"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Key,
    BarChart3,
    LogOut,
    Menu,
    X,
    Loader2,
    BookOpen,
    Layers,
    ShieldCheck,
    Bell,
    Search
} from "lucide-react";
import { UserMenuDropdown } from "@/components/layout/UserMenuDropdown";
// import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsMobile(true);
                setIsSidebarOpen(false);
            } else {
                setIsMobile(false);
                setIsSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const navItems = [
        { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
        { href: "/admin/courses", label: "إدارة الدورات", icon: BookOpen },
        { href: "/admin/plans", label: "قوالب الخطط", icon: Layers },
        { href: "/admin/users", label: "المستخدمين", icon: Users },
        { href: "/admin/access-codes", label: "رموز الوصول", icon: Key },
        { href: "/admin/statistics", label: "الإحصائيات", icon: BarChart3 },
        { href: "/notifications", label: "الإشعارات والمحادثات", icon: Bell },
        // { href: "/admin/settings", label: "الإعدادات", icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-muted/30 text-foreground dir-rtl">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 right-0 z-50 w-72 border-l border-border bg-card shadow-sm transition-transform duration-200 ease-out dark:bg-card ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
                    } ${isMobile ? "" : "lg:static lg:translate-x-0"}`}
            >
                <div className="flex items-center justify-between border-b border-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">لوحة الإدارة</h1>
                    </div>
                    {isMobile && (
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <nav className="space-y-1 p-4">
                    <p className="px-3 py-2 text-xs font-medium text-muted-foreground">القائمة</p>
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href === "/notifications" && pathname.startsWith("/notifications"));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "opacity-100" : "opacity-80"}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full border-t border-border p-4">
                    <button
                        type="button"
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 rounded-lg p-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <LogOut className="h-5 w-5" />
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col overflow-hidden bg-background">
                {/* Header */}
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 sm:flex">
                            <span className="text-xs text-muted-foreground">بحث</span>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <UserMenuDropdown />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {children}
                </main>
            </div>

            {/* Overlay for mobile sidebar */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
