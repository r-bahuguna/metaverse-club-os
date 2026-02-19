'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Plus, ArrowLeft, ArrowRight, X, Check, XCircle, MessageSquare, ChevronDown, Headphones, Mic } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Modal from '@/components/ui/Modal';
import { EventSchedule, AppUser } from '@/lib/types';
import { ROLE_CONFIG, ROLE_HIERARCHY } from '@/lib/constants';

/* ── Helpers ── */
function getStartOfWeek(date: Date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, days: number) {
    const r = new Date(date);
    r.setDate(r.getDate() + days);
    return r;
}

function formatDateKey(date: Date) {
    return date.toISOString().split('T')[0];
}

/* Evening hours for a nightclub: 18:00 → 04:00 (next day) */
const HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];

function responseColor(r: string) {
    switch (r) {
        case 'accepted': return '#4ade80';
        case 'declined': return '#ef4444';
        case 'counter': return '#fbbf24';
        default: return 'rgba(255,255,255,0.3)';
    }
}

function responseBg(r: string) {
    switch (r) {
        case 'accepted': return 'rgba(74, 222, 128, 0.1)';
        case 'declined': return 'rgba(239, 68, 68, 0.1)';
        case 'counter': return 'rgba(251, 191, 36, 0.1)';
        default: return 'rgba(255,255,255,0.04)';
    }
}

/* ── Event Block (in calendar) ── */
function EventBlock({ event, onClick }: { event: EventSchedule; onClick: () => void }) {
    const startH = parseInt(event.startTime.split(':')[0]);
    const endH = parseInt(event.endTime.split(':')[0]);
    const span = endH > startH ? endH - startH : (24 - startH + endH);

    return (
        <button
            onClick={onClick}
            style={{
                position: 'absolute', top: 2, left: 2, right: 2,
                height: `calc(${span * 100}% - 4px)`,
                minHeight: 32,
                background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.2), rgba(0, 240, 255, 0.15))',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                borderRadius: 8, padding: '6px 8px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden', zIndex: 10,
                display: 'flex', flexDirection: 'column', gap: 2,
            }}
            onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(192, 132, 252, 0.3), rgba(0, 240, 255, 0.25))';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(192, 132, 252, 0.2)';
            }}
            onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(192, 132, 252, 0.2), rgba(0, 240, 255, 0.15))';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.eventName}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                {event.startTime}–{event.endTime}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
                {event.djName && (
                    <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(192,132,252,0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Headphones size={8} />{event.djName.split(' ')[0]}
                    </span>
                )}
                {event.hostName && (
                    <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,107,157,0.2)', color: '#ff6b9d', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Mic size={8} />{event.hostName.split(' ')[0]}
                    </span>
                )}
            </div>
        </button>
    );
}

/* ── Event Detail Modal ── */
function EventDetailModal({
    event, open, onClose, canManage, currentUserId, onRespond, onDelete
}: {
    event: EventSchedule | null;
    open: boolean;
    onClose: () => void;
    canManage: boolean;
    currentUserId: string;
    onRespond: (eventId: string, role: 'dj' | 'host', response: string, message?: string) => Promise<void>;
    onDelete: (eventId: string) => Promise<void>;
}) {
    const [responseMsg, setResponseMsg] = useState('');
    const [responding, setResponding] = useState(false);

    if (!event) return null;

    const isDj = event.djId === currentUserId;
    const isHost = event.hostId === currentUserId;
    const myRole = isDj ? 'dj' : isHost ? 'host' : null;
    const myResponse = isDj ? event.djResponse : isHost ? event.hostResponse : null;

    async function handleRespond(resp: string) {
        if (!myRole || !event) return;
        setResponding(true);
        await onRespond(event.id, myRole, resp, responseMsg || undefined);
        setResponseMsg('');
        setResponding(false);
    }

    return (
        <Modal open={open} onClose={onClose} title={event.eventName} maxWidth={520}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Time & Date */}
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Calendar size={14} style={{ color: 'var(--neon-cyan)' }} />
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Clock size={14} style={{ color: 'var(--neon-purple)' }} />
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{event.startTime} – {event.endTime}</span>
                    </div>
                </div>

                {event.genre && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        🎵 {event.genre}
                    </div>
                )}

                {/* Crew assignments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* DJ */}
                    <div style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: responseBg(event.djResponse),
                        border: `1px solid ${responseColor(event.djResponse)}22`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Headphones size={16} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DJ</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#c084fc' }}>{event.djName || 'Unassigned'}</div>
                            </div>
                        </div>
                        <span style={{
                            fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                            color: responseColor(event.djResponse), textTransform: 'uppercase',
                            background: `${responseColor(event.djResponse)}15`,
                        }}>
                            {event.djResponse}
                        </span>
                    </div>

                    {/* Host */}
                    <div style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: responseBg(event.hostResponse),
                        border: `1px solid ${responseColor(event.hostResponse)}22`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: 'linear-gradient(135deg, #ff6b9d, #ec4899)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Mic size={16} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Host</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#ff6b9d' }}>{event.hostName || 'Unassigned'}</div>
                            </div>
                        </div>
                        <span style={{
                            fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                            color: responseColor(event.hostResponse), textTransform: 'uppercase',
                            background: `${responseColor(event.hostResponse)}15`,
                        }}>
                            {event.hostResponse}
                        </span>
                    </div>

                    {/* Messages */}
                    {event.djMessage && (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(192,132,252,0.06)', fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600 }}>DJ:</span> {event.djMessage}
                        </div>
                    )}
                    {event.hostMessage && (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,107,157,0.06)', fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600 }}>Host:</span> {event.hostMessage}
                        </div>
                    )}
                </div>

                {/* Response area for assigned staff */}
                {myRole && myResponse === 'pending' && (
                    <div style={{
                        padding: 16, borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Your Response
                        </div>
                        <textarea
                            value={responseMsg}
                            onChange={e => setResponseMsg(e.target.value)}
                            placeholder="Optional message (e.g., RL emergency, counter-proposal...)"
                            style={{
                                width: '100%', padding: 10, borderRadius: 8,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                minHeight: 60, resize: 'vertical',
                            }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => handleRespond('accepted')}
                                disabled={responding}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 10,
                                    background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.3)',
                                    color: '#4ade80', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                            >
                                <Check size={16} /> Accept
                            </button>
                            <button
                                onClick={() => handleRespond('declined')}
                                disabled={responding}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 10,
                                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                            >
                                <XCircle size={16} /> Decline
                            </button>
                            <button
                                onClick={() => handleRespond('counter')}
                                disabled={responding}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 10,
                                    background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)',
                                    color: '#fbbf24', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                            >
                                <MessageSquare size={16} /> Counter
                            </button>
                        </div>
                    </div>
                )}

                {/* Manager actions */}
                {canManage && (
                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                        <button
                            onClick={async () => { await onDelete(event.id); onClose(); }}
                            style={{
                                padding: '8px 16px', borderRadius: 8,
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            Cancel Event
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

/* ── Schedule Event Modal (Create) ── */
function CreateEventScheduleModal({
    open, onClose, onSave, staffList
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<EventSchedule>) => Promise<void>;
    staffList: AppUser[];
}) {
    const [eventName, setEventName] = useState('');
    const [genre, setGenre] = useState('');
    const [date, setDate] = useState(formatDateKey(new Date()));
    const [startTime, setStartTime] = useState('22:00');
    const [endTime, setEndTime] = useState('02:00');
    const [djId, setDjId] = useState('');
    const [hostId, setHostId] = useState('');
    const [saving, setSaving] = useState(false);

    // Staff eligible for DJ: role=dj OR has dj in secondaryRoles (include all roles)
    const djCandidates = useMemo(() => staffList.filter(u =>
        u.role === 'dj' || u.secondaryRoles?.includes('dj') ||
        u.role === 'owner' || u.role === 'super_admin'
    ), [staffList]);

    const hostCandidates = useMemo(() => staffList.filter(u =>
        u.role === 'host' || u.secondaryRoles?.includes('host') ||
        u.role === 'owner' || u.role === 'super_admin'
    ), [staffList]);

    const selectedDj = staffList.find(s => s.uid === djId);
    const selectedHost = staffList.find(s => s.uid === hostId);

    async function handleSave() {
        if (!eventName.trim() || !djId || !hostId) return;
        setSaving(true);
        try {
            await onSave({
                eventName: eventName.trim(),
                genre: genre.trim(),
                date,
                startTime,
                endTime,
                djId,
                djName: selectedDj?.displayName || '',
                djResponse: 'pending',
                hostId,
                hostName: selectedHost?.displayName || '',
                hostResponse: 'pending',
                status: 'scheduled',
            });
            setEventName(''); setGenre(''); setDjId(''); setHostId('');
            onClose();
        } finally {
            setSaving(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontSize: 13, outline: 'none',
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        appearance: 'none' as const,
    };

    return (
        <Modal open={open} onClose={onClose} title="Schedule Event" maxWidth={500}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Event Name</label>
                    <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Neon Nights" style={inputStyle} />
                </div>

                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Genre</label>
                    <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g. House, Techno, EDM" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Start</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>End</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
                    </div>
                </div>

                {/* DJ Picker */}
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        <Headphones size={11} style={{ display: 'inline', marginRight: 4 }} /> Assign DJ
                    </label>
                    <select value={djId} onChange={e => setDjId(e.target.value)} style={selectStyle}>
                        <option value="">Select DJ...</option>
                        {djCandidates.map(s => (
                            <option key={s.uid} value={s.uid}>{s.displayName} ({ROLE_CONFIG[s.role]?.label})</option>
                        ))}
                    </select>
                </div>

                {/* Host Picker */}
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        <Mic size={11} style={{ display: 'inline', marginRight: 4 }} /> Assign Host
                    </label>
                    <select value={hostId} onChange={e => setHostId(e.target.value)} style={selectStyle}>
                        <option value="">Select Host...</option>
                        {hostCandidates.map(s => (
                            <option key={s.uid} value={s.uid}>{s.displayName} ({ROLE_CONFIG[s.role]?.label})</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: 12, borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: 'none',
                        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                    }}>Cancel</button>
                    <button onClick={handleSave} disabled={!eventName.trim() || !djId || !hostId || saving} style={{
                        flex: 1, padding: 12, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(192,132,252,0.2))',
                        border: '1px solid rgba(0,240,255,0.3)',
                        color: '#00f0ff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                        opacity: (!eventName.trim() || !djId || !hostId || saving) ? 0.5 : 1,
                    }}>
                        {saving ? 'Scheduling...' : 'Schedule Event'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ── Main Schedule Page ── */
export default function SchedulePage() {
    const { appUser } = useAuth();
    const { can } = useRole();
    const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
    const [schedules, setSchedules] = useState<EventSchedule[]>([]);
    const [staffList, setStaffList] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventSchedule | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (can('manager')) {
                const usersSnap = await getDocs(query(collection(db, 'users')));
                setStaffList(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));
            }
            const schedSnap = await getDocs(collection(db, 'eventSchedules'));
            setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventSchedule)));
        } catch (e) {
            console.error('Failed to fetch schedule:', e);
        } finally {
            setLoading(false);
        }
    }, [can]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (data: Partial<EventSchedule>) => {
        if (!appUser) return;
        const docRef = await addDoc(collection(db, 'eventSchedules'), {
            ...data, createdBy: appUser.uid, createdAt: new Date().toISOString(),
        });
        setSchedules(prev => [...prev, { id: docRef.id, ...data } as EventSchedule]);
    };

    const handleRespond = async (eventId: string, role: 'dj' | 'host', response: string, message?: string) => {
        const field = role === 'dj' ? 'djResponse' : 'hostResponse';
        const msgField = role === 'dj' ? 'djMessage' : 'hostMessage';
        const updates: any = { [field]: response };
        if (message) updates[msgField] = message;

        await updateDoc(doc(db, 'eventSchedules', eventId), updates);
        setSchedules(prev => prev.map(s => s.id === eventId ? { ...s, ...updates } : s));
        setSelectedEvent(prev => prev && prev.id === eventId ? { ...prev, ...updates } : prev);
    };

    const handleDelete = async (eventId: string) => {
        await deleteDoc(doc(db, 'eventSchedules', eventId));
        setSchedules(prev => prev.filter(s => s.id !== eventId));
    };

    /* ── Calendar rendering ── */
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)), [currentWeek]);

    // Get my upcoming events (for staff view)
    const myEvents = useMemo(() => {
        if (!appUser) return [];
        return schedules.filter(s => s.djId === appUser.uid || s.hostId === appUser.uid)
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [schedules, appUser]);

    // Pending responses for current user
    const pendingCount = useMemo(() => {
        if (!appUser) return 0;
        return schedules.filter(s => {
            if (s.djId === appUser.uid && s.djResponse === 'pending') return true;
            if (s.hostId === appUser.uid && s.hostResponse === 'pending') return true;
            return false;
        }).length;
    }, [schedules, appUser]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Schedule</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {schedules.length} events scheduled
                        {pendingCount > 0 && <span style={{ color: '#fbbf24', marginLeft: 8 }}>· {pendingCount} awaiting your response</span>}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Week Navigator */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <button onClick={() => setCurrentWeek(prev => addDays(prev, -7))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}>
                            <ArrowLeft size={14} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                            <Calendar size={13} color="var(--neon-cyan)" />
                            {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {addDays(currentWeek, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <button onClick={() => setCurrentWeek(prev => addDays(prev, 7))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {can('manager') && (
                        <button onClick={() => setIsCreateOpen(true)} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(192,132,252,0.12))',
                            border: '1px solid rgba(0,240,255,0.25)',
                            color: '#00f0ff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        }}>
                            <Plus size={15} /> Schedule Event
                        </button>
                    )}
                </div>
            </div>

            {/* Pending responses banner */}
            {pendingCount > 0 && (
                <div style={{
                    padding: '10px 16px', borderRadius: 12,
                    background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: '#fbbf24',
                }}>
                    ⚡ You have {pendingCount} event{pendingCount > 1 ? 's' : ''} awaiting your response
                </div>
            )}

            {/* Calendar Grid */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule...</div>
            ) : (
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px repeat(7, 1fr)',
                        minHeight: 0,
                    }}>
                        {/* Header Row */}
                        <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
                        {weekDays.map(d => {
                            const isToday = formatDateKey(d) === formatDateKey(new Date());
                            return (
                                <div key={d.toISOString()} style={{
                                    padding: '10px 4px', textAlign: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    borderLeft: '1px solid rgba(255,255,255,0.04)',
                                    background: isToday ? 'rgba(0, 240, 255, 0.04)' : 'transparent',
                                }}>
                                    <div style={{ fontSize: 10, color: isToday ? '#00f0ff' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div style={{
                                        fontSize: 18, fontWeight: 700,
                                        color: isToday ? '#00f0ff' : 'var(--text-primary)',
                                        marginTop: 2,
                                    }}>{d.getDate()}</div>
                                </div>
                            );
                        })}

                        {/* Time rows — evening only */}
                        {HOURS.map(h => (
                            <React.Fragment key={h}>
                                <div style={{
                                    padding: '4px 6px', fontSize: 10, color: 'var(--text-muted)',
                                    textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.04)',
                                    fontFamily: 'var(--font-mono)',
                                }}>
                                    {h.toString().padStart(2, '0')}:00
                                </div>
                                {weekDays.map(day => {
                                    const dateStr = formatDateKey(day);
                                    const cellEvents = schedules.filter(s => {
                                        if (s.date !== dateStr) return false;
                                        const startH = parseInt(s.startTime.split(':')[0]);
                                        return startH === h;
                                    });

                                    return (
                                        <div key={day.toISOString() + h} style={{
                                            borderTop: '1px solid rgba(255,255,255,0.04)',
                                            borderLeft: '1px solid rgba(255,255,255,0.04)',
                                            minHeight: 44, position: 'relative',
                                        }}>
                                            {cellEvents.map(ev => (
                                                <EventBlock key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                                            ))}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* My Schedule (for non-managers) */}
            {!can('manager') && myEvents.length > 0 && (
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: 20,
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>My Upcoming Events</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {myEvents.map(ev => {
                            const myRole = ev.djId === appUser?.uid ? 'DJ' : 'Host';
                            const myResp = myRole === 'DJ' ? ev.djResponse : ev.hostResponse;
                            return (
                                <button key={ev.id} onClick={() => setSelectedEvent(ev)} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer', textAlign: 'left', width: '100%',
                                    transition: 'all 0.2s',
                                }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(192,132,252,0.3)'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{ev.eventName}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {ev.date} · {ev.startTime}–{ev.endTime} · {myRole}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, padding: '3px 8px', borderRadius: 6,
                                        color: responseColor(myResp), background: `${responseColor(myResp)}15`,
                                        fontWeight: 600, textTransform: 'uppercase',
                                    }}>
                                        {myResp}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateEventScheduleModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleCreate}
                staffList={staffList}
            />

            <EventDetailModal
                event={selectedEvent}
                open={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                canManage={can('manager')}
                currentUserId={appUser?.uid || ''}
                onRespond={handleRespond}
                onDelete={handleDelete}
            />
        </div>
    );
}
