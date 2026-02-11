'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/* Google "G" logo */
function GoogleIcon() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const { user, loading, error, signInWithGoogle, signInWithEmail, registerWithEmail, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    /* Redirect if already logged in */
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

    async function handleGoogle() {
        clearError();
        await signInWithGoogle();
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-void)',
            }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
            </div>
        );
    }

    if (user) return null; // Redirecting

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-void)', padding: 'var(--space-4)',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Background particles */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                    { w: 200, bg: 'var(--neon-cyan)', top: '15%', left: '20%', dur: '18s' },
                    { w: 150, bg: 'var(--neon-purple)', top: '60%', left: '70%', dur: '14s' },
                    { w: 120, bg: 'var(--neon-pink)', top: '80%', left: '15%', dur: '20s' },
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
                border: '1px solid var(--glass-border)',
                borderRadius: 20, padding: 40,
                backdropFilter: 'blur(40px)',
                boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
                position: 'relative', zIndex: 1,
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', boxShadow: '0 0 24px rgba(0, 240, 255, 0.2)',
                    }}>
                        <Zap size={24} color="#fff" />
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
                        color: 'var(--text-primary)', letterSpacing: '-0.02em',
                    }}>
                        Risky Desires
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        Command Center
                    </p>
                </div>

                {/* Google SSO */}
                <button
                    onClick={handleGoogle}
                    style={{
                        width: '100%', padding: '12px 16px',
                        borderRadius: 10, border: '1px solid var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 10,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                >
                    <GoogleIcon />
                    Continue with Google
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    margin: '24px 0', color: 'var(--text-muted)', fontSize: 12,
                }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                    or
                    <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px 14px 12px 42px',
                                borderRadius: 10, border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'var(--text-primary)', fontSize: 14,
                                outline: 'none', transition: 'border-color 0.2s ease',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)'}
                            onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{
                                width: '100%', padding: '12px 42px 12px 42px',
                                borderRadius: 10, border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'var(--text-primary)', fontSize: 14,
                                outline: 'none', transition: 'border-color 0.2s ease',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)'}
                            onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: 0,
                            }}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Error */}
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

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%', padding: '12px 16px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(192, 132, 252, 0.15))',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            color: 'var(--neon-cyan)', fontSize: 14, fontWeight: 600,
                            cursor: submitting ? 'wait' : 'pointer',
                            opacity: submitting ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {submitting ? 'Signing in...' : (isRegister ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                {/* Toggle register/login */}
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => { setIsRegister(!isRegister); clearError(); }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--neon-cyan)', fontSize: 13, fontWeight: 500,
                            textDecoration: 'underline', textUnderlineOffset: 2,
                        }}
                    >
                        {isRegister ? 'Sign in' : 'Create one'}
                    </button>
                </p>
            </div>

            {/* Particle keyframes (inline since this page is outside dashboard layout) */}
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
