"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Settings, User, LogOut, Volume2, ScrollText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotificationBadge } from "@/lib/notifications-context";
import { NotificationBellLink } from "@/components/layout/NotificationBellLink";
import { ChatLink } from "@/components/layout/ChatLink";
import { cn } from "@/lib/utils";
function resolvePaths(role: string | undefined) {
    if (role === "student" || role === "applicant") {
        return {
            notifications: "/notifications",
            settings: "/settings",
            profile: "/students/profile",
        };
    }
    return {
        notifications: "/notifications",
        settings: "/settings",
        profile: "/profile",
    };
}

type Props = {
    /** للعرض في الشريط العام: تصميم مدمج */
    variant?: "toolbar" | "navbar";
    className?: string;
};

export function UserMenuDropdown({ variant = "toolbar", className }: Props) {
    const { user, userData, signOut } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const paths = resolvePaths(userData?.role);
    const { unreadCount, requestBrowserPermission } = useNotificationBadge();

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);

    const handleLogout = async () => {
        setOpen(false);
        await signOut();
        router.push("/login");
    };

    if (!user) return null;

    const name =
        userData?.displayName || user.displayName || "حسابي";
    const tagline = userData?.email || user.email || "";
    const photo =
        userData?.photoURL ||
        user.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;

    const triggerClasses =
        variant === "navbar"
            ? "flex items-center gap-2 rounded-lg border border-border bg-muted/30 py-1 pe-2 ps-3 hover:bg-muted/50"
            : "flex items-center gap-3 rounded-lg border border-border bg-muted/30 py-1.5 pe-2 ps-3 hover:bg-muted/50";

    const isStudentPortal =
        userData?.role === "student" || userData?.role === "applicant";

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <NotificationBellLink className="h-10 w-10" />
            <ChatLink className="h-10 w-10" />
            <div className="relative" ref={wrapRef}>
            <button
                type="button"
                className={cn(triggerClasses, "text-start transition-colors")}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <div className="hidden min-w-0 text-right md:block">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{tagline}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={photo}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-border"
                />
            </button>

            {open && (
                <div
                    className="absolute end-0 top-[calc(100%+6px)] z-[80] min-w-[14rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
                    role="menu"
                >
                    <Link
                        role="menuitem"
                        href={paths.profile}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                        onClick={() => setOpen(false)}
                    >
                        <User className="h-4 w-4 shrink-0 opacity-80" />
                        الملف الشخصي
                    </Link>
                    {isStudentPortal && (
                        <Link
                            role="menuitem"
                            href="/records"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                            onClick={() => setOpen(false)}
                        >
                            <ScrollText className="h-4 w-4 shrink-0 opacity-80" />
                            السجل الأكاديمي الشامل
                        </Link>
                    )}
                    <Link
                        role="menuitem"
                        href={paths.notifications}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                        onClick={() => setOpen(false)}
                    >
                        <span className="relative inline-flex shrink-0">
                            <Bell className="h-4 w-4 opacity-80" />
                            {unreadCount > 0 && (
                                <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </span>
                        الإشعارات والمحادثات
                    </Link>
                    <Link
                        role="menuitem"
                        href={paths.settings}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                        onClick={() => setOpen(false)}
                    >
                        <Settings className="h-4 w-4 shrink-0 opacity-80" />
                        الإعدادات
                    </Link>
                    {typeof Notification !== "undefined" &&
                        Notification.permission === "default" && (
                            <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                                onClick={() => void requestBrowserPermission()}
                            >
                                <Volume2 className="h-4 w-4 shrink-0 opacity-80" />
                                تفعيل تنبيهات المتصفح
                            </button>
                        )}
                    <div className="my-1 h-px bg-border" />
                    <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                        onClick={() => void handleLogout()}
                    >
                        <LogOut className="h-4 w-4 shrink-0 opacity-80" />
                        تسجيل الخروج
                    </button>
                </div>
            )}
            </div>
        </div>
    );
}
