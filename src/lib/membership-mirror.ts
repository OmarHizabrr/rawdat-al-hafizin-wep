/**
 * مرايا العضوية — نفس مسار التخزين في Afaq (FirestoreApi):
 *   Mygroup/{userId}/Mygroup/{groupId}
 * حقول المستند الشائعة: schoolId | regionId كمعرّف مجموعة.
 */
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const MEMBERSHIP_MIRROR_ROOT = "Mygroup";
export const MEMBERSHIP_MIRROR_SUB = "Mygroup";

export function userMembershipMirrorCollection(userId: string) {
    return collection(db, MEMBERSHIP_MIRROR_ROOT, userId, MEMBERSHIP_MIRROR_SUB);
}

function mirrorDocGroupId(data: Record<string, unknown>): string {
    const schoolId = data.schoolId;
    const regionId = data.regionId;
    const s = typeof schoolId === "string" ? schoolId : "";
    const r = typeof regionId === "string" ? regionId : "";
    return s || r || "";
}

/** معرّفات المجموعات (مدرسة/منطقة) المرتبطة بالمستخدم عبر مراياه */
export async function fetchMirrorGroupIdsForUser(userId: string): Promise<Set<string>> {
    const snap = await getDocs(userMembershipMirrorCollection(userId));
    const ids = new Set<string>();
    for (const d of snap.docs) {
        const gid = mirrorDocGroupId(d.data());
        if (gid) ids.add(gid);
    }
    return ids;
}

/**
 * مطابقة Afaq NotificationsPage: مشرفون أو معلمون يشتركون مع الطالب في أي groupId من المرآة.
 */
export async function computeSharedStaffIdsForStudent(
    studentId: string,
    allUsers: { id: string; role?: string }[]
): Promise<string[]> {
    const myGroupIds = await fetchMirrorGroupIdsForUser(studentId);
    if (myGroupIds.size === 0) return [];

    const candidates = allUsers.filter(
        (u) =>
            u.id !== studentId &&
            (Boolean(u.role?.includes("supervisor")) || u.role === "teacher")
    );

    const allowed: string[] = [];
    for (const u of candidates) {
        const their = await fetchMirrorGroupIdsForUser(u.id);
        let shared = false;
        for (const g of their) {
            if (myGroupIds.has(g)) {
                shared = true;
                break;
            }
        }
        if (shared) allowed.push(u.id);
    }
    return allowed;
}
