'use client';

import React from 'react';
import GlassCard from './GlassCard';

type NeonColor = 'cyan' | 'purple' | 'pink' | 'green' | 'none';

interface MetricCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    neon?: NeonColor;
    trend?: { value: number; label: string };
}

export default function MetricCard({ label, value, subtitle, icon, neon = 'cyan', trend }: MetricCardProps) {
    return (
        <GlassCard neon={neon} interactive>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p
                        style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            marginBottom: '8px',
                        }}
                    >
                        {label}
                    </p>
                    <p
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-3xl)',
                            fontWeight: 700,
                            lineHeight: 1,
                            color: 'var(--text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {value}
                    </p>
                    {subtitle && (
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <p
                            style={{
                                fontSize: 'var(--text-xs)',
                                color: trend.value >= 0 ? 'var(--neon-green)' : 'var(--neon-danger)',
                                marginTop: '8px',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                {icon && (
                    <div
                        style={{
                            opacity: 0.4,
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
