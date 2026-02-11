'use client';

import React from 'react';
import { Settings, Bell, Shield, Palette, Globe, Zap, ChevronRight } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useSettings } from '@/hooks/useSettings';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface ToggleProps {
    enabled: boolean;
    onChange: (val: boolean) => void;
    color?: string;
}

function Toggle({ enabled, onChange, color = 'var(--neon-cyan)' }: ToggleProps) {
    const { playSound } = useSettings();

    function handleChange(val: boolean) {
        playSound('toggle');
        onChange(val);
    }

    return (
        <button
            onClick={() => handleChange(!enabled)}
            style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: enabled ? color : 'rgba(255,255,255,0.1)',
                position: 'relative', transition: 'background 0.2s ease',
                boxShadow: enabled ? `0 0 12px ${color}40` : 'none',
            }}
        >
            <span style={{
                position: 'absolute', top: 2, left: enabled ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
        </button>
    );
}

interface SettingRowProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    children: React.ReactNode;
}

function SettingRow({ icon, label, description, children }: SettingRowProps) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
            padding: 'var(--space-4) 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
            <div style={{ color: 'var(--neon-cyan)', flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
            </div>
            {children}
        </div>
    );
}

export default function SettingsPage() {
    const { can } = useRole();
    const { darkMode, animations, sounds, update } = useSettings();

    if (!can('manager')) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🔒</p>
                <p>Settings requires Manager access or above.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 720 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Settings size={24} style={{ color: 'var(--neon-cyan)' }} />
                Settings
            </h1>

            {/* Notifications & Sound */}
            <AnimatedCard index={0}>
                <GlassCard>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Bell size={18} style={{ color: 'var(--neon-purple)' }} />
                        Notifications &amp; Sound
                    </h2>
                    <SettingRow icon={<Globe size={16} />} label="Sound Effects" description="Play synth tones for toggles, tips, and notifications">
                        <Toggle enabled={sounds} onChange={v => update('sounds', v)} color="var(--neon-pink)" />
                    </SettingRow>
                </GlassCard>
            </AnimatedCard>

            {/* Appearance */}
            <AnimatedCard index={1}>
                <GlassCard>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Palette size={18} style={{ color: 'var(--neon-pink)' }} />
                        Appearance
                    </h2>
                    <SettingRow icon={<Palette size={16} />} label="Dark Mode" description="Switch between dark cyber theme and light mode">
                        <Toggle enabled={darkMode} onChange={v => update('darkMode', v)} color="var(--neon-purple)" />
                    </SettingRow>
                    <SettingRow icon={<Zap size={16} />} label="Animations" description="Enable card animations, hover effects, and page transitions">
                        <Toggle enabled={animations} onChange={v => update('animations', v)} />
                    </SettingRow>
                </GlassCard>
            </AnimatedCard>

            {/* Security (Owner only) */}
            {can('owner') && (
                <AnimatedCard index={2}>
                    <GlassCard neon="cyan">
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Shield size={18} style={{ color: 'var(--neon-cyan)' }} />
                            Security &amp; Access
                        </h2>
                        {[
                            { label: 'Manage Roles', desc: 'Assign and modify staff permissions' },
                            { label: 'API Keys', desc: 'LSL object authentication keys' },
                            { label: 'Audit Log', desc: 'View all system actions and changes' },
                            { label: 'Firebase Config', desc: 'Database and hosting settings' },
                        ].map((item, i) => (
                            <SettingRow key={i} icon={<Shield size={16} />} label={item.label} description={item.desc}>
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            </SettingRow>
                        ))}
                    </GlassCard>
                </AnimatedCard>
            )}

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                Risky Desires Command Center v1.0 · Settings apply immediately
            </p>
        </div>
    );
}
