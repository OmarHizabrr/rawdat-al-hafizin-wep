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
    FileText,
    Home,
    LogOut,
    User,
    ShieldCheck,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user, userData, signOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        setIsOpen(false);
        router.push("/login");
    };

    const navItems = [
        { name: "الرئيسية", href: "/", icon: Home },
        { name: "بوابة الطلاب", href: "/students", icon: Users },
        // { name: "المعلمين", href: "/teachers", icon: GraduationCap },
        // { name: "السجلات", href: "/records", icon: FileText },
    ];

    if (userData?.role === 'admin' || userData?.role === 'committee') {
        navItems.push({ name: "الإدارة", href: "/admin", icon: ShieldCheck });
    } else if (userData?.role === 'teacher') {
        navItems.push({ name: "لوحة المعلم", href: "/teachers", icon: GraduationCap });
    } else if (userData?.role === 'pending') {
        // Redirect to access code if pending and trying to access other pages
        // This logic might be better in a protected route wrapper, but for navbar we can show a specific item
        return (
            <nav className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-7xl rounded-2xl border border-white/20 bg-white/70 px-6 py-3 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/60 transition-all">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden sm:block">
                            روضة الحافظين
                        </span>
                    </Link>
                    <button onClick={() => signOut()}>تسجيل الخروج</button>
                </div>
            </nav>
        );
    }

    return (
        <nav className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-7xl rounded-2xl border border-white/20 bg-white/70 px-6 py-3 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/60 transition-all">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden sm:block">
                        روضة الحافظين
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute -bottom-[21px] left-0 right-0 h-[3px] w-full bg-primary rounded-t-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}

                    <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2" />

                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link href="/profile">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 hover:bg-primary hover:text-white transition-colors">
                                    {userData?.photoURL ? (
                                        <img src={userData.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        (userData?.displayName?.[0] || "U").toUpperCase()
                                    )}
                                </div>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 rounded-full transition-colors"
                                title="تسجيل الخروج"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            تسجيل الدخول
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 text-muted-foreground hover:text-primary"
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute left-0 right-0 top-full mt-4 flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:bg-black/95 md:hidden"
                    >
                        {user && (
                            <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-white/10 pb-4 mb-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {userData?.photoURL ? (
                                        <img src={userData.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        (userData?.displayName?.[0] || "U").toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sm">{userData?.displayName || "مستخدم"}</p>
                                    <p className="text-xs text-muted-foreground">{user.email || user.phoneNumber}</p>
                                </div>
                            </div>
                        )}

                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                                    pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        ))}

                        {user ? (
                            <>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary text-muted-foreground"
                                >
                                    <User className="h-5 w-5" />
                                    الملف الشخصي
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-500 text-red-500 w-full text-right"
                                >
                                    <LogOut className="h-5 w-5" />
                                    تسجيل الخروج
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="mt-2 w-full py-3 rounded-xl bg-primary text-white font-bold text-center shadow-lg hover:shadow-primary/20"
                            >
                                تسجيل الدخول
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
