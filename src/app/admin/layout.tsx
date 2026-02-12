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
    Settings,
    LogOut,
    Menu,
    X,
    Loader2
} from "lucide-react";
// import { ThemeToggle } from "@/components/theme-toggle";
import { GlassCard } from "@/components/ui/GlassCard";

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
            } else if (userData && userData.role !== "admin") {
                router.push("/"); // Redirect non-admins
            }
        }
    }, [user, userData, loading, router]);

    if (loading || !userData || userData.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const navItems = [
        { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
        { href: "/admin/users", label: "المستخدمين", icon: Users },
        { href: "/admin/access-codes", label: "رموز الوصول", icon: Key },
        { href: "/admin/statistics", label: "الإحصائيات", icon: BarChart3 },
        // { href: "/admin/settings", label: "الإعدادات", icon: Settings },
    ];

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 text-foreground dir-rtl">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 right-0 z-50 w-64 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-l border-white/20 shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
                    } ${isMobile ? "" : "lg:static lg:translate-x-0"}`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        لوحة الإدارة
                    </h1>
                    {isMobile && (
                        <button onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "hover:bg-gray-100 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 bg-white/50 dark:bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4 mr-auto">
                        {/* ThemeToggle could go here */}
                        <div className="flex items-center gap-3">
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-bold">{userData.displayName || "Admin"}</p>
                                <p className="text-xs text-muted-foreground">مسؤول النظام</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {(userData.displayName?.[0] || "A").toUpperCase()}
                            </div>
                        </div>
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
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
