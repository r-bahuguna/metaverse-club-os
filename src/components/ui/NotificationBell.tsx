'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock3, Calendar, X } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

function NotificationItem({ notification, onRead }: { notification: AppNotification; onRead: () => void }) {
    const iconMap: Record<string, React.ReactNode> = {
        shift_assigned: <Calendar size={14} color="#00f0ff" />,
        shift_response: <Check size={14} color="#4ade80" />,
        schedule_update: <Clock3 size={14} color="#fbbf24" />,
        roster_posted: <Bell size={14} color="#c084fc" />,
        availability_reminder: <Clock3 size={14} color="#ff6b9d" />,
    };

    return (
        <button
            onClick={onRead}
            style={{
                display: 'flex', gap: 10, padding: '10px 12px', width: '100%',
                background: notification.read ? 'transparent' : 'rgba(0,240,255,0.03)',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseOut={e => e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(0,240,255,0.03)'}
        >
            <div style={{ marginTop: 2, flexShrink: 0 }}>
                {iconMap[notification.type] || <Bell size={14} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: notification.read ? 400 : 600, color: 'var(--text-primary)' }}>
                    {notification.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {notification.message}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {new Date(notification.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            {!notification.read && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f0ff', flexShrink: 0, marginTop: 4 }} />
            )}
        </button>
    );
}

export default function NotificationBell() {
    const { notifications, unreadCount, markRead, markAllRead, requestPermission } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Request permission on mount
    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handler);
            return () => document.removeEventListener('mousedown', handler);
        }
    }, [isOpen]);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(p => !p)}
                style={{
                    position: 'relative',
                    width: 36, height: 36, borderRadius: 10,
                    background: isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    color: 'var(--text-secondary)',
                }}
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#ef4444', color: '#fff',
                        fontSize: 9, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    width: 320, maxHeight: 400,
                    background: 'rgba(15,15,30,0.98)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} style={{
                                background: 'none', border: 'none', color: 'var(--neon-cyan)',
                                fontSize: 11, cursor: 'pointer', fontWeight: 500,
                            }}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', maxHeight: 340 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(n => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onRead={() => markRead(n.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
