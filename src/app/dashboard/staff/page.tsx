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


import AddStaffModal from '@/components/ui/AddStaffModal';

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
                                        {/* Function: Display secondary roles if any */}
                                        {member.secondaryRoles && member.secondaryRoles.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                                {member.secondaryRoles.map(sr => (
                                                    <span key={sr} style={{
                                                        fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                                        background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)'
                                                    }}>
                                                        + {ROLE_CONFIG[sr]?.shortLabel}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {member.slName && (
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
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
