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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
            secondaryRoles: data.secondaryRoles,
            slName: data.slName,
            slUuid: data.slUuid,
            discordUsername: data.discordUsername,
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

/* ── Web session presence helpers ── */
async function setPresence(uid: string, status: 'online' | 'away' | 'offline') {
    try {
        await updateDoc(doc(db, 'users', uid), {
            onlineStatus: status,
            lastSeen: new Date().toISOString(),
        });
    } catch { /* silent */ }
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
                const profile = await fetchAppUser(fbUser.uid);
                setAppUser(profile);
                setPresence(fbUser.uid, 'online');
            } else {
                setAppUser(null);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    /* Web presence: heartbeat every 2 min + visibility tracking + reliable unload */
    useEffect(() => {
        if (!firebaseUser || firebaseUser.isAnonymous) return;
        const uid = firebaseUser.uid;

        // Heartbeat: update lastSeen every 2 minutes while page is visible
        const heartbeat = setInterval(() => {
            if (!document.hidden) {
                setPresence(uid, 'online');
            }
        }, 2 * 60 * 1000); // Every 2 minutes

        const handleVisibility = () => {
            setPresence(uid, document.hidden ? 'away' : 'online');
        };

        const handleUnload = () => {
            // Use sendBeacon for reliable offline on page close
            try {
                const url = `https://firestore.googleapis.com/v1/projects/risky-desires/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=onlineStatus&updateMask.fieldPaths=lastSeen`;
                const body = JSON.stringify({
                    fields: {
                        onlineStatus: { stringValue: 'offline' },
                        lastSeen: { stringValue: new Date().toISOString() },
                    }
                });
                navigator.sendBeacon(url, body);
            } catch {
                // Fallback
                setPresence(uid, 'offline');
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(heartbeat);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [firebaseUser]);

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
            if (firebaseUser && !firebaseUser.isAnonymous) {
                await setPresence(firebaseUser.uid, 'offline');
            }
            await firebaseSignOut(auth);
            setAppUser(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sign-out failed';
            setError(msg);
        }
    }, [firebaseUser]);

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
