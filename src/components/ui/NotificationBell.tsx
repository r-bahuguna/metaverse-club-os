'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
    shift_assigned: '🎧',
    shift_response: '✅',
    shift_cancelled: '⚠️',
    schedule_update: '📅',
    roster_posted: '📋',
    availability_reminder: '⏰',
};

export default function NotificationBell() {
    const { notifications, unreadCount, markRead, markAllRead, requestPermission, permissionGranted } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [permState, setPermState] = useState<'default' | 'granted' | 'denied'>('default');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Track actual browser permission state reactively
    useEffect(() => {
        if (typeof Notification === 'undefined') return;
        setPermState(Notification.permission as 'default' | 'granted' | 'denied');
    }, []);

    // Show banner if permission is 'default' after 3 seconds
    useEffect(() => {
        if (permState === 'granted' || permState === 'denied') {
            setShowBanner(false);
            return;
        }
        const timer = setTimeout(() => {
            if (permState === 'default') {
                setShowBanner(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [permState]);

    // Handle permission click — works on both Chrome and Safari
    const handleEnableNotifications = async () => {
        try {
            if ('Notification' in window) {
                const result = await Notification.requestPermission();
                setPermState(result as 'default' | 'granted' | 'denied');
                if (result === 'granted') {
                    setShowBanner(false);
                    requestPermission();
                    // Show a test notification to confirm
                    try {
                        new Notification('🎉 Notifications enabled!', {
                            body: 'You\'ll receive alerts for schedule updates and assignments.',
                            icon: '/favicon.ico',
                        });
                    } catch { /* Safari may not support options */ }
                } else if (result === 'denied') {
                    setShowBanner(false);
                }
            }
        } catch (err) {
            console.warn('[NotificationBell] Permission request failed:', err);
            setShowBanner(false);
        }
    };

    // Auto-sync on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            requestPermission();
            setPermState('granted');
        }
    }, [requestPermission]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        }
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const isEnabled = permState === 'granted';

    return (
        <>
            {/* Persistent notification permission banner */}
            {showBanner && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(192,132,252,0.12))',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(0,240,255,0.2)',
                    padding: '10px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    animation: 'slideDown 0.3s ease-out',
                }}>
                    <Bell size={16} style={{ color: 'var(--neon-cyan)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        Enable notifications to get shift alerts and schedule updates
                    </span>
                    <button onClick={handleEnableNotifications} style={{
                        padding: '6px 16px', borderRadius: 8,
                        background: 'var(--neon-cyan)', border: 'none',
                        color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    }}>
                        Enable
                    </button>
                    <button onClick={() => setShowBanner(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4,
                    }}>
                        <X size={14} />
                    </button>
                    <style>{`@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
                </div>
            )}

            {/* Bell button */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button onClick={() => setIsOpen(!isOpen)} style={{
                    position: 'relative', background: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    color: unreadCount > 0 ? 'var(--neon-cyan)' : 'var(--text-muted)',
                }}>
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%',
                            background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>

                {isOpen && (
                    <div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 8,
                        width: 340, maxHeight: 420, overflow: 'auto',
                        background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
                        border: '1px solid var(--glass-border)', borderRadius: 12,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 1000,
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderBottom: '1px solid var(--glass-border)',
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {/* Permission status indicator */}
                                {isEnabled ? (
                                    <span style={{
                                        fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3,
                                    }}>
                                        <CheckCircle size={10} /> Alerts on
                                    </span>
                                ) : (
                                    <button onClick={handleEnableNotifications} style={{
                                        fontSize: 10, color: '#000', fontWeight: 600,
                                        background: 'var(--neon-cyan)', border: 'none',
                                        borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                                    }}>
                                        Enable Alerts
                                    </button>
                                )}
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{
                                        fontSize: 10, color: 'var(--text-muted)', background: 'none',
                                        border: 'none', cursor: 'pointer',
                                    }}>Mark all read</button>
                                )}
                            </div>
                        </div>

                        {notifications.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No notifications yet</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); }} style={{
                                    padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    cursor: n.read ? 'default' : 'pointer',
                                    background: n.read ? 'transparent' : 'rgba(0,240,255,0.02)',
                                }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{TYPE_ICONS[n.type] || '📌'}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{timeAgo(n.createdAt)}</div>
                                        </div>
                                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-cyan)', flexShrink: 0, marginTop: 6 }} />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
