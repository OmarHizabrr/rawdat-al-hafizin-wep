"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword as firebaseSignInWithEmail,
    createUserWithEmailAndPassword
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
    updateDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string, displayName: string, phone: string) => Promise<void>;
    signInWithPhonePassword: (phone: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    userData: any | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create new user document
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    phoneNumber: user.phoneNumber || "",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    isActive: true,
                    role: "student", // Default role
                    authProvider: "google"
                }, { merge: true });
            } else {
                // Update last sign in
                await updateDoc(userRef, {
                    lastSignInAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Google Sign In Error:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await firebaseSignInWithEmail(auth, email, password);
            // userData and user will be handled by onAuthStateChanged
        } catch (error) {
            console.error("Email Sign In Error:", error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, password: string, displayName: string, phoneNumber: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: "",
                phoneNumber: phoneNumber || "",
                password: password, // Storing password for phone login fallback as requested
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                role: "pending", 
                authProvider: "email"
            });
        } catch (error) {
            console.error("Email Registration Error:", error);
            throw error;
        }
    };

    const normalizePhone = (phone: string) => {
        // Simple normalization to remove spaces and special chars, implementation should match Flutter's TextUtils
        return phone.replace(/[^\d+]/g, "");
    };

    const signInWithPhonePassword = async (phone: string, password: string) => {
        try {
            const normalizedPhone = normalizePhone(phone);

            // Query users by phone number
            // Note: Flutter app checks 'phoneNumberNormalized' and 'phoneNumber'
            // We will try exact match first for simplicity, then normalized

            const usersRef = collection(db, "users");
            const q = query(usersRef, where("phoneNumber", "==", phone));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Try normalized phone
                const q2 = query(usersRef, where("phoneNumberNormalized", "==", normalizedPhone));
                querySnapshot = await getDocs(q2);
            }

            if (querySnapshot.empty) {
                throw new Error("لم يتم العثور على مستخدم لهذا الرقم");
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Verify Password (Direct string comparison as per Flutter app)
            // WARNING: This assumes cleartext/simple storage. 
            if (!userData.password || userData.password !== password) {
                throw new Error("كلمة المرور غير صحيحة");
            }

            if (userData.isActive === false) {
                throw new Error("هذا الحساب غير نشط");
            }

            // Since we are verifying manually against Firestore, we need a way to "authenticate" in Firebase Auth.
            // However, Firebase Auth doesn't support "Custom Phone + Password" out of the box without Custom Tokens from a server.
            // The Flutter App seems to maintain its own session or might be using a different flow.
            // BUT, checking the Flutter code again: 
            // It calls `_auth.signInWithCredential(credential)` for Google.
            // For Phone+Password, it DOES NOT call `_auth.signIn...`. It simply validates and navigates!
            // This means the user is NOT authenticated in Firebase Auth for Phone/Password users in the Flutter app?
            // Wait, looking at `AuthService.dart`:
            // `currentUser` returns `_auth.currentUser`.
            // `currentUserId` returns `currentUser?.uid ?? userData.getValue<String>('uid')`.
            // It seems it falls back to local storage `userData` if Firebase Auth user is null.
            // So effectively, it uses a "Custom Session" stored in local storage for Phone/Password users.

            // To replicate this in Next.js, we will set the `user` state manually to a mock user object or leverage our own session state.
            // For proper Firebase Auth, we would need a server to mint a custom token.
            // For now, let's update the context state to simulate login.

            const mockUser = {
                uid: userDoc.id,
                displayName: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                phoneNumber: userData.phoneNumber,
            } as User;

            setUser(mockUser);
            setUserData(userData);

            // In a real app we should probably use a cookie or local storage to persist this "session"
            // avoiding Firebase Auth for now to match Flutter's behavior exactly without server backend.
            localStorage.setItem("rawdat_user_uid", userDoc.id);

        } catch (error) {
            console.error("Phone Login Error:", error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserData(null);
            localStorage.removeItem("rawdat_user_uid");
        } catch (error) {
            console.error("Sign Out Error:", error);
        }
    };

    // Restore custom session on load if no firebase user
    useEffect(() => {
        const restoreSession = async () => {
            if (!auth.currentUser) {
                const storedUid = localStorage.getItem("rawdat_user_uid");
                if (storedUid) {
                    const userDoc = await getDoc(doc(db, "users", storedUid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        const mockUser = {
                            uid: userDoc.id,
                            displayName: data.displayName,
                            email: data.email,
                            photoURL: data.photoURL,
                            phoneNumber: data.phoneNumber,
                        } as User;
                        setUser(mockUser);
                        setUserData(data);
                        setLoading(false);
                    }
                }
            }
        };
        restoreSession();
    }, [loading]);

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, registerWithEmail, signInWithPhonePassword, signOut, userData }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
