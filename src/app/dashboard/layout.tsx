'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleProvider } from '@/hooks/useRole';
import { SettingsProvider } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import PageTransition from '@/components/layout/PageTransition';
import styles from './layout.module.css';

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <TopBar
                title="Dashboard"
                onMenuClick={() => setSidebarOpen(prev => !prev)}
            />
            <main className={styles.mainContent}>
                <div className={styles.pageContent}>
                    <PageTransition>
                        {children}
                    </PageTransition>
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    /* Auth guard */
    if (loading) {
        return (
            <div style={{
                minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-void)',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid rgba(0, 240, 255, 0.15)',
                    borderTopColor: 'var(--neon-cyan)',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <SettingsProvider>
            <RoleProvider>
                <DashboardShell>{children}</DashboardShell>
            </RoleProvider>
        </SettingsProvider>
    );
}
