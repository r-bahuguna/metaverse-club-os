'use client';

import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/lib/types';
import { Shield } from 'lucide-react';

const DEMO_ROLES: { role: UserRole | 'guest'; label: string }[] = [
    { role: 'super_admin', label: '🛡 SA' },
    { role: 'owner', label: 'Owner' },
    { role: 'manager', label: 'Manager' },
    { role: 'dj', label: 'DJ' },
    { role: 'host', label: 'Host' },
    { role: 'guest', label: 'Guest' },
];

export function RoleToggle() {
    const { role, setRole } = useRole();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 9999,
            padding: '3px 4px',
            overflowX: 'auto',
            maxWidth: 'min(100%, calc(100vw - 180px))',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
        } as React.CSSProperties}>
            <style>{`.mc-role-toggle::-webkit-scrollbar { display: none; }`}</style>
            {DEMO_ROLES.map(({ role: r, label }) => {
                const isActive = (r === 'guest' ? role === null : role === r);
                return (
                    <button
                        key={r}
                        onClick={() => setRole(r === 'guest' ? null : r as UserRole)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? '#00f0ff' : 'rgba(255, 255, 255, 0.6)',
                            background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                            boxShadow: isActive ? '0 0 10px rgba(0, 240, 255, 0.15)' : 'none',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                        onMouseOver={(e) => {
                            if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        }}
                        onMouseOut={(e) => {
                            if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                        }}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
