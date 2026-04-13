import {
    collection,
    doc,
    query,
    where,
    orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * مطابقة مسارات Afaq (FirestoreApi) — المنطق موحّد؛ تختلف مسميات الأدوار في الواجهة فقط.
 * - notifications / notifications/{id}
 * - conversations / conversations/{id}
 * - messages/{conversationId}/messages/{messageId}
 */

export function notificationsCollection() {
    return collection(db, "notifications");
}

export function notificationDoc(id: string) {
    return doc(db, "notifications", id);
}

export function conversationsCollection() {
    return collection(db, "conversations");
}

export function conversationDoc(id: string) {
    return doc(db, "conversations", id);
}

export function conversationMessagesCollection(conversationId: string) {
    return collection(db, "messages", conversationId, "messages");
}

export function conversationMessageDoc(conversationId: string, messageId: string) {
    return doc(db, "messages", conversationId, "messages", messageId);
}

export function notificationsInboxQuery(userId: string) {
    return query(notificationsCollection(), where("toUserId", "==", userId));
}

export function conversationsInboxQuery(userId: string) {
    return query(
        conversationsCollection(),
        where("participants", "array-contains", userId)
    );
}

export function conversationMessagesQuery(conversationId: string) {
    return query(
        conversationMessagesCollection(conversationId),
        orderBy("createdAt", "asc")
    );
}
