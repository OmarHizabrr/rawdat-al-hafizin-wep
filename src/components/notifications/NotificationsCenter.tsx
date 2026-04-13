"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    setDoc,
    updateDoc,
    writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";
import {
    Bell,
    Info,
    AlertTriangle,
    CheckCircle,
    Calendar,
    Send,
    MessageCircle,
    Users,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EliteModal } from "@/components/ui/EliteModal";
import { db } from "@/lib/firebase";
import {
    conversationDoc,
    conversationMessageDoc,
    conversationMessagesQuery,
    conversationsInboxQuery,
    notificationDoc,
    notificationsInboxQuery,
} from "@/lib/messaging";
import {
    MessengerPanel,
    type MessengerConversation,
    type MessengerMessage,
    type MessengerUser,
} from "@/components/messaging/MessengerPanel";
import { cn } from "@/lib/utils";
import type { UserDocument } from "@/lib/user-document";
import { getUserProfilePath } from "@/lib/profile-links";
import { RecipientUserCard } from "@/components/messaging/RecipientUserCard";
import { computeSharedStaffIdsForStudent } from "@/lib/membership-mirror";

const ROLE_LABELS: Record<string, string> = {
    admin: "مدير النظام",
    committee: "لجنة علمية",
    teacher: "معلم",
    student: "طالب",
    applicant: "متقدّم",
    pending: "قيد التفعيل",
    supervisor_arab: "مشرف عام",
    supervisor_local: "مشرف منطقة",
};

type InboxUser = MessengerUser & {
    role?: string;
    photoURL?: string | null;
    email?: string | null;
    phoneNumber?: string;
};

type InAppNotification = {
    id: string;
    toUserId?: string;
    fromUserId?: string;
    fromUserName?: string;
    fromUserRole?: string;
    fromUserPhotoURL?: string;
    title?: string;
    body?: string;
    type?: string;
    isRead?: boolean;
    createdAt?: string;
};

/** مطابقة Afaq: معرّف جديد داخل مجموعة الإشعارات */
function newNotificationId() {
    return doc(collection(db, "notifications")).id;
}

type Props = {
    actorId: string;
    displayName: string;
    photoURL?: string | null;
    role: string | undefined;
};

export function NotificationsCenter({ actorId, displayName, photoURL, role }: Props) {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<"notifications" | "chats">("notifications");
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [allUsers, setAllUsers] = useState<InboxUser[]>([]);
    const [conversations, setConversations] = useState<MessengerConversation[]>([]);
    const [selectedConversation, setSelectedConversation] =
        useState<MessengerConversation | null>(null);
    const [messages, setMessages] = useState<MessengerMessage[]>([]);
    const [messageText, setMessageText] = useState("");
    const [replyTo, setReplyTo] = useState<{
        id: string;
        text?: string;
        senderName?: string;
    } | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
    const [composeTitle, setComposeTitle] = useState("");
    const [composeBody, setComposeBody] = useState("");
    const [composeType, setComposeType] = useState<"info" | "success" | "warning">("info");
    const [sending, setSending] = useState(false);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [newChatTitle, setNewChatTitle] = useState("");
    const [newChatUsers, setNewChatUsers] = useState<string[]>([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    /** مطابقة Afaq: مشرفون/معلمون يشتركون مع الطالب في Mygroup */
    const [sharedStaffIds, setSharedStaffIds] = useState<string[]>([]);
    const [isNarrow, setIsNarrow] = useState(false);
    const [chatMobileMode, setChatMobileMode] = useState<"list" | "thread">("list");

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const fn = () => setIsNarrow(mq.matches);
        fn();
        mq.addEventListener("change", fn);
        return () => mq.removeEventListener("change", fn);
    }, []);

    useEffect(() => {
        const load = async () => {
            if (!actorId) return;
            setLoadingUsers(true);
            try {
                const snap = await getDocs(collection(db, "users"));
                const users: InboxUser[] = snap.docs.map((d) => {
                    const data = d.data() as UserDocument;
                    return {
                        id: d.id,
                        displayName: data.displayName ?? data.email ?? d.id,
                        role: data.role,
                        photoURL: data.photoURL,
                        email: data.email,
                        phoneNumber: data.phoneNumber,
                    };
                });
                setAllUsers(users);
            } catch (e) {
                console.error(e);
                toast.error("تعذّر تحميل قائمة المستخدمين. تحقق من الصلاحيات وقواعد Firestore.");
            } finally {
                setLoadingUsers(false);
            }
        };
        void load();
    }, [actorId]);

    useEffect(() => {
        if (!actorId || allUsers.length === 0) {
            setSharedStaffIds([]);
            return undefined;
        }
        if (role !== "student" && role !== "applicant") {
            setSharedStaffIds([]);
            return undefined;
        }
        let cancelled = false;
        void (async () => {
            try {
                const ids = await computeSharedStaffIdsForStudent(actorId, allUsers);
                if (!cancelled) setSharedStaffIds(ids);
            } catch (e) {
                console.error("membership mirrors for messaging recipients", e);
                if (!cancelled) setSharedStaffIds([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [actorId, role, allUsers]);

    useEffect(() => {
        if (!actorId) return undefined;
        const q = notificationsInboxQuery(actorId);
        return onSnapshot(
            q,
            (snapshot) => {
                const rows = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                })) as InAppNotification[];
                rows.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0).getTime() -
                        new Date(a.createdAt || 0).getTime()
                );
                setNotifications(rows);
            },
            (e) => console.error("notifications inbox", e)
        );
    }, [actorId]);

    useEffect(() => {
        if (!actorId) return undefined;
        const q = conversationsInboxQuery(actorId);
        return onSnapshot(
            q,
            (snapshot) => {
                const rows = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                })) as MessengerConversation[];
                rows.sort(
                    (a, b) =>
                        new Date(b.updatedAt || 0).getTime() -
                        new Date(a.updatedAt || 0).getTime()
                );
                setConversations(rows);
            },
            (e) => console.error("conversations inbox", e)
        );
    }, [actorId]);

    useEffect(() => {
        if (!selectedConversation?.id) {
            setMessages([]);
            return undefined;
        }
        const q = conversationMessagesQuery(selectedConversation.id);
        return onSnapshot(
            q,
            (snapshot) => {
                const rows = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                })) as MessengerMessage[];
                rows.sort(
                    (a, b) =>
                        new Date(a.createdAt || 0).getTime() -
                        new Date(b.createdAt || 0).getTime()
                );
                setMessages(rows);
            },
            (err) => {
                console.error("messages snapshot", err);
                setMessages([]);
            }
        );
    }, [selectedConversation?.id]);

    /**
     * منطق Afaq الموحّد (مع إضافة committee ولقب teacher ضمن طاقم يظهر للطالب عند تطابق المرآة):
     * - admin: الجميع عدا الذات
     * - student/applicant: admin + committee + مشرف/معلم ضمن sharedStaffIds
     * - غير ذلك (معلم، إلخ): admin + committee فقط عدا الذات
     */
    const recipients = useMemo(() => {
        if (!role) return [];
        if (role === "admin" || role === "committee") {
            return allUsers.filter((u) => u.id !== actorId);
        }
        if (role === "student" || role === "applicant") {
            return allUsers.filter(
                (u) =>
                    u.id !== actorId &&
                    (u.role === "admin" ||
                        u.role === "committee" ||
                        ((Boolean(u.role?.includes("supervisor")) || u.role === "teacher") &&
                            sharedStaffIds.includes(u.id)))
            );
        }
        return allUsers.filter(
            (u) => u.id !== actorId && (u.role === "admin" || u.role === "committee")
        );
    }, [allUsers, actorId, role, sharedStaffIds]);

    const recipientsMap = useMemo(
        () => Object.fromEntries(recipients.map((r) => [r.id, r])),
        [recipients]
    );

    const getIcon = (t?: string) => {
        switch (t) {
            case "warning":
                return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case "success":
                return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            default:
                return <Info className="h-5 w-5 text-primary" />;
        }
    };

    const markAllRead = useCallback(() => {
        const unread = notifications.filter((n) => !n.isRead);
        if (unread.length === 0) return;
        const batch = writeBatch(db);
        let n = 0;
        for (const item of unread) {
            if (n >= 400) break;
            batch.update(notificationDoc(item.id), { isRead: true });
            n++;
        }
        void batch
            .commit()
            .then(() => toast.success("تم تعليم الإشعارات كمقروءة"))
            .catch((e) => {
                console.error(e);
                toast.error("تعذّر التحديث");
            });
    }, [notifications]);

    const markOneRead = useCallback((n: InAppNotification) => {
        if (n.isRead) return;
        void updateDoc(notificationDoc(n.id), { isRead: true }).catch(console.error);
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            selectedRecipientIds.length === 0 ||
            !composeTitle.trim() ||
            !composeBody.trim() ||
            !actorId
        )
            return;
        setSending(true);
        try {
            for (const recipientId of selectedRecipientIds) {
                const id = newNotificationId();
                const toUser = recipientsMap[recipientId];
                await setDoc(notificationDoc(id), {
                    toUserId: recipientId,
                    toUserName: toUser?.displayName || "",
                    toUserRole: toUser?.role || "",
                    toUserPhotoURL: toUser?.photoURL || "",
                    fromUserId: actorId,
                    fromUserName: displayName,
                    fromUserRole: role || "",
                    fromUserPhotoURL: photoURL || "",
                    title: composeTitle.trim(),
                    body: composeBody.trim(),
                    type: composeType,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                });
            }
            setIsComposeOpen(false);
            setSelectedRecipientIds([]);
            setComposeTitle("");
            setComposeBody("");
            setComposeType("info");
            toast.success("تم إرسال الإشعار");
        } catch (err) {
            console.error(err);
            toast.error("فشل الإرسال");
        } finally {
            setSending(false);
        }
    };

    const openReply = (n: InAppNotification) => {
        if (!n?.fromUserId || n.fromUserId === actorId) return;
        if (!recipientsMap[n.fromUserId]) return;
        setSelectedRecipientIds([n.fromUserId]);
        setComposeTitle(`رد: ${n.title || ""}`);
        setComposeBody("");
        setComposeType("info");
        setIsComposeOpen(true);
    };

    const openConversation = useCallback((conversation: MessengerConversation) => {
        setSelectedConversation(conversation);
        setChatMobileMode("thread");
        setReplyTo(null);
    }, []);

    const createConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newChatUsers.length === 0 || !actorId) return;
        const participants = [actorId, ...newChatUsers.filter((id) => id !== actorId)];
        const uniqueParticipants = Array.from(new Set(participants));
        let conversationId = "";

        if (uniqueParticipants.length === 2) {
            const q = conversationsInboxQuery(actorId);
            const snap = await getDocs(q);
            const existing = snap.docs
                .map((d) => ({ id: d.id, ...d.data() } as MessengerConversation))
                .find(
                    (c) =>
                        Array.isArray(c.participants) &&
                        c.participants.length === 2 &&
                        uniqueParticipants.every((id) => c.participants!.includes(id))
                );
            if (existing) conversationId = existing.id;
        }

        if (!conversationId) {
            conversationId = doc(collection(db, "conversations")).id;
            await setDoc(conversationDoc(conversationId), {
                participants: uniqueParticipants,
                isGroup: uniqueParticipants.length > 2,
                title:
                    uniqueParticipants.length > 2
                        ? newChatTitle.trim() || "مجموعة جديدة"
                        : "",
                createdBy: actorId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }

        setIsNewChatOpen(false);
        setNewChatUsers([]);
        setNewChatTitle("");
        setActiveTab("chats");
        const convSnap = await getDoc(conversationDoc(conversationId));
        const data = convSnap.data();
        if (data) {
            openConversation({ id: conversationId, ...data } as MessengerConversation);
        }
        toast.success("تم فتح المحادثة");
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversation?.id || !messageText.trim()) return;
        setSendingMessage(true);
        try {
            const msgId = doc(
                collection(db, "messages", selectedConversation.id, "messages")
            ).id;
            const payload: Record<string, string | undefined> = {
                senderId: actorId,
                senderName: displayName,
                senderPhotoURL: photoURL || "",
                senderRole: role || "",
                text: messageText.trim(),
                createdAt: new Date().toISOString(),
            };
            if (replyTo) {
                payload.replyToId = replyTo.id;
                payload.replyToText = replyTo.text;
                payload.replyToSenderName = replyTo.senderName || "";
            }
            await setDoc(
                conversationMessageDoc(selectedConversation.id, msgId),
                payload
            );
            await updateDoc(conversationDoc(selectedConversation.id), {
                lastMessage: messageText.trim(),
                lastSenderId: actorId,
                updatedAt: new Date().toISOString(),
            });
            setMessageText("");
            setReplyTo(null);
        } catch (err) {
            console.error(err);
            toast.error("تعذّر إرسال الرسالة");
        } finally {
            setSendingMessage(false);
        }
    };

    const handleEditMessage = async (messageId: string, text: string) => {
        if (!selectedConversation?.id) return;
        try {
            await updateDoc(
                conversationMessageDoc(selectedConversation.id, messageId),
                {
                    text,
                    editedAt: new Date().toISOString(),
                }
            );
            toast.success("تم تعديل الرسالة");
        } catch (err) {
            console.error(err);
            toast.error("تعذّر التعديل");
        }
    };

    if (loadingUsers) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
                جاري التحميل…
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <GlassCard variant="glass" className="p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                            مركز الإشعارات والمحادثات
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            تحديث فوري للإشعارات والمحادثات داخل المنصة
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("notifications")}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                activeTab === "notifications"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background hover:bg-muted"
                            )}
                        >
                            <Bell className="h-4 w-4" />
                            الإشعارات
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("chats")}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                activeTab === "chats"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background hover:bg-muted"
                            )}
                        >
                            <MessageCircle className="h-4 w-4" />
                            المحادثات
                        </button>
                        {recipients.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsNewChatOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                            >
                                <Users className="h-4 w-4" />
                                محادثة جديدة
                            </button>
                        )}
                        {recipients.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsComposeOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                            >
                                <Send className="h-4 w-4" />
                                إرسال إشعار
                            </button>
                        )}
                        {notifications.some((n) => !n.isRead) && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                            >
                                تعليم الكل كمقروء
                            </button>
                        )}
                    </div>
                </div>
            </GlassCard>

            {activeTab === "notifications" ? (
                <div className="space-y-3">
                    {notifications.length === 0 ? (
                        <GlassCard className="p-12 text-center text-muted-foreground">
                            <Bell className="mx-auto mb-3 h-12 w-12 opacity-20" />
                            <p>لا توجد إشعارات جديدة بانتظارك.</p>
                        </GlassCard>
                    ) : (
                        notifications.map((n) => (
                            <GlassCard
                                key={n.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => markOneRead(n)}
                                onKeyDown={(e) => e.key === "Enter" && markOneRead(n)}
                                className={cn(
                                    "cursor-pointer p-4 transition-colors hover:bg-muted/30",
                                    !n.isRead && "border-primary/30 bg-primary/5"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"
                                        aria-hidden
                                    >
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <h3
                                                className={cn(
                                                    "text-base font-bold",
                                                    n.isRead
                                                        ? "text-foreground"
                                                        : "text-primary"
                                                )}
                                            >
                                                {n.title}
                                            </h3>
                                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {n.createdAt
                                                    ? new Date(n.createdAt).toLocaleString("ar-EG")
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            <img
                                                src={
                                                    n.fromUserPhotoURL ||
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromUserName || "User")}`
                                                }
                                                alt=""
                                                className="h-8 w-8 rounded-full border border-border object-cover"
                                            />
                                            <span className="font-semibold">
                                                {n.fromUserName || "مرسل غير معروف"}
                                            </span>
                                            <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                                                {ROLE_LABELS[n.fromUserRole || ""] ||
                                                    n.fromUserRole ||
                                                    "بدون دور"}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {n.body}
                                        </p>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openReply(n);
                                                }}
                                                disabled={
                                                    !n.fromUserId ||
                                                    n.fromUserId === actorId ||
                                                    !recipientsMap[n.fromUserId]
                                                }
                                            >
                                                رد
                                            </button>
                                        </div>
                                    </div>
                                    {!n.isRead && (
                                        <div
                                            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                                            aria-hidden
                                        />
                                    )}
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            ) : (
                <GlassCard className="overflow-hidden p-0">
                    <div className="p-3 md:p-4">
                        <MessengerPanel
                            actorId={actorId}
                            allUsers={allUsers}
                            conversations={conversations}
                            selectedConversation={selectedConversation}
                            onSelectConversation={openConversation}
                            onBackList={() => setChatMobileMode("list")}
                            hideListColumnSm={isNarrow && chatMobileMode === "thread"}
                            hideThreadColumnSm={isNarrow && chatMobileMode === "list"}
                            messages={messages}
                            messageText={messageText}
                            setMessageText={setMessageText}
                            onSendMessage={sendMessage}
                            sendingMessage={sendingMessage}
                            replyTo={replyTo}
                            setReplyTo={setReplyTo}
                            onEditMessage={handleEditMessage}
                        />
                    </div>
                </GlassCard>
            )}

            <EliteModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                title="إرسال إشعار جديد"
                maxWidth="lg"
                footer={
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                            onClick={() => setIsComposeOpen(false)}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            form="compose-notification-form"
                            disabled={sending}
                            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
                        >
                            {sending ? "جاري الإرسال…" : "إرسال"}
                        </button>
                    </div>
                }
            >
                <form id="compose-notification-form" onSubmit={handleSend} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            المستلمون
                        </label>
                        <div className="mb-2 flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                                onClick={() => setSelectedRecipientIds(recipients.map((u) => u.id))}
                            >
                                تحديد الكل
                            </button>
                            <button
                                type="button"
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                                onClick={() => setSelectedRecipientIds([])}
                            >
                                إلغاء التحديد
                            </button>
                        </div>
                        <div className="max-h-[min(320px,50dvh)] space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-border bg-muted/20 p-2">
                            {recipients.map((u) => (
                                <RecipientUserCard
                                    key={u.id}
                                    user={u}
                                    checked={selectedRecipientIds.includes(u.id)}
                                    onToggle={(next) =>
                                        setSelectedRecipientIds((prev) => {
                                            if (next)
                                                return prev.includes(u.id) ? prev : [...prev, u.id];
                                            return prev.filter((id) => id !== u.id);
                                        })
                                    }
                                    profileHref={getUserProfilePath(pathname, u.id, role)}
                                    roleLabel={ROLE_LABELS[u.role || ""] || u.role || ""}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            نوع الرسالة
                        </label>
                        <select
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                            value={composeType}
                            onChange={(e) =>
                                setComposeType(e.target.value as typeof composeType)
                            }
                        >
                            <option value="info">معلومة</option>
                            <option value="success">نجاح</option>
                            <option value="warning">تنبيه</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            العنوان
                        </label>
                        <input
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                            value={composeTitle}
                            onChange={(e) => setComposeTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            المحتوى
                        </label>
                        <textarea
                            className="min-h-[6rem] w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                            value={composeBody}
                            onChange={(e) => setComposeBody(e.target.value)}
                        />
                    </div>
                </form>
            </EliteModal>

            <EliteModal
                isOpen={isNewChatOpen}
                onClose={() => setIsNewChatOpen(false)}
                title="إنشاء محادثة"
                maxWidth="lg"
                footer={
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                            onClick={() => setIsNewChatOpen(false)}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            form="new-chat-form"
                            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm"
                        >
                            بدء المحادثة
                        </button>
                    </div>
                }
            >
                <form id="new-chat-form" onSubmit={createConversation} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            العنوان (اختياري للمجموعة)
                        </label>
                        <input
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            الأعضاء
                        </label>
                        <div className="mb-2 flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                                onClick={() => setNewChatUsers(recipients.map((u) => u.id))}
                            >
                                تحديد الكل
                            </button>
                            <button
                                type="button"
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                                onClick={() => setNewChatUsers([])}
                            >
                                إلغاء التحديد
                            </button>
                        </div>
                        <div className="max-h-[min(320px,50dvh)] space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-border bg-muted/20 p-2">
                            {recipients.map((u) => (
                                <RecipientUserCard
                                    key={u.id}
                                    user={u}
                                    checked={newChatUsers.includes(u.id)}
                                    onToggle={(next) =>
                                        setNewChatUsers((prev) => {
                                            if (next)
                                                return prev.includes(u.id) ? prev : [...prev, u.id];
                                            return prev.filter((id) => id !== u.id);
                                        })
                                    }
                                    profileHref={getUserProfilePath(pathname, u.id, role)}
                                    roleLabel={ROLE_LABELS[u.role || ""] || u.role || ""}
                                />
                            ))}
                        </div>
                    </div>
                </form>
            </EliteModal>
        </div>
    );
}
