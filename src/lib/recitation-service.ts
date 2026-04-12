import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    setDoc,
    serverTimestamp, 
    query, 
    where, 
    getDocs,
    Timestamp,
    orderBy,
    onSnapshot,
    writeBatch
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
    return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));
};
