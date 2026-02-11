"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, BookOpen, GraduationCap, Users, FileText, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "الطلاب", href: "/students", icon: Users },
    { name: "المعلمين", href: "/teachers", icon: GraduationCap },
    { name: "السجلات", href: "/records", icon: FileText },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <nav className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-7xl rounded-full border border-white/20 bg-white/10 px-6 py-3 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/20">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        روضة الحافظين
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute -bottom-[21px] left-0 right-0 h-[2px] w-full bg-primary"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
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
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute left-0 right-0 top-full mt-4 flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-xl dark:bg-black/90 md:hidden"
                >
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
                </motion.div>
            )}
        </nav>
    );
}
