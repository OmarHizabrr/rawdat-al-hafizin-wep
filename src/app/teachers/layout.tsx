"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Loader2
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
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

    const navItems = [
        { href: "/teachers", label: "الحلقات", icon: LayoutDashboard },
    ];

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 text-foreground dir-rtl">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 right-0 z-50 w-64 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-l border-white/20 shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
                    } ${isMobile ? "" : "lg:static lg:translate-x-0"}`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white/50 backdrop-blur-md">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        لوحة المعلم
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
                        );
                    })}

                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 hover:text-red-600 transition-colors mt-8"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">تسجيل الخروج</span>
                    </button>
                </nav>
            </aside>

            {/* Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 min-w-0 transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-white/50 dark:bg-black/50 backdrop-blur-xl border-b border-white/10">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-white/10 lg:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4 mr-auto">
                        <div className="flex items-center gap-3">
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-bold">{userData.displayName || "المعلم"}</p>
                                <p className="text-xs text-muted-foreground capitalize">{userData.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px]">
                                <div className="w-full h-full rounded-full bg-background overflow-hidden relative">
                                    {userData.photoURL ? (
                                        <img
                                            src={userData.photoURL}
                                            alt={userData.displayName || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                                            {userData.displayName?.[0]?.toUpperCase() || "T"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
