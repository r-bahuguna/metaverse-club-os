'use client';

import React, { useState } from 'react';
import { Settings, Bell, Shield, Palette, Globe, Zap, ChevronRight, KeyRound, Check, Loader2 } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface ToggleProps {
    enabled: boolean;
    onChange: (val: boolean) => void;
    color?: string;
}

function Toggle({ enabled, onChange, color = 'var(--neon-cyan)' }: ToggleProps) {
    const { playSound } = useSettings();

    function handleChange(val: boolean) {
        playSound('toggle');
        onChange(val);
    }

    return (
        <button
            onClick={() => handleChange(!enabled)}
            style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: enabled ? color : 'rgba(255,255,255,0.1)',
                position: 'relative', transition: 'background 0.2s ease',
                boxShadow: enabled ? `0 0 12px ${color}40` : 'none',
            }}
        >
            <span style={{
                position: 'absolute', top: 2, left: enabled ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
        </button>
    );
}

interface SettingRowProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    children: React.ReactNode;
}

function SettingRow({ icon, label, description, children }: SettingRowProps) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
            padding: 'var(--space-4) 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
            <div style={{ color: 'var(--neon-cyan)', flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
            </div>
            {children}
        </div>
    );
}

/* ── Password Reset Section ── */
function PasswordResetSection() {
    const { appUser, firebaseUser, isSuperAdmin, resetPassword } = useAuth();
    const { can } = useRole();

    const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [requestReason, setRequestReason] = useState('');

    const isPrivileged = isSuperAdmin || appUser?.role === 'owner';

    /* Super Admin / Owner: send reset link directly */
    async function handleDirectReset() {
        if (!firebaseUser?.email) return;
        setResetState('sending');
        try {
            await resetPassword(firebaseUser.email);
            setResetState('sent');
        } catch {
            setResetState('error');
        }
    }

    /* Staff: submit a password reset request to Firestore for Owner/GM/Manager to process */
    async function handleRequestReset() {
        if (!appUser) return;
        setRequestState('sending');
        try {
            await addDoc(collection(db, 'password_reset_requests'), {
                uid: firebaseUser?.uid,
                displayName: appUser.displayName,
                email: appUser.email,
                role: appUser.role,
                reason: requestReason.trim() || 'Password reset requested',
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            setRequestState('sent');
            setRequestReason('');
        } catch {
            setRequestState('error');
        }
    }

    if (!can('member') || !firebaseUser || firebaseUser.isAnonymous) return null;

    return (
        <AnimatedCard index={2}>
            <GlassCard neon="purple">
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600,
                    color: 'var(--text-primary)', marginBottom: 'var(--space-3)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                }}>
                    <KeyRound size={18} style={{ color: 'var(--neon-purple)' }} />
                    Account Security
                </h2>

                {isPrivileged ? (
                    /* Super Admin / Owner — direct reset */
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                        padding: 'var(--space-4) 0',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                                Reset Password
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Send a password reset link to {firebaseUser?.email}
                            </div>
                        </div>
                        <button
                            onClick={handleDirectReset}
                            disabled={resetState === 'sending' || resetState === 'sent'}
                            style={{
                                padding: '8px 16px', borderRadius: 8,
                                background: resetState === 'sent'
                                    ? 'rgba(74, 222, 128, 0.12)'
                                    : 'rgba(192, 132, 252, 0.12)',
                                border: `1px solid ${resetState === 'sent' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(192, 132, 252, 0.3)'}`,
                                color: resetState === 'sent' ? '#4ade80' : '#c084fc',
                                fontSize: 12, fontWeight: 600,
                                cursor: resetState === 'sending' || resetState === 'sent' ? 'default' : 'pointer',
                                opacity: resetState === 'sending' ? 0.6 : 1,
                                display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {resetState === 'sending' && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                            {resetState === 'sent' && <Check size={13} />}
                            {resetState === 'sent' ? 'Link Sent!' : resetState === 'sending' ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                ) : (
                    /* Staff — submit request for manager to process */
                    <div style={{ padding: 'var(--space-3) 0' }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Request Password Reset
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                            Your request will be sent to a manager who will provide a new temporary password.
                        </div>

                        {requestState === 'sent' ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderRadius: 8,
                                background: 'rgba(74, 222, 128, 0.08)',
                                border: '1px solid rgba(74, 222, 128, 0.2)',
                                color: '#4ade80', fontSize: 12,
                            }}>
                                <Check size={14} />
                                Request submitted! A manager will provide a new password.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    placeholder="Reason (optional)"
                                    value={requestReason}
                                    onChange={e => setRequestReason(e.target.value)}
                                    style={{
                                        flex: 1, padding: '8px 12px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.85)', fontSize: 12,
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    onClick={handleRequestReset}
                                    disabled={requestState === 'sending'}
                                    style={{
                                        padding: '8px 14px', borderRadius: 8,
                                        background: 'rgba(192, 132, 252, 0.12)',
                                        border: '1px solid rgba(192, 132, 252, 0.3)',
                                        color: '#c084fc', fontSize: 12, fontWeight: 600,
                                        cursor: requestState === 'sending' ? 'wait' : 'pointer',
                                        opacity: requestState === 'sending' ? 0.6 : 1,
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {requestState === 'sending' ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        )}

                        {requestState === 'error' && (
                            <div style={{
                                marginTop: 8, padding: '8px 12px', borderRadius: 8,
                                background: 'rgba(255, 0, 60, 0.08)',
                                border: '1px solid rgba(255, 0, 60, 0.2)',
                                color: '#ff6b6b', fontSize: 12,
                            }}>
                                Failed to submit request. Please try again.
                            </div>
                        )}
                    </div>
                )}
            </GlassCard>
        </AnimatedCard>
    );
}

export default function SettingsPage() {
    const { can } = useRole();
    const { darkMode, animations, sounds, update } = useSettings();
    const { firebaseUser } = useAuth();
    const isLoggedIn = firebaseUser && !firebaseUser.isAnonymous;

    if (!can('member')) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🔒</p>
                <p>Settings requires at least Member access.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 720 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Settings size={24} style={{ color: 'var(--neon-cyan)' }} />
                Settings
            </h1>

            {/* Notifications & Sound */}
            <AnimatedCard index={0}>
                <GlassCard>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Bell size={18} style={{ color: 'var(--neon-purple)' }} />
                        Notifications &amp; Sound
                    </h2>
                    <SettingRow icon={<Globe size={16} />} label="Sound Effects" description="Play synth tones for toggles, tips, and notifications">
                        <Toggle enabled={sounds} onChange={v => update('sounds', v)} color="var(--neon-pink)" />
                    </SettingRow>
                </GlassCard>
            </AnimatedCard>

            {/* Appearance */}
            <AnimatedCard index={1}>
                <GlassCard>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Palette size={18} style={{ color: 'var(--neon-pink)' }} />
                        Appearance
                    </h2>
                    <SettingRow icon={<Palette size={16} />} label="Dark Mode" description="Switch between dark cyber theme and light mode">
                        <Toggle enabled={darkMode} onChange={v => update('darkMode', v)} color="var(--neon-purple)" />
                    </SettingRow>
                    <SettingRow icon={<Zap size={16} />} label="Animations" description="Enable card animations, hover effects, and page transitions">
                        <Toggle enabled={animations} onChange={v => update('animations', v)} />
                    </SettingRow>
                </GlassCard>
            </AnimatedCard>

            {/* Account Security — Password Reset (all signed-in users) */}
            {isLoggedIn && <PasswordResetSection />}

            {/* Security & Access (Owner only) */}
            {can('owner') && (
                <AnimatedCard index={3}>
                    <GlassCard neon="cyan">
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Shield size={18} style={{ color: 'var(--neon-cyan)' }} />
                            Security &amp; Access
                        </h2>
                        {[
                            { label: 'Manage Roles', desc: 'Assign and modify staff permissions' },
                            { label: 'API Keys', desc: 'LSL object authentication keys' },
                            { label: 'Audit Log', desc: 'View all system actions and changes' },
                            { label: 'Firebase Config', desc: 'Database and hosting settings' },
                        ].map((item, i) => (
                            <SettingRow key={i} icon={<Shield size={16} />} label={item.label} description={item.desc}>
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            </SettingRow>
                        ))}
                    </GlassCard>
                </AnimatedCard>
            )}

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                Risky Desires Command Center v1.0 · Settings apply immediately
            </p>
        </div>
    );
}
