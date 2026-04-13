"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationBadge } from "@/lib/notifications-context";

type Props = {
    className?: string;
    iconClassName?: string;
    title?: string;
};

export function NotificationBellLink({
    className,
    iconClassName,
    title = "الإشعارات والمحادثات",
}: Props) {
    const { unreadCount } = useNotificationBadge();

    return (
        <Link
            href="/notifications"
            title={title}
            aria-label={title}
            className={cn(
                "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                className
            )}
        >
            <Bell className={cn("h-5 w-5", iconClassName)} />
            {unreadCount > 0 && (
                <span className="absolute top-0.5 end-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </Link>
    );
}
