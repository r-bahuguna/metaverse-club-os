'use client';

import React, { useState } from 'react';
import { UserCog, Loader2, Check, Copy } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';
import { ROLE_CONFIG } from '@/lib/constants';
import { logAction } from '@/lib/audit';

interface AddStaffModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function AddStaffModal({ open, onClose, onCreated }: AddStaffModalProps) {
    const { firebaseUser } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [slName, setSlName] = useState('');
    const [slUuid, setSlUuid] = useState('');
    const [discordUsername, setDiscordUsername] = useState('');

    // Role state
    const [role, setRole] = useState<UserRole>('dj');
    const [secondaryRoles, setSecondaryRoles] = useState<UserRole[]>([]);

    const [state, setState] = useState<'form' | 'creating' | 'success' | 'error'>('form');
    const [tempPassword, setTempPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    function reset() {
        setDisplayName('');
        setSlName('');
        setSlUuid('');
        setDiscordUsername('');
        setRole('dj');
        setSecondaryRoles([]);
        setState('form');
        setTempPassword('');
        setCopied(false);
        setErrMsg('');
    }

    function handleClose() {
        reset();
        onClose();
    }

    // Toggle secondary role
    function toggleSecondary(r: UserRole) {
        if (role === r) return; // Can't be secondary if it's primary
        setSecondaryRoles(prev =>
            prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
        );
    }

    // When primary changes, remove it from secondary
    function handlePrimaryChange(r: UserRole) {
        setRole(r);
        setSecondaryRoles(prev => prev.filter(x => x !== r));
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
                body: JSON.stringify({ displayName, slName, slUuid, role, secondaryRoles, discordUsername }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create user');

            setTempPassword(data.tempPassword);
            setState('success');
            logAction({
                action: 'staff_created', actorId: firebaseUser?.uid || '', actorName: 'Manager',
                targetName: displayName, details: `Created staff "${displayName}" as ${ROLE_CONFIG[role]?.label || role}${secondaryRoles.length ? ` (+${secondaryRoles.map(r => ROLE_CONFIG[r]?.label || r).join(', ')})` : ''}`,
            });
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

    const availableRoles: UserRole[] = ['dj', 'host', 'manager', 'general_manager'];

    return (
        <Modal open={open} onClose={handleClose} title={state === 'success' ? '✅ Staff Created' : 'Add Staff Member'}>

            {/* Success State */}
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
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Basic Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Display Name', value: displayName, set: setDisplayName, placeholder: 'e.g. DJ Nova', required: true },
                            { label: 'SL Name (Username)', value: slName, set: setSlName, placeholder: 'e.g. Nova Resident', required: true },
                            { label: 'SL UUID', value: slUuid, set: setSlUuid, placeholder: 'Optional — Second Life UUID', required: false },
                            { label: 'Discord Server Name', value: discordUsername, set: setDiscordUsername, placeholder: 'Server nickname (e.g. KatyUsha)', required: false },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</label>
                                <input
                                    value={f.value} onChange={e => f.set(e.target.value)}
                                    placeholder={f.placeholder} required={f.required}
                                    style={{
                                        width: '100%', marginTop: 4, padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                    {/* Primary Role */}
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Primary Role (Badge Color)
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            {availableRoles.map(r => {
                                const config = ROLE_CONFIG[r];
                                const isSelected = role === r;
                                return (
                                    <button key={r} type="button"
                                        onClick={() => handlePrimaryChange(r)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 20,
                                            border: `1px solid ${isSelected ? `var(${config.color})` : 'var(--glass-border)'}`,
                                            background: isSelected ? `rgba(var(${config.color}-rgb), 0.15)` : 'rgba(255,255,255,0.03)',
                                            color: isSelected ? `var(${config.color})` : 'var(--text-secondary)',
                                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Secondary Roles */}
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Secondary Roles (Permissions)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                            {availableRoles.map(r => {
                                if (r === role) return null; // Skip primary
                                const config = ROLE_CONFIG[r];
                                const isSelected = secondaryRoles.includes(r);
                                return (
                                    <button key={r} type="button"
                                        onClick={() => toggleSecondary(r)}
                                        style={{
                                            padding: '8px 12px', borderRadius: 8,
                                            border: `1px solid ${isSelected ? 'var(--glass-border)' : 'transparent'}`,
                                            background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                                            color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8
                                        }}
                                    >
                                        <div style={{
                                            width: 16, height: 16, borderRadius: 4,
                                            border: '1px solid var(--text-muted)',
                                            background: isSelected ? 'var(--neon-cyan)' : 'transparent',
                                            borderColor: isSelected ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {isSelected && <Check size={12} color="black" strokeWidth={3} />}
                                        </div>
                                        {config.label}
                                    </button>
                                );
                            })}
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

                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button type="button" onClick={handleClose} style={{
                            flex: 1, padding: 12, borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 500
                        }}>Cancel</button>
                        <button type="submit" disabled={state === 'creating'} style={{
                            flex: 1, padding: 12, borderRadius: 10,
                            background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)',
                            color: 'var(--neon-cyan)', cursor: state === 'creating' ? 'wait' : 'pointer',
                            fontSize: 14, fontWeight: 600,
                            opacity: state === 'creating' ? 0.6 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                            {state === 'creating' && <Loader2 size={16} className="animate-spin" />}
                            {state === 'creating' ? 'Creating...' : 'Create Staff'}
                        </button>
                    </div>

                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </form>
            )}
        </Modal>
    );
}
