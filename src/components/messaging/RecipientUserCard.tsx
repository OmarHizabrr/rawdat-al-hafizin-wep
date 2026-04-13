"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type RecipientCardUser = {
    id: string;
    displayName?: string | null;
    email?: string | null;
    role?: string;
    phoneNumber?: string;
    photoURL?: string | null;
};

function avatarSrc(u: RecipientCardUser) {
    if (u?.photoURL) return u.photoURL;
    const n = encodeURIComponent(u?.displayName || u?.email || u?.id || "?");
    return `https://ui-avatars.com/api/?name=${n}&background=6366f1&color=fff`;
}

type Props = {
    user: RecipientCardUser;
    checked: boolean;
    onToggle: (next: boolean) => void;
    profileHref: string | null;
    roleLabel?: string;
};

export function RecipientUserCard({
    user: u,
    checked,
    onToggle,
    profileHref,
    roleLabel,
}: Props) {
    return (
        <div
            role="button"
            tabIndex={0}
            className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-start transition-colors",
                checked
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:bg-muted/40"
            )}
            onClick={() => onToggle(!checked)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(!checked);
                }
            }}
        >
            <input
                type="checkbox"
                checked={checked}
                className="h-4 w-4 shrink-0 rounded border-border"
                aria-label="تحديد"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                    e.stopPropagation();
                    onToggle(e.target.checked);
                }}
            />
            <img
                src={avatarSrc(u)}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-foreground">
                    {u.displayName || u.email || u.id}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {u.email && <span className="truncate">{u.email}</span>}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                        {roleLabel || u.role || ""}
                    </span>
                    {u.phoneNumber && (
                        <span dir="ltr" className="font-mono text-[11px]">
                            {u.phoneNumber}
                        </span>
                    )}
                </div>
            </div>
            {profileHref ? (
                <Link
                    href={profileHref}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="الملف أو إدارة المستخدم"
                    aria-label="عرض المستخدم في لوحة الإدارة"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Eye className="h-5 w-5" />
                </Link>
            ) : (
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground/40"
                    title="غير متاح"
                >
                    <Eye className="h-5 w-5" />
                </span>
            )}
        </div>
    );
}
