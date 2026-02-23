'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ScrollText, Filter, Calendar, User, Headphones, Mic, CalendarDays, Bell, Shield, Settings, LogIn, LogOut, Pencil, Plus, Trash2, Send, Sparkles, Clock } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/ui/GlassCard';
import { AuditAction } from '@/lib/audit';

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: React.ReactNode; color: string }> = {
    event_created: { label: 'Event Created', icon: <Plus size={14} />, color: '#4ade80' },
    event_updated: { label: 'Event Updated', icon: <Pencil size={14} />, color: '#fbbf24' },
    event_deleted: { label: 'Event Deleted', icon: <Trash2 size={14} />, color: '#ef4444' },
    staff_created: { label: 'Staff Created', icon: <User size={14} />, color: '#4ade80' },
    staff_updated: { label: 'Staff Updated', icon: <Pencil size={14} />, color: '#00f0ff' },
    staff_deactivated: { label: 'Staff Deactivated', icon: <Shield size={14} />, color: '#ef4444' },
    roster_posted: { label: 'Roster Posted', icon: <Send size={14} />, color: '#c084fc' },
    schedule_assigned: { label: 'Schedule Assigned', icon: <CalendarDays size={14} />, color: '#c084fc' },
    availability_set: { label: 'Availability Set', icon: <Clock size={14} />, color: '#fbbf24' },
    tip_received: { label: 'Tip Received', icon: <Sparkles size={14} />, color: '#4ade80' },
    login: { label: 'Login', icon: <LogIn size={14} />, color: '#4ade80' },
    logout: { label: 'Logout', icon: <LogOut size={14} />, color: 'rgba(255,255,255,0.4)' },
    settings_changed: { label: 'Settings Changed', icon: <Settings size={14} />, color: '#fbbf24' },
    notification_sent: { label: 'Notification Sent', icon: <Bell size={14} />, color: '#00f0ff' },
};

interface LogEntry {
    id: string;
    action: AuditAction;
    actorId: string;
    actorName: string;
    targetId?: string;
    targetName?: string;
    details?: string;
    metadata?: Record<string, unknown>;
    timestamp: Timestamp;
}

function LogItem({ entry }: { entry: LogEntry }) {
    const config = ACTION_CONFIG[entry.action] || { label: entry.action, icon: <ScrollText size={14} />, color: 'var(--text-muted)' };
    const time = entry.timestamp?.toDate?.() ? entry.timestamp.toDate() : new Date();

    return (
        <div style={{
            display: 'flex', gap: 12, padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            transition: 'background 0.15s ease',
        }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
        >
            {/* Icon */}
            <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${config.color}15`,
                border: `1px solid ${config.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: config.color, flexShrink: 0,
            }}>
                {config.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {entry.actorName}
                    </span>
                    <span style={{ fontSize: 12, color: config.color, fontWeight: 500 }}>
                        {config.label.toLowerCase()}
                    </span>
                    {entry.targetName && (
                        <>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {entry.targetName}
                            </span>
                        </>
                    )}
                </div>
                {entry.details && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                        {entry.details}
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, textAlign: 'right' }}>
                <div>{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        </div>
    );
}

export default function LogsPage() {
    const { isSuperAdmin, currentRole } = useRole();
    const isOwner = currentRole === 'owner' || currentRole === 'super_admin';
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
    const [maxEntries, setMaxEntries] = useState(100);

    // Access check
    if (!isOwner) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Shield size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>Activity Logs are restricted to Super Admin and Owner roles.</div>
            </div>
        );
    }

    useEffect(() => {
        const q = query(
            collection(db, 'audit_logs'),
            orderBy('timestamp', 'desc'),
            limit(maxEntries)
        );

        const unsub = onSnapshot(q, (snap) => {
            const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry));
            setLogs(entries);
            setLoading(false);
        }, (err) => {
            console.warn('[LogsPage] Firestore error:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [maxEntries]);

    const filteredLogs = useMemo(() => {
        if (filterAction === 'all') return logs;
        return logs.filter(l => l.action === filterAction);
    }, [logs, filterAction]);

    const actionTypes: (AuditAction | 'all')[] = ['all', ...Object.keys(ACTION_CONFIG) as AuditAction[]];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ScrollText size={20} style={{ color: 'var(--neon-cyan)' }} />
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Activity Logs</h2>
                    <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(0,240,255,0.08)', color: 'var(--neon-cyan)',
                    }}>{filteredLogs.length}</span>
                </div>
            </div>

            {/* Filter bar */}
            <div style={{
                display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0',
                scrollbarWidth: 'none',
            }}>
                {actionTypes.map(action => {
                    const isActive = filterAction === action;
                    const config = action === 'all' ? null : ACTION_CONFIG[action];
                    return (
                        <button key={action} onClick={() => setFilterAction(action)} style={{
                            padding: '6px 12px', borderRadius: 8,
                            background: isActive ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isActive ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            color: isActive ? 'var(--neon-cyan)' : 'var(--text-muted)',
                            fontSize: 11, fontWeight: 500, cursor: 'pointer',
                            whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            {config?.icon}
                            {action === 'all' ? 'All' : config?.label}
                        </button>
                    );
                })}
            </div>

            {/* Log entries */}
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        Loading activity logs...
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        {filterAction === 'all' ? 'No activity logged yet.' : `No "${ACTION_CONFIG[filterAction as AuditAction]?.label}" entries found.`}
                    </div>
                ) : (
                    <div>
                        {filteredLogs.map(entry => (
                            <LogItem key={entry.id} entry={entry} />
                        ))}
                        {logs.length >= maxEntries && (
                            <button onClick={() => setMaxEntries(prev => prev + 100)} style={{
                                width: '100%', padding: 12,
                                background: 'rgba(255,255,255,0.02)', border: 'none',
                                color: 'var(--neon-cyan)', fontSize: 12, fontWeight: 500,
                                cursor: 'pointer',
                            }}>
                                Load more...
                            </button>
                        )}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
