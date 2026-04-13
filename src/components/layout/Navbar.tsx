"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    BookOpen,
    GraduationCap,
    Users,
    Home,
    LogOut,
    User,
    ShieldCheck,
    LayoutDashboard,
    Sparkles,
    Bell,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { UserMenuDropdown } from "@/components/layout/UserMenuDropdown";
import { NotificationBellLink } from "@/components/layout/NotificationBellLink";
import { useEffect } from "react";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const pathname = usePathname();
    const { user, userData, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const handleLogout = async () => {
        await signOut();
        setIsOpen(false);
        router.push("/login");
    };

    const navItems = [
        { name: "الرئيسية", href: "/", icon: Home },
        { name: "التعريف بالبرنامج", href: "/about", icon: BookOpen },
        { name: "بوابة الطلاب", href: "/students", icon: Users },
    ];

    if (userData?.role === 'admin' || userData?.role === 'committee') {
        navItems.push({ name: "الإدارة", href: "/admin", icon: ShieldCheck });
    } else if (userData?.role === 'teacher') {
        navItems.push({ name: "لوحة المعلم", href: "/teachers", icon: GraduationCap });
    }

    const hideNavbar =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/teachers") ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/access-code";

    if (hideNavbar) {
        return null;
    }

    const studentLike =
        userData?.role === "student" || userData?.role === "applicant";
    const drawerProfileHref = studentLike ? "/students/profile" : "/profile";
    const drawerRecordsHref = studentLike ? "/students/records" : "/records";

    return (
        <>
            <nav
                className={cn(
                    "fixed left-3 right-3 top-3 z-50 mx-auto max-w-7xl rounded-xl border border-border bg-card/95 px-4 py-2.5 shadow-sm backdrop-blur-sm transition-transform duration-300 md:left-4 md:right-4 md:top-4 md:px-5 md:py-3",
                    !isVisible && !isOpen ? "-translate-y-[150%]" : "translate-y-0"
                )}
            >
                <div className="flex flex-row-reverse items-center justify-between md:flex-row">
                    <Link href="/" className="relative z-50 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-border">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="hidden flex-col sm:flex">
                            <span className="text-base font-semibold leading-tight text-foreground">روضة الحافظين</span>
                            <span className="text-[11px] text-muted-foreground">تحفيظ السنة النبوية</span>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-1 md:flex">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-background hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        {user ? (
                            <UserMenuDropdown variant="navbar" />
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                            >
                                تسجيل الدخول
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        {user ? <NotificationBellLink className="h-10 w-10" /> : null}
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground"
                        >
                            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[45] bg-black/40 md:hidden"
                        />

                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 32, stiffness: 320 }}
                            className="fixed bottom-4 right-3 top-16 z-50 flex w-[min(100%,22rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg md:hidden"
                        >
                            <div className="flex items-center justify-between border-b border-border p-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <span className="text-base font-semibold text-foreground">القائمة</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {user && (
                                <div className="flex items-center gap-3 border-b border-border p-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-sm font-semibold text-primary">
                                        {userData?.photoURL ? (
                                            <img src={userData.photoURL} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            (userData?.displayName?.[0] || "U").toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-foreground">{userData?.displayName || "مستخدم"}</p>
                                        <p className="text-xs text-muted-foreground">مسجل الدخول</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-hide">
                                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">التنقل</p>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                                            pathname === item.href
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {item.name}
                                    </Link>
                                ))}

                                {user && (
                                    <div className="space-y-1 border-t border-border pt-3">
                                        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">حسابي</p>
                                        <Link
                                            href="/notifications"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            <Bell className="h-5 w-5 shrink-0" />
                                            الإشعارات والمحادثات
                                        </Link>
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            <Settings className="h-5 w-5 shrink-0" />
                                            الإعدادات
                                        </Link>
                                        <Link
                                            href={drawerProfileHref}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            <User className="h-5 w-5 shrink-0" />
                                            الملف الشخصي
                                        </Link>
                                        <Link
                                            href={drawerRecordsHref}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            <LayoutDashboard className="h-5 w-5 shrink-0" />
                                            {studentLike
                                                ? "السجل الأكاديمي الشامل"
                                                : "سجل الإنجازات"}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border p-3">
                                {user ? (
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        تسجيل الخروج
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground shadow-sm"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        تسجيل الدخول
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
