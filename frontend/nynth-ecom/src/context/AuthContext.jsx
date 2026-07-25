import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../api/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);

    // Helper: Check if email is in admin whitelist
    const isAdminEmail = (email) => {
        const adminEmails = import.meta.env.VITE_ADMIN_EMAILS || "";
        const emailList = adminEmails.split(",").map(e => e.trim().toLowerCase());
        return emailList.includes(email.toLowerCase());
    };

    // Signup
    async function signup(email, password, firstName, lastName) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Display Name
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });

        // Determine role based on email whitelist
        const role = isAdminEmail(email) ? "admin" : "customer";

        // Create User Document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email,
            createdAt: new Date(),
            role
        });

        return user;
    }

    // Login
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Logout
    function logout() {
        return signOut(auth);
    }

    // Reset Password
    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    // Google Login
    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user document exists
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        const isNewUser = !docSnap.exists();

        // Determine role based on email whitelist
        const role = isAdminEmail(user.email) ? "admin" : "customer";

        if (isNewUser) {
            // Create user doc if it doesn't exist
            const [firstName, ...lastNameParts] = (user.displayName || "").split(" ");
            const lastName = lastNameParts.join(" ");

            await setDoc(docRef, {
                firstName: firstName || "User",
                lastName: lastName || "",
                email: user.email,
                createdAt: new Date(),
                role,
                photoURL: user.photoURL
            });
        } else {
            // Update role if user already exists (in case they were added to whitelist later)
            const currentRole = docSnap.data().role;
            if (currentRole !== role) {
                await updateDoc(docRef, { role });
            }
        }

        return { ...result, isNewUser };
    }

    // Check if user is admin
    async function checkAdmin(uid) {
        try {
            setIsAdminLoading(true);
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setIsAdmin(userData.role === "admin");
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
        } finally {
            setIsAdminLoading(false);
        }
    }

    // Auth State Listener
    useEffect(() => {
        setPersistence(auth, browserLocalPersistence)
            .catch((e) => console.error("Persistence error:", e));

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            if (user) {
                await checkAdmin(user.uid);
            } else {
                setIsAdmin(false);
                setIsAdminLoading(false);
            }
            setLoading(false);
        });

        // Failsafe: force render after 5s if auth state hasn't resolved
        const timeout = setTimeout(() => {
            setLoading((prev) => {
                if (prev) return false;
                return prev;
            });
        }, 5000);

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        isAdmin,
        isAdminLoading,
        signup,
        login,
        logout,
        resetPassword,
        loginWithGoogle
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
