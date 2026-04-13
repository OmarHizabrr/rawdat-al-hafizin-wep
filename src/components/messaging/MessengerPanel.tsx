"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Reply, Pencil, Check, X, Send, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
    admin: "مدير",
    committee: "لجنة",
    teacher: "معلم",
    student: "طالب",
    applicant: "متقدم",
    pending: "قيد التفعيل",
    supervisor_arab: "مشرف عام",
    supervisor_local: "مشرف منطقة",
};

function formatTime(iso?: string) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
        });
    } catch {
        return "";
    }
}

export type MessengerUser = { id: string; displayName?: string | null; photoURL?: string | null };

export type MessengerConversation = {
    id: string;
    participants?: string[];
    isGroup?: boolean;
    title?: string;
    lastMessage?: string;
    lastSenderId?: string;
    updatedAt?: string;
};

export type ReplyTarget = { id: string; text?: string; senderName?: string };

export type MessengerMessage = {
    id: string;
    senderId?: string;
    senderName?: string;
    senderRole?: string;
    senderPhotoURL?: string;
    text?: string;
    createdAt?: string;
    editedAt?: string;
    replyToId?: string;
    replyToText?: string;
    replyToSenderName?: string;
};

function avatarForMessage(
    mine: boolean,
    m: MessengerMessage,
    actorPhotoURL: string | null | undefined,
    allUsers: MessengerUser[],
    actorId: string
) {
    const url = mine
        ? actorPhotoURL
        : m.senderPhotoURL ||
          allUsers.find((u) => u.id === m.senderId)?.photoURL;
    if (url) return url;
    const name = mine
        ? allUsers.find((u) => u.id === actorId)?.displayName || "أنا"
        : m.senderName || "?";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(String(name).slice(0, 24))}&background=6366f1&color=fff`;
}

type Props = {
    actorId: string;
    actorPhotoURL?: string | null;
    allUsers: MessengerUser[];
    conversations: MessengerConversation[];
    selectedConversation: MessengerConversation | null;
    onSelectConversation: (c: MessengerConversation) => void;
    onBackList: () => void;
    hideListColumnSm: boolean;
    hideThreadColumnSm: boolean;
    messages: MessengerMessage[];
    messageText: string;
    setMessageText: (v: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    sendingMessage: boolean;
    replyTo: ReplyTarget | null;
    setReplyTo: (v: ReplyTarget | null) => void;
    onEditMessage?: (messageId: string, text: string) => void;
};

export function MessengerPanel({
    actorId,
    actorPhotoURL,
    allUsers,
    conversations,
    selectedConversation,
    onSelectConversation,
    onBackList,
    hideListColumnSm,
    hideThreadColumnSm,
    messages,
    messageText,
    setMessageText,
    onSendMessage,
    sendingMessage,
    replyTo,
    setReplyTo,
    onEditMessage,
}: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    const touchRef = useRef({ x: 0, y: 0, id: null as string | null });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, selectedConversation?.id]);

    const partnerTitle = useCallback(
        (c: MessengerConversation | null) => {
            if (!c) return "";
            if (c.isGroup) return c.title || "مجموعة";
            const names = (c.participants || [])
                .filter((id) => id !== actorId)
                .map((id) => allUsers.find((u) => u.id === id)?.displayName || id);
            return names.join("، ") || "محادثة";
        },
        [actorId, allUsers]
    );

    const handleTouchStart = (e: React.TouchEvent, m: MessengerMessage) => {
        const t = e.touches[0];
        touchRef.current = { x: t.clientX, y: t.clientY, id: m.id };
    };

    const handleTouchEnd = (e: React.TouchEvent, m: MessengerMessage) => {
        const t = e.changedTouches[0];
        const { x, y, id } = touchRef.current;
        if (id !== m.id) return;
        const dx = t.clientX - x;
        const dy = Math.abs(t.clientY - y);
        if (dy < 40 && dx < -48) {
            setReplyTo({
                id: m.id,
                text: m.text,
                senderName: m.senderName || "",
            });
        }
    };

    const startEdit = (m: MessengerMessage) => {
        if (m.senderId !== actorId) return;
        setEditingId(m.id);
        setEditingText(m.text || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingText("");
    };

    const saveEdit = () => {
        if (!editingId || !editingText.trim()) return;
        onEditMessage?.(editingId, editingText.trim());
        cancelEdit();
    };

    const listSection = (
        <div
            className={cn(
                "flex min-h-0 min-w-0 flex-col border-border bg-muted/20 md:w-72 md:border-e",
                hideListColumnSm ? "hidden md:flex" : "flex"
            )}
        >
            <div className="shrink-0 border-b border-border px-3 py-2.5 text-sm font-semibold text-foreground">
                المحادثات
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {conversations.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">لا توجد محادثات بعد.</p>
                ) : (
                    conversations.map((c) => {
                        const active = selectedConversation?.id === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => onSelectConversation(c)}
                                className={cn(
                                    "flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-start transition-colors hover:bg-muted/60",
                                    active && "bg-primary/10"
                                )}
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                    {(partnerTitle(c) || "?").charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-foreground">
                                        {partnerTitle(c)}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {c.lastMessage || "…"}
                                    </div>
                                </div>
                                {c.lastSenderId && c.lastSenderId !== actorId && (
                                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );

    const threadSection = (
        <div
            className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col bg-card",
                hideThreadColumnSm ? "hidden md:flex" : "flex"
            )}
        >
            {!selectedConversation ? (
                <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
                    اختر محادثة من القائمة
                </div>
            ) : (
                <>
                    <div className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-2 md:px-3">
                        <button
                            type="button"
                            onClick={onBackList}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border md:hidden"
                            aria-label="العودة للقائمة"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                {(partnerTitle(selectedConversation) || "?").charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate font-semibold text-foreground">
                                    {partnerTitle(selectedConversation)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {selectedConversation.isGroup ? "مجموعة" : "محادثة مباشرة"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
                        {messages.map((m) => {
                            const mine = m.senderId === actorId;
                            const src = avatarForMessage(
                                mine,
                                m,
                                actorPhotoURL,
                                allUsers,
                                actorId
                            );
                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex items-end gap-2",
                                        mine ? "justify-start" : "justify-end"
                                    )}
                                    onTouchStart={(e) => handleTouchStart(e, m)}
                                    onTouchEnd={(e) => handleTouchEnd(e, m)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt=""
                                        className={cn(
                                            "h-9 w-9 shrink-0 rounded-full border border-border object-cover",
                                            mine ? "order-first" : "order-last"
                                        )}
                                    />
                                    <div
                                        className={cn(
                                            "max-w-[min(100%,20rem)] rounded-2xl border px-3 py-2 text-sm shadow-sm",
                                            mine
                                                ? "border-primary/20 bg-primary/15 text-foreground"
                                                : "border-border bg-muted/50 text-foreground"
                                        )}
                                    >
                                        {!mine && (
                                            <div className="mb-1 text-xs text-muted-foreground">
                                                {m.senderName}{" "}
                                                <span className="text-primary/80">
                                                    {ROLE_LABELS[m.senderRole || ""] || m.senderRole || ""}
                                                </span>
                                            </div>
                                        )}
                                        {m.replyToText && (
                                            <div className="mb-2 flex gap-1 rounded-lg border border-border/80 bg-background/50 px-2 py-1 text-xs text-muted-foreground">
                                                <Reply className="h-3 w-3 shrink-0 mt-0.5" />
                                                <span>
                                                    {m.replyToSenderName ? `${m.replyToSenderName}: ` : ""}
                                                    {m.replyToText}
                                                </span>
                                            </div>
                                        )}
                                        {editingId === m.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    className="w-full min-h-[3rem] rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                                                    rows={2}
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                />
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-border p-1.5 hover:bg-muted"
                                                        onClick={saveEdit}
                                                        title="حفظ"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-border p-1.5 hover:bg-muted"
                                                        onClick={cancelEdit}
                                                        title="إلغاء"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                {m.text}
                                            </p>
                                        )}
                                        <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-muted-foreground">
                                            <span>{formatTime(m.createdAt)}</span>
                                            <div className="flex items-center gap-1">
                                                {m.editedAt && (
                                                    <span className="text-muted-foreground/80">تم التعديل</span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="rounded p-1 hover:bg-background/80"
                                                    title="رد"
                                                    onClick={() =>
                                                        setReplyTo({
                                                            id: m.id,
                                                            text: m.text,
                                                            senderName: m.senderName || "",
                                                        })
                                                    }
                                                >
                                                    <Reply className="h-3.5 w-3.5" />
                                                </button>
                                                {mine && editingId !== m.id && (
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 hover:bg-background/80"
                                                        title="تعديل"
                                                        onClick={() => startEdit(m)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {replyTo && (
                        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-muted/30 px-3 py-2">
                            <Reply className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1 text-xs">
                                <div className="font-medium text-foreground">
                                    {replyTo.senderName || "رسالة"}
                                </div>
                                <div className="truncate text-muted-foreground">{replyTo.text}</div>
                            </div>
                            <button
                                type="button"
                                className="shrink-0 rounded-lg p-2 hover:bg-muted"
                                onClick={() => setReplyTo(null)}
                                aria-label="إلغاء الرد"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <form
                        className="flex shrink-0 gap-2 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                        onSubmit={onSendMessage}
                    >
                        <input
                            className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                            placeholder="اكتب رسالة…"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            dir="auto"
                        />
                        <button
                            type="submit"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm disabled:opacity-50"
                            disabled={sendingMessage}
                            aria-label="إرسال"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </>
            )}
        </div>
    );

    return (
        <div className="flex min-h-[min(70dvh,520px)] max-h-[min(75dvh,calc(100dvh-10rem))] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm md:flex-row">
            {listSection}
            {threadSection}
        </div>
    );
}
