'use client';

import React, { useState } from 'react';
import { KeyRound, Loader2, Check, ShieldCheck } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';

/**
 * Full-screen onboarding modal shown when appUser.mustChangePassword is true.
 * Forces staff to set a new password on their first login.
 */
export default function OnboardingModal() {
    const { firebaseUser, appUser, refreshAppUser } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
    const [errMsg, setErrMsg] = useState('');

    if (!appUser?.mustChangePassword || !firebaseUser) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrMsg('');

        if (newPassword.length < 6) {
            setErrMsg('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirm) {
            setErrMsg('Passwords do not match');
            return;
        }

        setState('saving');
        try {
            await updatePassword(firebaseUser!, newPassword);
            await updateDoc(doc(db, 'users', firebaseUser!.uid), { mustChangePassword: false });
            await refreshAppUser();
            setState('done');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to update password';
            setErrMsg(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
            setState('error');
        }
    }

    if (state === 'done') {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(5, 5, 16, 0.95)', backdropFilter: 'blur(20px)',
            }}>
                <div style={{ textAlign: 'center', color: '#4ade80' }}>
                    <Check size={48} style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Password Updated!</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5, 5, 16, 0.95)', backdropFilter: 'blur(20px)',
        }}>
            <div style={{
                maxWidth: 420, width: '90%',
                background: 'rgba(15, 15, 30, 0.95)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, padding: 36,
                boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'linear-gradient(135deg, #c084fc, #00f0ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', boxShadow: '0 0 24px rgba(192, 132, 252, 0.3)',
                    }}>
                        <ShieldCheck size={24} color="#fff" />
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--font-display, system-ui)', fontSize: 20, fontWeight: 700,
                        color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em',
                    }}>
                        Welcome to Metaverse Club OS
                    </h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                        Hi <strong style={{ color: '#c084fc' }}>{appUser.displayName}</strong> — please set a new password to continue.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            New Password
                        </label>
                        <div style={{ position: 'relative', marginTop: 4 }}>
                            <KeyRound size={15} style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'rgba(255,255,255,0.25)',
                            }} />
                            <input
                                type="password" value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required minLength={6}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                style={{
                                    width: '100%', padding: '10px 14px 10px 38px',
                                    borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'rgba(255,255,255,0.9)', fontSize: 14, outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Confirm Password
                        </label>
                        <div style={{ position: 'relative', marginTop: 4 }}>
                            <KeyRound size={15} style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'rgba(255,255,255,0.25)',
                            }} />
                            <input
                                type="password" value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                required minLength={6}
                                placeholder="Repeat your new password"
                                autoComplete="new-password"
                                style={{
                                    width: '100%', padding: '10px 14px 10px 38px',
                                    borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'rgba(255,255,255,0.9)', fontSize: 14, outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    {errMsg && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 8,
                            background: 'rgba(255, 0, 60, 0.08)',
                            border: '1px solid rgba(255, 0, 60, 0.2)',
                            color: '#ff6b6b', fontSize: 12,
                        }}>
                            {errMsg}
                        </div>
                    )}

                    <button
                        type="submit" disabled={state === 'saving'}
                        style={{
                            width: '100%', padding: '12px 16px', borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.15), rgba(0, 240, 255, 0.15))',
                            border: '1px solid rgba(192, 132, 252, 0.3)',
                            color: '#c084fc', fontSize: 14, fontWeight: 600,
                            cursor: state === 'saving' ? 'wait' : 'pointer',
                            opacity: state === 'saving' ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            marginTop: 4,
                        }}
                    >
                        {state === 'saving' && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                        {state === 'saving' ? 'Updating...' : 'Set Password & Continue'}
                    </button>
                </form>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
