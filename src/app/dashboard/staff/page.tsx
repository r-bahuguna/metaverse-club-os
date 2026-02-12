'use client';

import React from 'react';
import { Headphones, Mic, UserCog, Shield, Crown, Star } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { MOCK_STAFF } from '@/lib/mock-data';
import { ROLE_CONFIG } from '@/lib/constants';
import { OnlineStatus, UserRole } from '@/lib/types';

const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown size={14} />,
    general_manager: <Shield size={14} />,
    manager: <UserCog size={14} />,
    dj: <Headphones size={14} />,
    host: <Mic size={14} />,
    vip_member: <Star size={14} />,
};

const roleGradients: Record<string, string> = {
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

export default function StaffPage() {
    const { can } = useRole();

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
                <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                    color: 'var(--neon-cyan)', background: 'var(--neon-cyan-dim)',
                    padding: '2px 10px', borderRadius: 'var(--radius-full)',
                }}>
                    {MOCK_STAFF.length} members
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
                {MOCK_STAFF.map(staff => {
                    const config = ROLE_CONFIG[staff.role];
                    return (
                        <GlassCard key={staff.id} neon={neonMap[staff.role]} interactive>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 48, height: 48, borderRadius: 'var(--radius-full)',
                                    background: roleGradients[staff.role] || '#444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 'var(--text-lg)', fontWeight: 600, color: '#fff', flexShrink: 0,
                                }}>
                                    {staff.displayName.charAt(0)}
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                        <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {staff.displayName}
                                        </span>
                                        <StatusBadge variant={statusVariant[staff.onlineStatus]} pulse={staff.onlineStatus === 'online'} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: `var(${config.color})`, marginBottom: '4px' }}>
                                        {roleIcons[staff.role]}
                                        {config.label}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                                        {staff.slName}
                                    </div>

                                    {/* Stats row */}
                                    <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hours</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {staff.hoursThisWeek}h
                                            </div>
                                        </div>
                                        {staff.tipsThisWeek > 0 && (
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tips</div>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--neon-green)' }}>
                                                    L${staff.tipsThisWeek.toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                        {staff.rating && (
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rating</div>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--neon-amber)' }}>
                                                    ★ {staff.rating}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {staff.specialties && staff.specialties.length > 0 && (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
                                            {staff.specialties.map(s => (
                                                <span key={s} style={{
                                                    fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                                    background: 'var(--neon-purple-dim)', color: 'var(--neon-purple)',
                                                }}>
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
