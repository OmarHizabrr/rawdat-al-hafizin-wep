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
    LayoutDashboard,
    Sparkles
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
        { name: "التعريف بالبرنامج", href: "/about", icon: BookOpen },
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
        <>
            <nav className={cn(
                "fixed left-4 right-4 top-4 z-50 mx-auto max-w-7xl rounded-2xl border border-white/20 bg-white/70 px-6 py-3 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/60 transition-all",
                user ? "hidden md:block" : "block"
            )}>
            <div className="flex items-center justify-between flex-row-reverse md:flex-row">
                {/* Logo - On the left on mobile (end of RTL row), on the right on desktop (start of RTL row) */}
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 p-[2px] transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-primary/20">
                        <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden sm:block leading-none">
                            روضة الحافظين
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground hidden sm:block">Sunnah Platform</span>
                    </div>
                </Link>

                {/* Desktop Menu - Normal RTL flow */}
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
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                            <Link href="/profile" className="flex items-center gap-3 pr-2">
                                <div className="hidden lg:block text-right">
                                    <p className="text-[10px] font-black text-muted-foreground leading-tight uppercase tracking-wider">الملف الشخصي</p>
                                    <p className="text-sm font-bold text-foreground leading-tight truncate max-w-[100px]">{userData?.displayName || "طالب العلم"}</p>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black border border-primary/20 hover:scale-105 transition-all shadow-lg overflow-hidden shrink-0">
                                    {userData?.photoURL ? (
                                        <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        (userData?.displayName?.[0] || "U").toUpperCase()
                                    )}
                                </div>
                            </Link>
                            <div className="w-px h-6 bg-white/10" />
                            <button
                                onClick={handleLogout}
                                className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all group"
                                title="تسجيل الخروج"
                            >
                                <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-8 py-2.5 rounded-xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all border border-primary/20"
                        >
                            تسجيل الدخول
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button - On the right side in RTL flow (first item with flex-row-reverse) */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 text-muted-foreground hover:text-primary relative z-50"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>
            </nav>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] md:hidden h-screen w-screen -m-10"
                        />
                        
                        {/* Right-side Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 h-screen w-3/4 max-w-sm bg-white dark:bg-slate-950 z-50 p-6 shadow-2xl border-l border-white/20 md:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-primary" />
                                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                        روضة الحافظين
                                    </span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {user && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-8">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                        {userData?.photoURL ? (
                                            <img src={userData.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            (userData?.displayName?.[0] || "U").toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-foreground truncate">{userData?.displayName || "مستخدم"}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email || user.phoneNumber}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 space-y-2">
                                <p className="text-xs font-bold text-muted-foreground/50 px-3 py-1 uppercase tracking-wider">القائمة الرئيسية</p>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 rounded-xl p-4 text-sm font-bold transition-all hover:bg-primary/10 hover:text-primary",
                                            pathname === item.href ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {item.name}
                                    </Link>
                                ))}

                                {user && (
                                    <>
                                        <div className="h-px bg-gray-100 dark:bg-white/10 my-4" />
                                        <p className="text-xs font-bold text-muted-foreground/50 px-3 py-1 uppercase tracking-wider">إعدادات الحساب</p>
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-4 rounded-xl p-4 text-sm font-bold transition-all hover:bg-primary/10 hover:text-primary text-muted-foreground"
                                        >
                                            <User className="h-5 w-5 shrink-0" />
                                            الملف الشخصي
                                        </Link>
                                        <Link
                                            href="/records"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-4 rounded-xl p-4 text-sm font-bold transition-all hover:bg-primary/10 hover:text-primary text-muted-foreground"
                                        >
                                            <LayoutDashboard className="h-5 w-5 shrink-0" />
                                            سجل الإنجازات
                                        </Link>
                                    </>
                                )}
                            </div>

                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-4 rounded-xl p-4 text-sm font-bold transition-all bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 mt-auto"
                                >
                                    <LogOut className="h-5 w-5 shrink-0" />
                                    تسجيل الخروج
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="mt-auto w-full py-4 rounded-xl bg-primary text-white font-bold text-center shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    <LogOut className="h-5 w-5 rotate-180" />
                                    تسجيل الدخول
                                </Link>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation for Students */}
            {user && (
                <div className="fixed bottom-6 left-4 right-4 z-[60] md:hidden">
                    <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] p-2 flex items-center justify-around">
                        <MobileNavItem 
                            href="/" 
                            icon={Home} 
                            label="الرئيسية" 
                            isActive={pathname === "/"} 
                        />
                        <MobileNavItem 
                            href={userData?.role === 'admin' ? "/admin" : userData?.role === 'teacher' ? "/teachers" : "/students"} 
                            icon={userData?.role === 'admin' ? ShieldCheck : userData?.role === 'teacher' ? GraduationCap : LayoutDashboard} 
                            label="لوحتى" 
                            isActive={pathname.startsWith("/students") || pathname.startsWith("/admin") || pathname.startsWith("/teachers")} 
                        />
                        <div className="relative -top-6">
                            <Link href={userData?.role === 'admin' ? "/admin" : userData?.role === 'teacher' ? "/teachers" : "/students"}>
                                <div className="w-14 h-14 bg-gradient-to-tr from-primary to-purple-600 rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center text-white rotate-45 group hover:scale-110 hover:rotate-90 transition-all duration-500">
                                    <div className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                        <MobileNavItem 
                            href="/profile" 
                            icon={User} 
                            label="ملفي" 
                            isActive={pathname === "/profile"} 
                        />
                        <button 
                            onClick={() => setIsOpen(true)}
                            className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all text-muted-foreground hover:text-primary active:scale-95"
                        >
                            <Menu className="w-5 h-5" />
                            <span className="text-[10px] font-black">المزيد</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function MobileNavItem({ href, icon: Icon, label, isActive }: { href: string, icon: any, label: string, isActive: boolean }) {
    return (
        <Link href={href} className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
            isActive ? "text-primary scale-110" : "text-muted-foreground"
        )}>
            <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[10px] font-black">{label}</span>
            {isActive && (
                <motion.div layoutId="mobile-nav-dot" className="w-1 h-1 bg-primary rounded-full" />
            )}
        </Link>
    );
}
