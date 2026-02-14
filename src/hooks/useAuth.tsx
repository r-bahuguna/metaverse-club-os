'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    signInAnonymously as firebaseSignInAnonymously,
    onAuthStateChanged,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AppUser, UserRole } from '@/lib/types';

/* ── Types ── */
interface AuthContextValue {
    /** Raw Firebase auth user */
    firebaseUser: FirebaseUser | null;
    /** App-level user profile from Firestore (null for anonymous/unresolved) */
    appUser: AppUser | null;
    loading: boolean;
    error: string | null;
    isAnonymous: boolean;
    isSuperAdmin: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signInAnonymously: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    clearError: () => void;
    refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    firebaseUser: null,
    appUser: null,
    loading: true,
    error: null,
    isAnonymous: false,
    isSuperAdmin: false,
    signInWithEmail: async () => { },
    signInAnonymously: async () => { },
    signOut: async () => { },
    resetPassword: async () => { },
    clearError: () => { },
    refreshAppUser: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

/* ── Fetch Firestore user doc ── */
async function fetchAppUser(uid: string): Promise<AppUser | null> {
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
            uid,
            email: data.email ?? '',
            displayName: data.displayName ?? 'Unknown',
            role: (data.role as UserRole) ?? 'member',
            slName: data.slName,
            slUuid: data.slUuid,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            onlineStatus: data.onlineStatus,
            mustChangePassword: data.mustChangePassword ?? false,
        };
    } catch {
        console.warn('[useAuth] Failed to fetch user document for', uid);
        return null;
    }
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser && !fbUser.isAnonymous) {
                // Authenticated user — resolve Firestore profile
                const profile = await fetchAppUser(fbUser.uid);
                setAppUser(profile);
            } else {
                // Anonymous or no user
                setAppUser(null);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const isAnonymous = firebaseUser?.isAnonymous ?? false;
    const isSuperAdmin = appUser?.role === 'super_admin';

    /* Email/Password sign in (owner + staff + super admin) */
    const signInWithEmail = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            // Eagerly resolve profile so role is available immediately
            if (cred.user) {
                const profile = await fetchAppUser(cred.user.uid);
                setAppUser(profile);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sign-in failed';
            setError(msg);
        }
    }, []);

    /* Anonymous sign in (Risky Addicts guest access) */
    const signInAnonymously = useCallback(async () => {
        setError(null);
        try {
            await firebaseSignInAnonymously(auth);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Guest access failed';
            setError(msg);
        }
    }, []);

    /* Sign out */
    const signOut = useCallback(async () => {
        setError(null);
        try {
            await firebaseSignOut(auth);
            setAppUser(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sign-out failed';
            setError(msg);
        }
    }, []);

    /* Password reset */
    const resetPassword = useCallback(async (email: string) => {
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Password reset failed';
            setError(msg);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    /* Re-fetch Firestore profile (e.g. after onboarding password change) */
    const refreshAppUser = useCallback(async () => {
        if (firebaseUser && !firebaseUser.isAnonymous) {
            const profile = await fetchAppUser(firebaseUser.uid);
            setAppUser(profile);
        }
    }, [firebaseUser]);

    return (
        <AuthContext.Provider value={{
            firebaseUser, appUser, loading, error,
            isAnonymous, isSuperAdmin,
            signInWithEmail, signInAnonymously,
            signOut, resetPassword, clearError,
            refreshAppUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
