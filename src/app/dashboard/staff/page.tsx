'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Headphones, Mic, UserCog, Shield, Crown, Star, Plus, Copy, Check, Loader2, X, ShieldCheck } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROLE_CONFIG } from '@/lib/constants';
import { OnlineStatus, UserRole, AppUser } from '@/lib/types';

const roleIcons: Record<string, React.ReactNode> = {
    super_admin: <ShieldCheck size={14} />,
    owner: <Crown size={14} />,
    general_manager: <Shield size={14} />,
    manager: <UserCog size={14} />,
    dj: <Headphones size={14} />,
    host: <Mic size={14} />,
    vip_member: <Star size={14} />,
};

const roleGradients: Record<string, string> = {
    super_admin: 'linear-gradient(135deg, #ef4444, #dc2626)',
    owner: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    general_manager: 'linear-gradient(135deg, #00f0ff, #0ea5e9)',
    manager: 'linear-gradient(135deg, #4ade80, #22c55e)',
    dj: 'linear-gradient(135deg, #c084fc, #a855f7)',
    host: 'linear-gradient(135deg, #ff6b9d, #ec4899)',
};

const neonMap: Record<UserRole, 'cyan' | 'purple' | 'pink' | 'green' | 'none'> = {
    super_admin: 'cyan',
    owner: 'cyan',
    general_manager: 'cyan',
    manager: 'green',
    dj: 'purple',
    host: 'pink',
    vip_member: 'none',
    member: 'none',
};

const statusVariant: Record<OnlineStatus, 'online' | 'away' | 'offline'> = {
    online: 'online',
    away: 'away',
    offline: 'offline',
};

/* ── Add Staff Modal ── */
function AddStaffModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const { firebaseUser } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [slName, setSlName] = useState('');
    const [slUuid, setSlUuid] = useState('');
    const [role, setRole] = useState<'dj' | 'host' | 'manager' | 'general_manager'>('dj');
    const [state, setState] = useState<'form' | 'creating' | 'success' | 'error'>('form');
    const [tempPassword, setTempPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    function reset() {
        setDisplayName('');
        setSlName('');
        setSlUuid('');
        setRole('dj');
        setState('form');
        setTempPassword('');
        setCopied(false);
        setErrMsg('');
    }

    function handleClose() {
        reset();
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setState('creating');
        setErrMsg('');

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ displayName, slName, slUuid, role }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create user');

            setTempPassword(data.tempPassword);
            setState('success');
            onCreated();
        } catch (err: unknown) {
            setErrMsg(err instanceof Error ? err.message : 'Failed to create user');
            setState('error');
        }
    }

    async function handleCopy() {
        const text = `Username: ${slName}\nTemporary Password: ${tempPassword}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        }} onClick={handleClose}>
            <div style={{
                maxWidth: 440, width: '90%',
                background: 'rgba(15, 15, 30, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: 20, padding: 28,
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {state === 'success' ? '✅ Staff Created' : 'Add Staff Member'}
                    </h3>
                    <button onClick={handleClose} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 4,
                    }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Success State — show temp credentials */}
                {state === 'success' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{
                            padding: 16, borderRadius: 12,
                            background: 'rgba(74, 222, 128, 0.06)',
                            border: '1px solid rgba(74, 222, 128, 0.15)',
                        }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Login Credentials (one-time view)
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8 }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Username:</span> <strong style={{ color: 'var(--neon-cyan)' }}>{slName}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Password:</span> <strong style={{ color: '#4ade80' }}>{tempPassword}</strong></div>
                            </div>
                        </div>
                        <button onClick={handleCopy} style={{
                            padding: '10px 16px', borderRadius: 8,
                            background: copied ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0, 240, 255, 0.08)',
                            border: `1px solid ${copied ? 'rgba(74, 222, 128, 0.3)' : 'rgba(0, 240, 255, 0.2)'}`,
                            color: copied ? '#4ade80' : 'var(--neon-cyan)',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.2s ease',
                        }}>
                            {copied ? <Check size={15} /> : <Copy size={15} />}
                            {copied ? 'Copied!' : 'Copy Credentials'}
                        </button>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                            Share these credentials with the staff member. They will be prompted to change their password on first login.
                        </p>
                    </div>
                )}

                {/* Form State */}
                {(state === 'form' || state === 'creating' || state === 'error') && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                            { label: 'Display Name', value: displayName, set: setDisplayName, placeholder: 'e.g. DJ Nova', required: true },
                            { label: 'SL Name (Username)', value: slName, set: setSlName, placeholder: 'e.g. Nova Resident', required: true },
                            { label: 'SL UUID', value: slUuid, set: setSlUuid, placeholder: 'Optional — Second Life UUID', required: false },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</label>
                                <input
                                    value={f.value} onChange={e => f.set(e.target.value)}
                                    placeholder={f.placeholder} required={f.required}
                                    style={{
                                        width: '100%', marginTop: 4, padding: '9px 12px',
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                    }}
                                />
                            </div>
                        ))}

                        <div>
                            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</label>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                {([
                                    { value: 'dj', label: 'DJ', color: '#c084fc' },
                                    { value: 'host', label: 'Host', color: '#ff6b9d' },
                                    { value: 'manager', label: 'Manager', color: '#4ade80' },
                                    { value: 'general_manager', label: 'GM', color: '#00f0ff' },
                                ] as const).map(r => (
                                    <button key={r.value} type="button"
                                        onClick={() => setRole(r.value)}
                                        style={{
                                            padding: '6px 14px', borderRadius: 8,
                                            border: `1px solid ${role === r.value ? r.color + '60' : 'var(--glass-border)'}`,
                                            background: role === r.value ? r.color + '15' : 'transparent',
                                            color: role === r.value ? r.color : 'var(--text-secondary)',
                                            fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {r.label}
                                    </button>
                                ))}
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

                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button type="button" onClick={handleClose} style={{
                                flex: 1, padding: 10, borderRadius: 8,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                            }}>Cancel</button>
                            <button type="submit" disabled={state === 'creating'} style={{
                                flex: 1, padding: 10, borderRadius: 8,
                                background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)',
                                color: 'var(--neon-cyan)', cursor: state === 'creating' ? 'wait' : 'pointer',
                                fontSize: 13, fontWeight: 500,
                                opacity: state === 'creating' ? 0.6 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                                {state === 'creating' && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                {state === 'creating' ? 'Creating...' : 'Create Staff'}
                            </button>
                        </div>

                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </form>
                )}
            </div>
        </div>
    );
}

/* ── Staff Page ── */
export default function StaffPage() {
    const { can } = useRole();
    const [showAddModal, setShowAddModal] = useState(false);
    const [staff, setStaff] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStaff = useCallback(async () => {
        try {
            const q = query(collection(db, 'users'), orderBy('role'));
            const snap = await getDocs(q);
            const users: AppUser[] = snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
            setStaff(users);
        } catch (err) {
            console.warn('[StaffPage] Failed to fetch staff:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    if (!can('manager')) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🔒</p>
                <p>You don&apos;t have permission to view the staff directory.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Staff Directory
                </h1>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                        color: 'var(--neon-cyan)', background: 'var(--neon-cyan-dim)',
                        padding: '2px 10px', borderRadius: 'var(--radius-full)',
                    }}>
                        {staff.length} members
                    </span>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8,
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            background: 'rgba(0, 240, 255, 0.06)',
                            color: 'var(--neon-cyan)', fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                    >
                        <Plus size={14} /> Add Staff
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    Loading staff...
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
                    {staff.map(member => {
                        const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                        const status = (member.onlineStatus || 'offline') as OnlineStatus;
                        return (
                            <GlassCard key={member.uid} neon={neonMap[member.role]} interactive>
                                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 'var(--radius-full)',
                                        background: roleGradients[member.role] || '#444',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 'var(--text-lg)', fontWeight: 600, color: '#fff', flexShrink: 0,
                                    }}>
                                        {member.displayName.charAt(0)}
                                    </div>
                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                            <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {member.displayName}
                                            </span>
                                            <StatusBadge variant={statusVariant[status]} pulse={status === 'online'} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: `var(${config.color})`, marginBottom: '4px' }}>
                                            {roleIcons[member.role]}
                                            {config.label}
                                        </div>
                                        {member.slName && (
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {member.slName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            <AddStaffModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={fetchStaff}
            />
        </div>
    );
}
