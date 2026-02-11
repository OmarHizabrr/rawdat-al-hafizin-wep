import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCNgJVGz_SQK1ukAjcDcgOvlUfbjaX_07A",
    authDomain: "rawdat-al-hafizin.firebaseapp.com",
    projectId: "rawdat-al-hafizin",
    storageBucket: "rawdat-al-hafizin.firebasestorage.app",
    messagingSenderId: "54372707069",
    appId: "1:54372707069:web:a7c45959b922272efb6c94",
    measurementId: "G-C3EL6QHQ4H"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
