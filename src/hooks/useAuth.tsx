'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/* ── Types ── */
interface AuthContextValue {
    user: User | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    error: null,
    signInWithGoogle: async () => { },
    signInWithEmail: async () => { },
    registerWithEmail: async () => { },
    signOut: async () => { },
    clearError: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* Listen for auth state changes */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    /* Google SSO */
    const signInWithGoogle = useCallback(async () => {
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Google sign-in failed';
            setError(msg);
        }
    }, []);

    /* Email/Password sign in */
    const signInWithEmail = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sign-in failed';
            setError(msg);
        }
    }, []);

    /* Email/Password register */
    const registerWithEmail = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Registration failed';
            setError(msg);
        }
    }, []);

    /* Sign out */
    const signOut = useCallback(async () => {
        setError(null);
        try {
            await firebaseSignOut(auth);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sign-out failed';
            setError(msg);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider value={{
            user, loading, error,
            signInWithGoogle, signInWithEmail, registerWithEmail,
            signOut, clearError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
