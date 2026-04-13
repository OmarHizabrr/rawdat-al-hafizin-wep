"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { notificationsInboxQuery } from "@/lib/messaging";

type PermissionState = NotificationPermission | "unsupported";

type NotificationsBadgeValue = {
    unreadCount: number;
    requestBrowserPermission: () => Promise<PermissionState>;
};

const defaultValue: NotificationsBadgeValue = {
    unreadCount: 0,
    requestBrowserPermission: async () => "unsupported",
};

const NotificationsBadgeContext = createContext<NotificationsBadgeValue>(defaultValue);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const actorId = user?.uid;
    const [unreadCount, setUnreadCount] = useState(0);

    const requestBrowserPermission = useCallback(async (): Promise<PermissionState> => {
        if (typeof Notification === "undefined") return "unsupported";
        const p = await Notification.requestPermission();
        return p;
    }, []);

    useEffect(() => {
        if (!actorId) {
            setUnreadCount(0);
            return undefined;
        }

        const q = notificationsInboxQuery(actorId);
        let first = true;

        const unsub = onSnapshot(
            q,
            (snapshot) => {
                const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as {
                    isRead?: boolean;
                    fromUserId?: string;
                }[];
                setUnreadCount(docs.filter((n) => !n.isRead).length);

                if (first) {
                    first = false;
                    return;
                }

                if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
                if (typeof document !== "undefined" && document.visibilityState === "visible") return;

                snapshot.docChanges().forEach((ch) => {
                    if (ch.type !== "added") return;
                    const data = ch.doc.data() as {
                        fromUserId?: string;
                        isRead?: boolean;
                        title?: string;
                        body?: string;
                    };
                    if (data.fromUserId === actorId) return;
                    if (data.isRead) return;
                    try {
                        new Notification(data.title || "روضة الحافظين", {
                            body: data.body || "",
                            icon: "/logo.png",
                            tag: ch.doc.id,
                            dir: "rtl",
                            lang: "ar",
                        });
                    } catch {
                        /* ignore */
                    }
                });
            },
            (err) => console.error("notifications inbox", err)
        );

        return () => unsub();
    }, [actorId]);

    const value = useMemo(
        () => ({ unreadCount, requestBrowserPermission }),
        [unreadCount, requestBrowserPermission]
    );

    return (
        <NotificationsBadgeContext.Provider value={value}>
            {children}
        </NotificationsBadgeContext.Provider>
    );
}

export function useNotificationBadge() {
    return useContext(NotificationsBadgeContext);
}
