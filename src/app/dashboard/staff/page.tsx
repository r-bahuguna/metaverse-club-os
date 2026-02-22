'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Headphones, Mic, UserCog, Shield, Crown, Star, Plus, ShieldCheck, Search, Filter, Users, Pencil } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { usePresence, getDiscordColor, getDiscordLabel, DiscordStatus, UserPresence } from '@/hooks/usePresence';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/ui/GlassCard';
import { ROLE_CONFIG, ROLE_HIERARCHY } from '@/lib/constants';
import { UserRole, AppUser } from '@/lib/types';
import AddStaffModal from '@/components/ui/AddStaffModal';
import EditStaffModal from '@/components/ui/EditStaffModal';

/* ── Role icons ── */
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

type FilterCategory = 'all' | 'management' | 'dj' | 'host' | 'online';

const CATEGORY_ROLES: Record<FilterCategory, UserRole[]> = {
    all: [],
    management: ['super_admin', 'owner', 'general_manager', 'manager'],
    dj: ['dj'],
    host: ['host'],
    online: [],
};

const FILTER_TABS: { key: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Users size={13} /> },
    { key: 'management', label: 'Management', icon: <Shield size={13} /> },
    { key: 'dj', label: 'DJs', icon: <Headphones size={13} /> },
    { key: 'host', label: 'Hosts', icon: <Mic size={13} /> },
    { key: 'online', label: 'Online', icon: <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} /> },
];

/* ── Discord Presence Dot ── */
function DiscordDot({ status, size = 10 }: { status: DiscordStatus; size?: number }) {
    const color = getDiscordColor(status);
    return (
        <div
            title={`Discord: ${getDiscordLabel(status)}`}
            style={{
                width: size, height: size, borderRadius: '50%',
                background: color,
                border: '2px solid rgba(10, 10, 30, 0.9)',
                boxShadow: status === 'online' ? `0 0 6px ${color}` : 'none',
                flexShrink: 0,
                animation: status === 'online' ? 'presencePulse 2s ease-in-out infinite' : 'none',
            }}
        />
    );
}

/* ── Web Presence Badge (corner glow) ── */
function WebBadge({ isOnWebsite }: { isOnWebsite: boolean }) {
    if (!isOnWebsite) return null;
    return (
        <div style={{
            position: 'absolute', top: -3, right: -3,
            fontSize: 7, fontWeight: 700, letterSpacing: '0.04em',
            padding: '1px 4px', borderRadius: 4,
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            color: '#00f0ff',
            textTransform: 'uppercase',
            boxShadow: '0 0 8px rgba(0, 240, 255, 0.2)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
        }}>
            WEB
        </div>
    );
}

/* ── Staff Card ── */
function StaffCard({ member, presence, onEdit }: { member: AppUser; presence: UserPresence; onEdit?: () => void }) {
    const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
    const { discordStatus, isOnWebsite } = presence;
    return (
        <div style={{
            display: 'flex', gap: 14, alignItems: 'center',
            padding: '16px 20px',
            background: isOnWebsite ? 'rgba(0, 240, 255, 0.02)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isOnWebsite ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 16,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'default',
            position: 'relative',
        }}
            onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={e => {
                e.currentTarget.style.background = isOnWebsite ? 'rgba(0, 240, 255, 0.02)' : 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = isOnWebsite ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* 'On Website' corner badge */}
            <WebBadge isOnWebsite={isOnWebsite} />

            {/* Avatar with Discord presence dot */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: roleGradients[member.role] || 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: 700, color: '#fff',
                    boxShadow: `0 0 12px ${getDiscordColor(discordStatus)}22`,
                }}>
                    {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                    <DiscordDot status={discordStatus} />
                </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.displayName}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: `var(${config.color})` }}>
                        {roleIcons[member.role]}
                        {config.label}
                    </span>
                    {member.secondaryRoles && member.secondaryRoles.length > 0 && (
                        <>
                            <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                            {member.secondaryRoles.map(sr => (
                                <span key={sr} style={{
                                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
                                }}>
                                    +{ROLE_CONFIG[sr]?.shortLabel}
                                </span>
                            ))}
                        </>
                    )}
                </div>
                {member.slName && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                        {member.slName}
                    </div>
                )}
            </div>

            {/* Discord status label */}
            <div style={{
                fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: getDiscordColor(discordStatus), flexShrink: 0,
            }}>
                {getDiscordLabel(discordStatus)}
            </div>

            {/* Edit button */}
            {onEdit && (
                <button onClick={onEdit} title="Edit staff" style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s ease',
                }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.1)'; e.currentTarget.style.color = 'var(--neon-cyan)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    <Pencil size={12} />
                </button>
            )}
        </div>
    );
}

/* ── Group Header ── */
function GroupHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 0', marginBottom: 4,
        }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </span>
            <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                padding: '1px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 4,
            }}>
                {count}
            </span>
        </div>
    );
}

/* ── Main Page ── */
export default function StaffPage() {
    const { can, isManagement } = useRole();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<AppUser | null>(null);
    const [staff, setStaff] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

    const { presenceMap, discordOnlineCount } = usePresence(staff);

    /* Realtime listener — updates instantly when lastSeen/onlineStatus change */
    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('role'));
        const unsub = onSnapshot(q, (snap) => {
            const users: AppUser[] = snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
            setStaff(users);
            setLoading(false);
        }, (err) => {
            console.warn('[StaffPage] Firestore listener error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /* ── Filtering + search ── */
    const filteredStaff = useMemo(() => {
        let result = staff;

        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(m =>
                m.displayName.toLowerCase().includes(q) ||
                m.slName?.toLowerCase().includes(q) ||
                m.role.toLowerCase().includes(q)
            );
        }

        // Category filter
        if (activeFilter === 'online') {
            result = result.filter(m => {
                const p = presenceMap.get(m.uid);
                return p && (p.discordStatus !== 'offline' || p.isOnWebsite);
            });
        } else if (activeFilter !== 'all') {
            const roles = CATEGORY_ROLES[activeFilter];
            result = result.filter(m => roles.includes(m.role));
        }

        // Sort: web-online first, then discord-online, then by role hierarchy
        result = [...result].sort((a, b) => {
            const pa = presenceMap.get(a.uid);
            const pb = presenceMap.get(b.uid);
            // Web presence > Discord online > offline
            const scoreA = (pa?.isOnWebsite ? 3 : 0) + (pa?.discordStatus !== 'offline' ? 1 : 0);
            const scoreB = (pb?.isOnWebsite ? 3 : 0) + (pb?.discordStatus !== 'offline' ? 1 : 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return ROLE_HIERARCHY.indexOf(b.role) - ROLE_HIERARCHY.indexOf(a.role);
        });

        return result;
    }, [staff, searchQuery, activeFilter, presenceMap]);

    /* ── Group staff by role category ── */
    const groups = useMemo(() => {
        if (activeFilter !== 'all' && activeFilter !== 'online') return null;

        const management = filteredStaff.filter(m => ['super_admin', 'owner', 'general_manager', 'manager'].includes(m.role));
        const djs = filteredStaff.filter(m => m.role === 'dj');
        const hosts = filteredStaff.filter(m => m.role === 'host');
        const others = filteredStaff.filter(m => ['vip_member', 'member'].includes(m.role));

        return [
            { key: 'management', label: 'Management', icon: <Crown size={13} />, members: management },
            { key: 'djs', label: 'DJs', icon: <Headphones size={13} />, members: djs },
            { key: 'hosts', label: 'Hosts', icon: <Mic size={13} />, members: hosts },
            ...(others.length > 0 ? [{ key: 'others', label: 'Members', icon: <Star size={13} />, members: others }] : []),
        ].filter(g => g.members.length > 0);
    }, [filteredStaff, activeFilter]);

    const onlineCount = useMemo(() =>
        staff.filter(m => {
            const p = presenceMap.get(m.uid);
            return p && (p.discordStatus !== 'offline' || p.isOnWebsite);
        }).length
        , [staff, presenceMap]);

    if (!can('manager')) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🔒</p>
                <p>You don&apos;t have permission to view the staff directory.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Staff Directory
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {onlineCount} online · {staff.length} total {discordOnlineCount > 0 && `· ${discordOnlineCount} in Discord`}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(192, 132, 252, 0.12))',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        color: '#00f0ff', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                >
                    <Plus size={15} /> Add Staff
                </button>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
                    <Search size={14} style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                    }} />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '9px 12px 9px 34px',
                            borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-primary)', fontSize: 13,
                            outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                    />
                </div>

                {/* Filter tabs */}
                <div style={{
                    display: 'flex', gap: 2,
                    background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 10,
                }}>
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8, border: 'none',
                                background: activeFilter === tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: activeFilter === tab.key ? '#fff' : 'var(--text-muted)',
                                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Staff List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Loading staff...
                </div>
            ) : filteredStaff.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    {searchQuery ? 'No staff matching your search.' : 'No staff found.'}
                </div>
            ) : groups ? (
                /* Grouped view */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {groups.map(group => (
                        <div key={group.key}>
                            <GroupHeader icon={group.icon} label={group.label} count={group.members.length} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 8 }}>
                                {group.members.map(member => (
                                    <StaffCard
                                        key={member.uid}
                                        member={member}
                                        presence={presenceMap.get(member.uid) || { discordStatus: 'offline' as const, isOnWebsite: false }}
                                        onEdit={isManagement ? () => setEditingStaff(member) : undefined}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Flat view (when specific filter is active) */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 8 }}>
                    {filteredStaff.map(member => (
                        <StaffCard
                            key={member.uid}
                            member={member}
                            presence={presenceMap.get(member.uid) || { discordStatus: 'offline' as const, isOnWebsite: false }}
                            onEdit={isManagement ? () => setEditingStaff(member) : undefined}
                        />
                    ))}
                </div>
            )}

            <AddStaffModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={() => {/* onSnapshot auto-updates */ }}
            />

            <EditStaffModal
                open={!!editingStaff}
                onClose={() => setEditingStaff(null)}
                onUpdated={() => {/* onSnapshot auto-updates */ }}
                staff={editingStaff}
            />

            <style>{`
                @keyframes presencePulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
