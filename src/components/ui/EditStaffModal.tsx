'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Check, Save, X } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '@/hooks/useAuth';
import { AppUser, UserRole } from '@/lib/types';
import { ROLE_CONFIG } from '@/lib/constants';

interface EditStaffModalProps {
    open: boolean;
    onClose: () => void;
    onUpdated: () => void;
    staff: AppUser | null;
}

export default function EditStaffModal({ open, onClose, onUpdated, staff }: EditStaffModalProps) {
    const { firebaseUser } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [slName, setSlName] = useState('');
    const [slUuid, setSlUuid] = useState('');
    const [discordUsername, setDiscordUsername] = useState('');
    const [role, setRole] = useState<UserRole>('dj');
    const [secondaryRoles, setSecondaryRoles] = useState<UserRole[]>([]);
    const [state, setState] = useState<'form' | 'saving' | 'success' | 'error'>('form');
    const [errMsg, setErrMsg] = useState('');

    // Pre-fill from staff data
    useEffect(() => {
        if (open && staff) {
            setDisplayName(staff.displayName || '');
            setSlName(staff.slName || '');
            setSlUuid(staff.slUuid || '');
            setDiscordUsername(staff.discordUsername || '');
            setRole(staff.role);
            setSecondaryRoles(staff.secondaryRoles || []);
            setState('form');
            setErrMsg('');
        }
    }, [open, staff]);

    function toggleSecondary(r: UserRole) {
        if (role === r) return;
        setSecondaryRoles(prev =>
            prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
        );
    }

    function handlePrimaryChange(r: UserRole) {
        setRole(r);
        setSecondaryRoles(prev => prev.filter(x => x !== r));
    }

    async function handleSave() {
        if (!staff) return;
        setState('saving');
        setErrMsg('');

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch('/api/update-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    uid: staff.uid,
                    displayName,
                    slName,
                    slUuid,
                    discordUsername,
                    role,
                    secondaryRoles,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');

            setState('success');
            onUpdated();
            setTimeout(() => onClose(), 800);
        } catch (err: unknown) {
            setErrMsg(err instanceof Error ? err.message : 'Failed to update');
            setState('error');
        }
    }

    const availableRoles: UserRole[] = ['dj', 'host', 'manager', 'general_manager'];

    if (!open || !staff) return null;

    return (
        <Modal open={open} onClose={onClose} title={`Edit: ${staff.displayName}`}>
            {state === 'success' ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24,
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(74, 222, 128, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Check size={24} color="#4ade80" />
                    </div>
                    <div style={{ color: '#4ade80', fontWeight: 600 }}>Updated successfully</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Display Name', value: displayName, set: setDisplayName, placeholder: 'e.g. DJ Nova' },
                            { label: 'SL Name', value: slName, set: setSlName, placeholder: 'e.g. Nova Resident' },
                            { label: 'SL UUID', value: slUuid, set: setSlUuid, placeholder: 'Second Life UUID' },
                            { label: 'Discord Server Name', value: discordUsername, set: setDiscordUsername, placeholder: 'Server nickname for presence matching' },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</label>
                                <input
                                    value={f.value} onChange={e => f.set(e.target.value)}
                                    placeholder={f.placeholder}
                                    style={{
                                        width: '100%', marginTop: 4, padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                    {/* Primary Role */}
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Primary Role
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
                            Secondary Roles
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                            {availableRoles.map(r => {
                                if (r === role) return null;
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
                                            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        <div style={{
                                            width: 16, height: 16, borderRadius: 4,
                                            border: '1px solid var(--text-muted)',
                                            background: isSelected ? 'var(--neon-cyan)' : 'transparent',
                                            borderColor: isSelected ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
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

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: 12, borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                        }}>Cancel</button>
                        <button onClick={handleSave} disabled={state === 'saving'} style={{
                            flex: 1, padding: 12, borderRadius: 10,
                            background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)',
                            color: 'var(--neon-cyan)', cursor: state === 'saving' ? 'wait' : 'pointer',
                            fontSize: 14, fontWeight: 600,
                            opacity: state === 'saving' ? 0.6 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                            {state === 'saving' && <Loader2 size={16} className="animate-spin" />}
                            {state === 'saving' ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}
        </Modal>
    );
}
