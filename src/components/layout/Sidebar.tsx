'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, CalendarDays, Users, BarChart3,
    PartyPopper, Settings, Zap, ChevronLeft, LogOut, ScrollText,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS, ROLE_CONFIG, BRAND, DISCORD } from '@/lib/constants';
import styles from './Sidebar.module.css';

/* ── Discord widget types ── */
interface DiscordMember {
    id: string;
    username: string;
    status: 'online' | 'idle' | 'dnd';
    avatar_url: string;
}

interface DiscordWidget {
    presence_count: number;
    members: DiscordMember[];
    instant_invite: string;
}

const iconMap: Record<string, React.ReactNode> = {
    LayoutDashboard: <LayoutDashboard size={20} />,
    CalendarDays: <CalendarDays size={20} />,
    Users: <Users size={20} />,
    BarChart3: <BarChart3 size={20} />,
    PartyPopper: <PartyPopper size={20} />,
    Settings: <Settings size={20} />,
    ScrollText: <ScrollText size={20} />,
};

/* Neon Discord logo SVG */
function NeonDiscordIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <defs>
                <linearGradient id="discordNeon" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c8af4" />
                    <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
            </defs>
            <path
                d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"
                fill="url(#discordNeon)"
            />
        </svg>
    );
}

/* ── Status dot color ── */
function statusColor(status: string): string {
    if (status === 'online') return '#4ade80';
    if (status === 'idle') return '#fbbf24';
    return '#f87171';
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { currentUser, currentRole, isGuest, roleLabel } = useRole();
    const { signOut } = useAuth();
    const roleConfig = ROLE_CONFIG[currentRole];

    const [collapsed, setCollapsed] = useState(false);
    const [discord, setDiscord] = useState<DiscordWidget | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved === 'true') setCollapsed(true);
    }, []);

    /* Fetch Discord widget data */
    useEffect(() => {
        async function fetchDiscord() {
            try {
                const res = await fetch(DISCORD.jsonApi);
                if (res.ok) {
                    const data: DiscordWidget = await res.json();
                    setDiscord(data);
                }
            } catch { /* silently fail — Discord is optional */ }
        }
        fetchDiscord();
        const interval = setInterval(fetchDiscord, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    function toggleCollapse() {
        setCollapsed(prev => {
            localStorage.setItem('sidebar-collapsed', String(!prev));
            return !prev;
        });
    }

    const filteredNav = NAV_ITEMS.filter(item =>
        item.requiredRoles.includes(currentRole)
    );

    /* Display name — from Firestore profile, or 'Guest' for anonymous */
    const displayName = isGuest ? 'Guest' : (currentUser?.displayName ?? 'User');
    const displayInitial = displayName.charAt(0).toUpperCase();

    return (
        <>
            {isOpen && (
                <div className={styles.overlay} onClick={onClose} />
            )}

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${collapsed ? styles.sidebarCollapsed : ''}`}>
                {/* Collapse toggle — outside sidebarInner so it can overflow */}
                <button
                    className={styles.collapseBtn}
                    onClick={toggleCollapse}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronLeft size={14} />
                </button>

                <div className={styles.sidebarInner}>
                    {/* Floating particles */}
                    <div className={styles.particles}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className={styles.particle} />
                        ))}
                    </div>

                    {/* Brand */}
                    <div className={styles.brand}>
                        <div className={styles.brandIcon}>
                            <Zap size={18} color="#fff" />
                        </div>
                        <div className={styles.brandText}>
                            <span className={styles.brandName}>{BRAND.name}</span>
                            <span className={styles.brandSub}>{BRAND.tagline}</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className={styles.nav}>
                        {filteredNav.map(item => {
                            const isActive = item.href === '/dashboard'
                                ? pathname === '/dashboard'
                                : pathname?.startsWith(item.href);

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                    onClick={onClose}
                                    style={isActive ? {
                                        color: item.neonColor,
                                        ['--active-color' as string]: item.neonColor,
                                    } : undefined}
                                >
                                    <span
                                        className={styles.navIcon}
                                        style={{ color: isActive ? item.neonColor : undefined }}
                                    >
                                        {iconMap[item.icon] || <LayoutDashboard size={20} />}
                                    </span>
                                    <span className={styles.navLabel}>{item.label}</span>
                                    {isActive && (
                                        <span style={{
                                            position: 'absolute', left: 0, top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 3, height: 20,
                                            borderRadius: '0 3px 3px 0',
                                            background: item.neonColor,
                                            boxShadow: `0 0 8px ${item.neonColor}`,
                                        }} />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Discord — neon banner with live members */}
                    <div className={styles.discordSection}>
                        {collapsed ? (
                            <div className={styles.discordCollapsed}>
                                <a
                                    href={discord?.instant_invite ?? DISCORD.widgetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.discordIconBtn}
                                    title={`Discord — ${discord?.presence_count ?? 0} online`}
                                >
                                    <NeonDiscordIcon size={18} />
                                    {discord && discord.presence_count > 0 && (
                                        <span className={styles.discordCountBadge}>
                                            {discord.presence_count}
                                        </span>
                                    )}
                                </a>
                            </div>
                        ) : (
                            <div className={styles.discordExpanded}>
                                <a
                                    href={discord?.instant_invite ?? DISCORD.widgetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.discordMiniBanner}
                                >
                                    <NeonDiscordIcon size={22} />
                                    <div className={styles.discordBannerText}>
                                        <span className={styles.discordBannerTitle}>Risky Desires</span>
                                        <span className={styles.discordBannerSub}>
                                            {discord ? `${discord.presence_count} online` : 'Join Discord'}
                                        </span>
                                    </div>
                                    <span className={styles.discordJoinBtn}>Join</span>
                                </a>

                                {/* Online members list */}
                                {discord && discord.members.length > 0 && (
                                    <div className={styles.discordMembers}>
                                        {discord.members.slice(0, 8).map(member => (
                                            <div key={member.id} className={styles.discordMember}>
                                                <div className={styles.discordMemberAvatar}>
                                                    <span
                                                        className={styles.discordStatusDot}
                                                        style={{ background: statusColor(member.status) }}
                                                    />
                                                </div>
                                                <span className={styles.discordMemberName}>
                                                    {member.username}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User */}
                    <div className={styles.userSection}>
                        <div className={styles.userCard}>
                            <div className={styles.avatar}>
                                {displayInitial}
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{displayName}</div>
                                <div className={styles.userRole}>{roleLabel}</div>
                            </div>
                            <button
                                className={styles.logoutBtn}
                                onClick={signOut}
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
