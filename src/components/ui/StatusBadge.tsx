'use client';

import React from 'react';

type BadgeVariant = 'online' | 'away' | 'offline' | 'active' | 'scheduled' | 'role';

interface StatusBadgeProps {
    variant: BadgeVariant;
    label?: string;
    pulse?: boolean;
    size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    online: { background: 'var(--neon-green)', boxShadow: '0 0 8px rgba(74,222,128,0.5)' },
    away: { background: 'var(--neon-amber)', boxShadow: '0 0 8px rgba(251,191,36,0.4)' },
    offline: { background: 'var(--text-muted)', boxShadow: 'none' },
    active: { background: 'var(--neon-cyan)', boxShadow: '0 0 8px rgba(0,240,255,0.5)' },
    scheduled: { background: 'var(--neon-purple)', boxShadow: '0 0 8px rgba(192,132,252,0.4)' },
    role: { background: 'var(--neon-pink)', boxShadow: '0 0 8px rgba(255,107,157,0.4)' },
};

export default function StatusBadge({ variant, label, pulse = false, size = 'sm' }: StatusBadgeProps) {
    const dotSize = size === 'sm' ? 8 : 10;

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: label ? '6px' : 0,
            }}
        >
            <span
                style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: '50%',
                    display: 'inline-block',
                    flexShrink: 0,
                    ...variantStyles[variant],
                    animation: pulse ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
            />
            {label && (
                <span
                    style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.02em',
                    }}
                >
                    {label}
                </span>
            )}
        </span>
    );
}
