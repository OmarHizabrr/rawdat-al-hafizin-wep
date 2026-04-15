"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
    className?: string;
    iconClassName?: string;
    title?: string;
};

export function ChatLink({
    className,
    iconClassName,
    title = "المحادثات",
}: Props) {
    return (
        <Link
            href="/notifications?tab=chats"
            title={title}
            aria-label={title}
            className={cn(
                "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                className
            )}
        >
            <MessageCircle className={cn("h-5 w-5", iconClassName)} />
        </Link>
    );
}
