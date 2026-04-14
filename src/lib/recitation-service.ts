import { 
    collection, 
    updateDoc, 
    doc, 
    setDoc,
    serverTimestamp, 
    query, 
    where, 
    getDocs,
    getDoc,
    Timestamp,
    orderBy,
    writeBatch,
    collectionGroup
} from "firebase/firestore";
import { db } from "./firebase";

export interface RecitationSession {
    id?: string;
    title: string;
    url: string;
    type: 'video' | 'audio';
    status: 'active' | 'ended';
    creatorId: string;
    creatorName: string;
    targetType: 'group' | 'course' | 'individual' | 'all';
    targetId?: string; // Legacy
    createdAt: Timestamp;
    parentId: string; // Follow project nested path pattern
}

export interface SessionTarget {
    sessionId: string;
    targetId: string;
    targetType: 'group' | 'course' | 'individual';
}

export interface SessionAttendance {
    id?: string;
    userId: string;
    userName: string;
    joinedAt: Timestamp;
}

export const createRecitationSession = async (session: Omit<RecitationSession, 'id' | 'createdAt' | 'status' | 'parentId'>, selectedTargets?: {id: string, type: 'group'|'course'|'individual'}[]) => {
    const parentId = session.targetId || 'global';
    const batch = writeBatch(db);
    
    // Create the session document
    const sessionRef = doc(collection(db, "recitation_sessions", parentId, "recitation_sessions"));
    batch.set(sessionRef, {
        ...session,
        parentId,
        status: 'active',
        createdAt: serverTimestamp()
    });

    // Create target records using the nested path format: session_targets / sessionId / session_targets / targetId
    if (selectedTargets && selectedTargets.length > 0) {
        for (const target of selectedTargets) {
            const targetRef = doc(db, "session_targets", sessionRef.id, "session_targets", target.id);
            batch.set(targetRef, {
                sessionId: sessionRef.id,
                targetId: target.id,
                targetType: target.type
            });
        }
    }

    await batch.commit();
    return sessionRef;
};

export const endRecitationSession = async (parentId: string, sessionId: string) => {
    const sessionRef = doc(db, "recitation_sessions", parentId, "recitation_sessions", sessionId);
    return await updateDoc(sessionRef, {
        status: 'ended',
        endedAt: serverTimestamp()
    });
};

export const updateRecitationSession = async (
    parentId: string,
    sessionId: string,
    payload: Pick<RecitationSession, "title" | "url" | "type">
) => {
    const sessionRef = doc(db, "recitation_sessions", parentId, "recitation_sessions", sessionId);
    await updateDoc(sessionRef, {
        ...payload,
        updatedAt: serverTimestamp()
    });
};

export const deleteRecitationSession = async (parentId: string, sessionId: string) => {
    const batch = writeBatch(db);

    const sessionRef = doc(db, "recitation_sessions", parentId, "recitation_sessions", sessionId);
    batch.delete(sessionRef);

    const attendanceSnap = await getDocs(collection(db, "recitation_attendance", sessionId, "recitation_attendance"));
    attendanceSnap.forEach((attendanceDoc) => batch.delete(attendanceDoc.ref));

    const targetsSnap = await getDocs(collection(db, "session_targets", sessionId, "session_targets"));
    targetsSnap.forEach((targetDoc) => batch.delete(targetDoc.ref));

    await batch.commit();
};

export const getTargetActiveRecitationSessions = async (
    targetId: string,
    targetType: "group" | "course"
) => {
    const [globalSnap, targetedSnap] = await Promise.all([
        getDocs(query(
            collectionGroup(db, "recitation_sessions"),
            where("status", "==", "active"),
            where("targetType", "==", "all"),
            orderBy("createdAt", "desc")
        )),
        getDocs(query(
            collectionGroup(db, "recitation_sessions"),
            where("status", "==", "active"),
            where("targetType", "==", targetType),
            orderBy("createdAt", "desc")
        ))
    ]);

    const targetedCandidates = targetedSnap.docs.map((sessionDoc) => ({
        id: sessionDoc.id,
        ...(sessionDoc.data() as Omit<RecitationSession, "id">)
    })) as RecitationSession[];

    const targetedWithMatch = await Promise.all(
        targetedCandidates.map(async (session) => {
            const targetDocRef = doc(db, "session_targets", session.id!, "session_targets", targetId);
            const targetDoc = await getDoc(targetDocRef);
            return targetDoc.exists() ? session : null;
        })
    );

    const globalSessions = globalSnap.docs.map((sessionDoc) => ({
        id: sessionDoc.id,
        ...(sessionDoc.data() as Omit<RecitationSession, "id">)
    })) as RecitationSession[];

    const merged = [...globalSessions, ...targetedWithMatch.filter(Boolean) as RecitationSession[]];
    const unique = new Map<string, RecitationSession>();
    merged.forEach((session) => {
        if (session.id) unique.set(session.id, session);
    });

    return Array.from(unique.values()).sort((a, b) => {
        const aMs = a.createdAt?.toMillis?.() || 0;
        const bMs = b.createdAt?.toMillis?.() || 0;
        return bMs - aMs;
    });
};

export const logSessionAttendance = async (sessionId: string, userId: string, userName: string) => {
    const attendanceRef = doc(db, "recitation_attendance", sessionId, "recitation_attendance", userId);
    return await setDoc(attendanceRef, {
        userId,
        userName,
        joinedAt: serverTimestamp()
    }, { merge: true });
};

export const getSessionAttendance = async (sessionId: string) => {
    const q = query(
        collection(db, "recitation_attendance", sessionId, "recitation_attendance"),
        orderBy("joinedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<SessionAttendance, "id">) } as SessionAttendance));
};
