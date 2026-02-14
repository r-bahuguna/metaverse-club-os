'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RoleProvider } from '@/hooks/useRole';
import { SettingsProvider } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import PageTransition from '@/components/layout/PageTransition';
import OnboardingModal from '@/components/ui/OnboardingModal';
import styles from './layout.module.css';

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    /* Listen for sidebar collapse state changes */
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved === 'true') setSidebarCollapsed(true);

        function handleStorage(e: StorageEvent) {
            if (e.key === 'sidebar-collapsed') {
                setSidebarCollapsed(e.newValue === 'true');
            }
        }
        window.addEventListener('storage', handleStorage);

        /* Also poll for same-tab changes */
        const interval = setInterval(() => {
            const current = localStorage.getItem('sidebar-collapsed') === 'true';
            setSidebarCollapsed(prev => {
                if (prev !== current) return current;
                return prev;
            });
        }, 200);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className={`${styles.dashboardLayout} ${sidebarCollapsed ? 'sidebarIsCollapsed' : ''}`}>
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
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !firebaseUser) {
            router.push('/login');
        }
    }, [firebaseUser, loading, router]);

    if (loading || !firebaseUser) {
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

    return (
        <SettingsProvider>
            <RoleProvider>
                <OnboardingModal />
                <DashboardShell>{children}</DashboardShell>
            </RoleProvider>
        </SettingsProvider>
    );
}
