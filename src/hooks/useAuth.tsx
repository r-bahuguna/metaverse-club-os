'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    signInAnonymously as firebaseSignInAnonymously,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/* ── Types ── */
interface AuthContextValue {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAnonymous: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string) => Promise<void>;
    signInAnonymously: () => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    error: null,
    isAnonymous: false,
    signInWithEmail: async () => { },
    registerWithEmail: async () => { },
    signInAnonymously: async () => { },
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    /* Email/Password sign in (owner + staff) */
    const signInWithEmail = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sign-in failed';
            setError(msg);
        }
    }, []);

    /* Email/Password register (initial owner setup) */
    const registerWithEmail = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Registration failed';
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
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sign-out failed';
            setError(msg);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider value={{
            user, loading, error,
            isAnonymous: user?.isAnonymous ?? false,
            signInWithEmail, registerWithEmail, signInAnonymously,
            signOut, clearError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
