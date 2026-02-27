'use client';

import React, { useState } from 'react';
import { Settings, Shield, Moon, Sun, Volume2, Search, Filter, Lock, KeyRound, Sparkles } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import GlassCard from '@/components/ui/GlassCard';

function ToggleRow({ icon: Icon, label, description, checked, onChange, disabled = false }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <Icon size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: disabled ? 'var(--text-muted)' : 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
                </div>
            </div>
            <button
                disabled={disabled}
                onClick={disabled ? undefined : () => onChange(!checked)}
                style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                    background: checked ? 'var(--neon-purple)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'all 0.2s', opacity: disabled ? 0.5 : 1
                }}
            >
                <div style={{
                    width: 20, height: 20, borderRadius: 10, background: '#fff',
                    position: 'absolute', top: 2, left: checked ? 22 : 2,
                    transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
            </button>
        </div>
    );
}

export default function DemoSettingsView() {
    const { can, isGuest } = useRole();
    const [theme, setTheme] = useState('dark');
    const [sounds, setSounds] = useState(true);
    const [particles, setParticles] = useState(true);
    const [sync, setSync] = useState(true);

    if (isGuest) {
        return (
            <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</p>
                <p>Login required to access personal settings.</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Log in to configure your experience.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, paddingBottom: 60, maxWidth: 800 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Manage your dashboard preferences</p>
            </div>

            <GlassCard>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Appearance</h2>
                <ToggleRow
                    icon={Moon} label="Dark Mode" description="Use the dark theme for the dashboard interface."
                    checked={theme === 'dark'} onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                />
                <ToggleRow
                    icon={Sparkles} label="Background Particles" description="Enable dynamic background particle effects."
                    checked={particles} onChange={setParticles}
                />
            </GlassCard>

            <div style={{ height: 24 }} />

            <GlassCard>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Notifications & Sound</h2>
                <ToggleRow
                    icon={Volume2} label="UI Sound Effects" description="Play sounds when receiving tips or warnings."
                    checked={sounds} onChange={setSounds}
                />
            </GlassCard>

            <div style={{ height: 24 }} />

            {can('owner') && (
                <GlassCard neon="purple">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Shield size={20} color="var(--neon-purple)" />
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>System Admin</h2>
                    </div>
                    <ToggleRow
                        icon={Lock} label="SL API Sync" description="Synchronously pull data from Second Life."
                        checked={sync} onChange={setSync}
                    />
                    <ToggleRow
                        icon={KeyRound} label="Enforce Security Protocols" description="Require 2FA for all manager actions."
                        checked={true} disabled={true}
                    />
                </GlassCard>
            )}
        </div>
    );
}
