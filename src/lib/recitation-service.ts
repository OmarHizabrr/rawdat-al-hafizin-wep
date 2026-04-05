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
    onSnapshot
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
    targetId?: string; // id of the group or course
    targetStudentIds?: string[]; // specific student ids if targetType is 'individual'
    createdAt: Timestamp;
    parentId: string; // Follow project nested path pattern
}

export interface SessionAttendance {
    userId: string;
    userName: string;
    joinedAt: Timestamp;
}

export const createRecitationSession = async (session: Omit<RecitationSession, 'id' | 'createdAt' | 'status' | 'parentId'>) => {
    const parentId = session.targetId || 'global';
    return await addDoc(collection(db, "recitation_sessions", parentId, "recitation_sessions"), {
        ...session,
        parentId,
        status: 'active',
        createdAt: serverTimestamp()
    });
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
