'use client';

import React, { useState, useMemo } from 'react';
import { ScrollText, Pencil, Plus, Trash2, Send, CalendarDays, Clock, Sparkles, LogIn, LogOut, Settings, Bell, Shield, User } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import GlassCard from '@/components/ui/GlassCard';

export type AuditAction =
    | 'event_created'
    | 'event_updated'
    | 'event_deleted'
    | 'staff_created'
    | 'staff_updated'
    | 'staff_deactivated'
    | 'roster_posted'
    | 'schedule_assigned'
    | 'availability_set'
    | 'tip_received'
    | 'login'
    | 'logout'
    | 'settings_changed'
    | 'notification_sent';

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
    actorName: string;
    targetName?: string;
    details?: string;
    timestamp: Date;
}

// Generate some mock logs based on current staff names
const MOCK_LOGS: LogEntry[] = [
    { id: '1', timestamp: new Date(Date.now() - 1000 * 60 * 5), action: 'tip_received', actorName: 'System', targetName: 'DJ Apex', details: 'L$ 500 tipped.' },
    { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 15), action: 'staff_updated', actorName: 'Nova', targetName: 'Ivy', details: 'Promoted to Host status' },
    { id: '3', timestamp: new Date(Date.now() - 1000 * 60 * 35), action: 'event_created', actorName: 'Zane', targetName: 'Neon Nights', details: 'Scheduled for 20:00 tonight' },
    { id: '4', timestamp: new Date(Date.now() - 1000 * 60 * 45), action: 'roster_posted', actorName: 'Lyra', details: 'Posted weekly roster to Discord.' },
    { id: '5', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), action: 'login', actorName: 'Orion', details: 'Admin login via dashboard.' },
    { id: '6', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), action: 'availability_set', actorName: 'DJ Caspian', details: 'Marked available for Saturday 22:00.' },
    { id: '7', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), action: 'settings_changed', actorName: 'Vera', details: 'Updated Discord webhook URL.' },
    { id: '8', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), action: 'notification_sent', actorName: 'System', targetName: 'DJ Apex', details: 'Shift reminder sent via Discord.' },
    { id: '9', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), action: 'event_deleted', actorName: 'Nova', targetName: 'Lo-Fi Chill', details: 'Canceled due to scheduling conflict.' },
    { id: '10', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), action: 'staff_created', actorName: 'Zane', targetName: 'DJ Sable', details: 'New account provisioned.' },
];

function LogItem({ entry }: { entry: LogEntry }) {
    const config = ACTION_CONFIG[entry.action] || { label: entry.action, icon: <ScrollText size={14} />, color: 'var(--text-muted)' };
    const time = entry.timestamp;

    return (
        <div style={{
            display: 'flex', gap: 12, padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            transition: 'background 0.15s ease',
        }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
        >
            <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${config.color}15`,
                border: `1px solid ${config.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: config.color, flexShrink: 0,
            }}>
                {config.icon}
            </div>

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

            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, textAlign: 'right' }}>
                <div>{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        </div>
    );
}

export default function DemoLogsView() {
    const { role } = useRole();
    const isOwnerOrAdmin = role === 'super_admin' || role === 'owner';
    const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');

    const filteredLogs = useMemo(() => {
        if (filterAction === 'all') return MOCK_LOGS;
        return MOCK_LOGS.filter(l => l.action === filterAction);
    }, [filterAction]);

    if (!isOwnerOrAdmin) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Shield size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>Activity Logs are restricted to Super Admin and Owner roles.</div>
            </div>
        );
    }

    const actionTypes: (AuditAction | 'all')[] = ['all', ...Object.keys(ACTION_CONFIG) as AuditAction[]];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, paddingBottom: 60, overflowY: 'auto' }}>
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

            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                {filteredLogs.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        {filterAction === 'all' ? 'No activity logged yet.' : `No "${ACTION_CONFIG[filterAction as AuditAction]?.label}" entries found.`}
                    </div>
                ) : (
                    <div>
                        {filteredLogs.map(entry => (
                            <LogItem key={entry.id} entry={entry} />
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
