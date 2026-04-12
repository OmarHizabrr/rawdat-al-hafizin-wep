"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword as firebaseSignInWithEmail,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sha256Hex, verifyPhonePassword } from "@/lib/password-hash";
import type { UserDocument } from "@/lib/user-document";

const PHONE_SESSION_KEY = "rawdat_user_uid";

/** جلسة هاتف+كلمة مرور (متوافقة مع تطبيق Flutter) — ليست جلسة Firebase Auth كاملة */
function phoneSessionUser(uid: string, data: UserDocument): User {
    return {
        uid,
        displayName: (data.displayName as string) || null,
        email: (data.email as string) || null,
        photoURL: (data.photoURL as string) || null,
        phoneNumber: (data.phoneNumber as string) || null,
    } as User;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (
        email: string,
        password: string,
        displayName: string,
        phone: string
    ) => Promise<void>;
    signInWithPhonePassword: (phone: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    userData: UserDocument | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserDocument | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (cancelled) return;

            if (firebaseUser) {
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (cancelled) return;
                setUser(firebaseUser);
                setUserData(userDoc.exists() ? (userDoc.data() as UserDocument) : null);
                if (typeof window !== "undefined") {
                    localStorage.removeItem(PHONE_SESSION_KEY);
                }
                setLoading(false);
                return;
            }

            const storedUid =
                typeof window !== "undefined" ? localStorage.getItem(PHONE_SESSION_KEY) : null;
            if (storedUid) {
                const userDoc = await getDoc(doc(db, "users", storedUid));
                if (cancelled) return;
                if (userDoc.exists()) {
                    const data = userDoc.data() as UserDocument;
                    setUser(phoneSessionUser(storedUid, data));
                    setUserData(data);
                    setLoading(false);
                    return;
                }
                localStorage.removeItem(PHONE_SESSION_KEY);
            }

            setUser(null);
            setUserData(null);
            setLoading(false);
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const u = result.user;
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(
                userRef,
                {
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    photoURL: u.photoURL,
                    phoneNumber: u.phoneNumber || "",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    isActive: true,
                    role: "student",
                    authProvider: "google",
                },
                { merge: true }
            );
        } else {
            await updateDoc(userRef, { lastSignInAt: serverTimestamp() });
        }
    }, []);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        await firebaseSignInWithEmail(auth, email, password);
    }, []);

    const registerWithEmail = useCallback(
        async (email: string, password: string, displayName: string, phoneNumber: string) => {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const u = result.user;
            const userRef = doc(db, "users", u.uid);
            const passwordHash = await sha256Hex(password);
            await setDoc(userRef, {
                uid: u.uid,
                email: u.email,
                displayName,
                photoURL: "",
                phoneNumber: phoneNumber || "",
                passwordHash,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                role: "pending",
                authProvider: "email",
            });
        },
        []
    );

    const normalizePhone = useCallback((phone: string) => phone.replace(/[^\d+]/g, ""), []);

    const signInWithPhonePassword = useCallback(
        async (phone: string, password: string) => {
            const normalizedPhone = normalizePhone(phone);
            const usersRef = collection(db, "users");
            let querySnapshot = await getDocs(query(usersRef, where("phoneNumber", "==", phone)));

            if (querySnapshot.empty) {
                querySnapshot = await getDocs(
                    query(usersRef, where("phoneNumberNormalized", "==", normalizedPhone))
                );
            }

            if (querySnapshot.empty) {
                throw new Error("لم يتم العثور على مستخدم لهذا الرقم");
            }

            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data() as UserDocument;

            const ok = await verifyPhonePassword(data.password, data.passwordHash, password);
            if (!ok) {
                throw new Error("كلمة المرور غير صحيحة");
            }

            if (data.isActive === false) {
                throw new Error("هذا الحساب غير نشط");
            }

            setUser(phoneSessionUser(userDoc.id, data));
            setUserData(data);
            localStorage.setItem(PHONE_SESSION_KEY, userDoc.id);
        },
        [normalizePhone]
    );

    const signOut = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
        } catch {
            /* ignore if no firebase session */
        }
        setUser(null);
        setUserData(null);
        localStorage.removeItem(PHONE_SESSION_KEY);
    }, []);

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            loading,
            userData,
            signInWithGoogle,
            signInWithEmail,
            registerWithEmail,
            signInWithPhonePassword,
            signOut,
        }),
        [
            user,
            loading,
            userData,
            signInWithGoogle,
            signInWithEmail,
            registerWithEmail,
            signInWithPhonePassword,
            signOut,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
