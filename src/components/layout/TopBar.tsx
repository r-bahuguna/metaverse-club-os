'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { MOCK_DASHBOARD_STATS } from '@/lib/mock-data';
import { UserRole } from '@/lib/types';
import styles from './TopBar.module.css';

interface TopBarProps {
    title: string;
    onMenuClick: () => void;
}

const DEMO_ROLES: { role: UserRole; label: string }[] = [
    { role: 'owner', label: 'Owner' },
    { role: 'general_manager', label: 'GM' },
    { role: 'manager', label: 'Manager' },
    { role: 'dj', label: 'DJ' },
    { role: 'host', label: 'Host' },
];

export default function TopBar({ title, onMenuClick }: TopBarProps) {
    const { currentRole, switchRole } = useRole();
    const stats = MOCK_DASHBOARD_STATS;

    return (
        <header className={styles.topbar}>
            <div className={styles.left}>
                <button className={styles.menuButton} onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <h1 className={styles.pageTitle}>{title}</h1>
            </div>

            <div className={styles.right}>
                {/* Live Ticker */}
                <div className={styles.ticker}>
                    <span className={styles.tickerDot} />
                    <span>LIVE</span>
                    <span className={styles.tickerSep}>|</span>
                    <span>L${stats.tonightRevenue.toLocaleString()}</span>
                    <span className={styles.tickerSep}>|</span>
                    <span>PEAK: {stats.peakGuests}</span>
                    <span className={styles.tickerSep}>|</span>
                    <span>VIBE: {stats.averageVibe}/10</span>
                </div>

                {/* Role Switcher (Demo) */}
                <div className={styles.roleSwitcher}>
                    {DEMO_ROLES.map(({ role, label }) => (
                        <button
                            key={role}
                            className={`${styles.roleChip} ${currentRole === role ? styles.roleChipActive : ''}`}
                            onClick={() => switchRole(role)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}
