'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, User, Lock, Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';

export default function LoginPage() {
    const router = useRouter();
    const { firebaseUser, loading, error, signInWithEmail, signInAnonymously, clearError } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && firebaseUser) {
            router.push('/dashboard');
        }
    }, [firebaseUser, loading, router]);

    /* Resolve username → email if input doesn't contain @ */
    async function resolveEmail(input: string): Promise<string | null> {
        if (input.includes('@')) return input; // already an email

        try {
            // Look up Firestore user by slName (case-insensitive match)
            const q = query(collection(db, 'users'), where('slName', '==', input));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return snap.docs[0].data().email || null;
            }

            // Also try by displayName as fallback
            const q2 = query(collection(db, 'users'), where('displayName', '==', input));
            const snap2 = await getDocs(q2);
            if (!snap2.empty) {
                return snap2.docs[0].data().email || null;
            }

            return null;
        } catch {
            return null;
        }
    }

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setLookupError(null);
        clearError();

        const email = await resolveEmail(username.trim());
        if (!email) {
            setLookupError('Username not found. Try your full email address instead.');
            setSubmitting(false);
            return;
        }

        await signInWithEmail(email, password);
        setSubmitting(false);
    }

    async function handleAnonymous() {
        clearError();
        await signInAnonymously();
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid rgba(0, 240, 255, 0.15)', borderTopColor: '#00f0ff',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (firebaseUser) return null;

    const displayError = lookupError || error;

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#050510', padding: 16, position: 'relative', overflow: 'hidden',
        }}>
            {/* Floating particles — Same dreamy effect as sidebar, 25% faster */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                    { s: 3, x: '15%', y: '20%', dur: '14.4s', d: '0s' },
                    { s: 2, x: '40%', y: '65%', dur: '17.6s', d: '-2.4s' },
                    { s: 4, x: '60%', y: '10%', dur: '12s', d: '-4.8s' },
                    { s: 2, x: '80%', y: '75%', dur: '16s', d: '-1.6s' },
                    { s: 3, x: '25%', y: '45%', dur: '19.2s', d: '-6.4s' },
                    { s: 2, x: '70%', y: '85%', dur: '13.6s', d: '-4s' },
                    { s: 3, x: '50%', y: '35%', dur: '16.8s', d: '-8s' },
                    { s: 2, x: '85%', y: '55%', dur: '15.2s', d: '-5.6s' },
                    { s: 4, x: '10%', y: '80%', dur: '12.8s', d: '-9.6s' },
                    { s: 2, x: '55%', y: '50%', dur: '18.4s', d: '-3.2s' },
                    { s: 3, x: '35%', y: '15%', dur: '11.2s', d: '-7.2s' },
                    { s: 2, x: '75%', y: '90%', dur: '20s', d: '-8.8s' },
                ].map((p, i) => (
                    <div key={i} style={{
                        position: 'absolute', width: p.s, height: p.s,
                        borderRadius: '50%', background: 'rgba(255, 255, 255, 0.35)',
                        left: p.x, top: p.y,
                        animation: `loginFloat ${p.dur} linear infinite`,
                        animationDelay: p.d,
                    }} />
                ))}
            </div>

            {/* Login Card */}
            <div style={{
                width: '100%', maxWidth: 420,
                background: 'rgba(10, 10, 20, 0.85)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, padding: 40,
                backdropFilter: 'blur(40px)',
                boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
                position: 'relative', zIndex: 1,
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'linear-gradient(135deg, #00f0ff, #c084fc)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', boxShadow: '0 0 24px rgba(0, 240, 255, 0.2)',
                    }}>
                        <Zap size={24} color="#fff" />
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
                        color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em',
                    }}>
                        Risky Desires
                    </h1>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
                        Command Center
                    </p>
                </div>

                {/* Anonymous — Risky Addicts Guest */}
                <button
                    onClick={handleAnonymous}
                    style={{
                        width: '100%', padding: '12px 16px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.12), rgba(192, 132, 252, 0.12))',
                        border: '1px solid rgba(255, 107, 157, 0.25)',
                        color: '#ff6b9d', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 157, 0.2), rgba(192, 132, 252, 0.2))';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.15)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 157, 0.12), rgba(192, 132, 252, 0.12))';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Sparkles size={16} />
                    Enter as Risky Addict
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    margin: '24px 0', color: 'rgba(255,255,255,0.28)', fontSize: 12,
                }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    Staff &amp; Owner
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Login Form */}
                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ position: 'relative' }}>
                        <User size={16} style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.28)',
                        }} />
                        <input
                            type="text" placeholder="Username or Email" value={username}
                            onChange={e => setUsername(e.target.value)} required
                            autoComplete="username"
                            style={{
                                width: '100%', padding: '12px 14px 12px 42px',
                                borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.92)', fontSize: 14,
                                outline: 'none', transition: 'border-color 0.2s ease',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.28)',
                        }} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password" value={password}
                            onChange={e => setPassword(e.target.value)} required minLength={6}
                            autoComplete="current-password"
                            style={{
                                width: '100%', padding: '12px 42px 12px 42px',
                                borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.92)', fontSize: 14,
                                outline: 'none', transition: 'border-color 0.2s ease',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.28)', padding: 0,
                            }}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {displayError && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 8,
                            background: 'rgba(255, 0, 60, 0.08)',
                            border: '1px solid rgba(255, 0, 60, 0.2)',
                            color: '#ff6b6b', fontSize: 12,
                        }}>
                            {displayError.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim()}
                        </div>
                    )}

                    <button type="submit" disabled={submitting}
                        style={{
                            width: '100%', padding: '12px 16px', borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(192, 132, 252, 0.15))',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            color: '#00f0ff', fontSize: 14, fontWeight: 600,
                            cursor: submitting ? 'wait' : 'pointer',
                            opacity: submitting ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                        <LogIn size={16} />
                        {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes loginFloat {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.5;
                    }
                    25% {
                        transform: translate(12px, -8px) scale(1.1);
                        opacity: 0.4;
                    }
                    50% {
                        transform: translate(-8px, 6px) scale(0.9);
                        opacity: 0.6;
                    }
                    75% {
                        transform: translate(10px, -4px) scale(1.05);
                        opacity: 0.3;
                    }
                    90% {
                        opacity: 0.15;
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
