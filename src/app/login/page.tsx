'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, Eye, EyeOff, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading, error, signInWithEmail, registerWithEmail, signInAnonymously, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        clearError();
        if (isRegister) {
            await registerWithEmail(email, password);
        } else {
            await signInWithEmail(email, password);
        }
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

    if (user) return null;

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#050510', padding: 16, position: 'relative', overflow: 'hidden',
        }}>
            {/* Background particles */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                    { w: 200, bg: '#00f0ff', top: '15%', left: '20%', dur: '18s' },
                    { w: 150, bg: '#c084fc', top: '60%', left: '70%', dur: '14s' },
                    { w: 120, bg: '#ff6b9d', top: '80%', left: '15%', dur: '20s' },
                ].map((p, i) => (
                    <div key={i} style={{
                        position: 'absolute', width: p.w, height: p.w,
                        borderRadius: '50%', filter: 'blur(80px)', opacity: 0.08,
                        background: p.bg, top: p.top, left: p.left,
                        animation: `particle-float ${p.dur} ease-in-out infinite`,
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

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.28)',
                        }} />
                        <input
                            type="email" placeholder="Email" value={email}
                            onChange={e => setEmail(e.target.value)} required
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

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 8,
                            background: 'rgba(255, 0, 60, 0.08)',
                            border: '1px solid rgba(255, 0, 60, 0.2)',
                            color: '#ff6b6b', fontSize: 12,
                        }}>
                            {error.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim()}
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
                        {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
                        {submitting ? 'Please wait...' : (isRegister ? 'Create Owner Account' : 'Sign In')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.28)', marginTop: 20 }}>
                    {isRegister ? 'Already have an account?' : 'First time setup?'}{' '}
                    <button
                        onClick={() => { setIsRegister(!isRegister); clearError(); }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#00f0ff', fontSize: 13, fontWeight: 500,
                            textDecoration: 'underline', textUnderlineOffset: 2,
                        }}>
                        {isRegister ? 'Sign in' : 'Create Owner Account'}
                    </button>
                </p>
            </div>

            <style>{`
                @keyframes particle-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(15px, -20px) scale(1.1); }
                    50% { transform: translate(-10px, 10px) scale(0.9); }
                    75% { transform: translate(20px, 15px) scale(1.05); }
                }
            `}</style>
        </div>
    );
}
