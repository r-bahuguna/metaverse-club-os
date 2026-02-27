'use client';

import React from 'react';
import styles from './GlassCard.module.css';

type NeonColor = 'cyan' | 'purple' | 'pink' | 'green' | 'none';

interface GlassCardProps {
    children: React.ReactNode;
    neon?: NeonColor;
    interactive?: boolean;
    className?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
}

const neonMap: Record<NeonColor, string> = {
    cyan: styles.neonCyan,
    purple: styles.neonPurple,
    pink: styles.neonPink,
    green: styles.neonGreen,
    none: '',
};

export default function GlassCard({
    children,
    neon = 'none',
    interactive = false,
    className = '',
    onClick,
    style,
}: GlassCardProps) {
    const classes = [
        styles.glassCard,
        neonMap[neon],
        interactive ? styles.interactive : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} onClick={onClick} style={style} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
            {children}
        </div>
    );
}
