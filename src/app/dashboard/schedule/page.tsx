'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, Clock, Plus, ArrowLeft, ArrowRight, Check, XCircle, MessageSquare, Headphones, Mic, AlertTriangle, Send, Sparkles, Upload, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import Modal from '@/components/ui/Modal';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { ClubEvent, AppUser } from '@/lib/types';
import { ROLE_CONFIG } from '@/lib/constants';
import { uploadEventImage } from '@/lib/storage';
import AddEventModal from '@/components/ui/AddEventModal';

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

function fmtDateKey(date: Date) {
    return date.toISOString().split('T')[0];
}

/* Full 24-hour range — collapsed by default to 12:00-06:00 (practical range) */
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const DEFAULT_START_HOUR = 12;
const DEFAULT_END_HOUR = 6; // wraps to next day

function getVisibleHours(showFullDay: boolean): number[] {
    if (showFullDay) return ALL_HOURS;
    // Default: 12:00 → 05:00 (18 hours covering afternoon prep + night + early morning)
    const hours = [];
    for (let h = DEFAULT_START_HOUR; h !== DEFAULT_END_HOUR; h = (h + 1) % 24) {
        hours.push(h);
    }
    hours.push(DEFAULT_END_HOUR);
    return hours;
}

function responseColor(r?: string) {
    switch (r) {
        case 'accepted': return '#4ade80';
        case 'declined': return '#ef4444';
        case 'reschedule_requested': return '#fbbf24';
        default: return 'rgba(255,255,255,0.3)';
    }
}

function responseBg(r?: string) {
    switch (r) {
        case 'accepted': return 'rgba(74, 222, 128, 0.1)';
        case 'declined': return 'rgba(239, 68, 68, 0.1)';
        case 'reschedule_requested': return 'rgba(251, 191, 36, 0.1)';
        default: return 'rgba(255,255,255,0.04)';
    }
}

/* ── Event Block (in calendar cell) ── */
function EventBlock({ event, onClick }: { event: ClubEvent; onClick: () => void }) {
    const startH = parseInt(event.startTime.split(':')[0]);
    const endH = parseInt(event.endTime.split(':')[0]);
    const span = endH > startH ? endH - startH : (24 - startH + endH);

    return (
        <button
            onClick={onClick}
            style={{
                position: 'absolute', top: 2, left: 2, right: 2,
                height: `calc(${Math.min(span, 6) * 100}% - 4px)`,
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
                {event.name}
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
    event: ClubEvent | null;
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
    const myRole = isDj ? 'dj' as const : isHost ? 'host' as const : null;
    const myResponse = isDj ? event.djResponse : isHost ? event.hostResponse : null;

    async function handleRespond(resp: string) {
        if (!myRole || !event) return;
        setResponding(true);
        await onRespond(event.id, myRole, resp, responseMsg || undefined);
        setResponseMsg('');
        setResponding(false);
    }

    return (
        <Modal open={open} onClose={onClose} title={event.name} maxWidth={520}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Time & Date */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Calendar size={14} style={{ color: 'var(--neon-cyan)' }} />
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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

                {event.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{event.description}</p>
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
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #c084fc, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Headphones size={16} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DJ</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#c084fc' }}>{event.djName || 'Unassigned'}</div>
                            </div>
                        </div>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600, color: responseColor(event.djResponse), textTransform: 'uppercase', background: `${responseColor(event.djResponse)}15` }}>
                            {event.djResponse || 'none'}
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
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #ff6b9d, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Mic size={16} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Host</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#ff6b9d' }}>{event.hostName || 'Unassigned'}</div>
                            </div>
                        </div>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600, color: responseColor(event.hostResponse), textTransform: 'uppercase', background: `${responseColor(event.hostResponse)}15` }}>
                            {event.hostResponse || 'none'}
                        </span>
                    </div>

                    {event.djMessage && (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(192,132,252,0.06)', fontSize: 12, color: 'var(--text-secondary)' }}>
                            <strong>DJ:</strong> {event.djMessage}
                        </div>
                    )}
                    {event.hostMessage && (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,107,157,0.06)', fontSize: 12, color: 'var(--text-secondary)' }}>
                            <strong>Host:</strong> {event.hostMessage}
                        </div>
                    )}
                </div>

                {/* Response area for assigned staff */}
                {myRole && myResponse === 'pending' && (
                    <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Your Response</div>
                        <textarea value={responseMsg} onChange={e => setResponseMsg(e.target.value)} placeholder="Optional message..." style={{ width: '100%', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', minHeight: 60, resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleRespond('accepted')} disabled={responding} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Check size={16} /> Accept
                            </button>
                            <button onClick={() => handleRespond('declined')} disabled={responding} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <XCircle size={16} /> Decline
                            </button>
                            <button onClick={() => handleRespond('reschedule_requested')} disabled={responding} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <MessageSquare size={16} /> Modify
                            </button>
                        </div>
                    </div>
                )}

                {canManage && (
                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                        <button onClick={() => { onClose(); (event as any).__editRequested = true; }} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Pencil size={12} /> Edit Event
                        </button>
                        <button onClick={async () => { await onDelete(event.id); onClose(); }} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            Cancel Event
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

/* ── Create/Schedule Event Modal (with WheelPicker) ── */
function CreateEventModal({
    open, onClose, onSave, staffList
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<ClubEvent>) => Promise<void>;
    staffList: AppUser[];
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [djId, setDjId] = useState('');
    const [hostId, setHostId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setHours(22, 0, 0, 0);
        return d;
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(2, 0, 0, 0);
        return d;
    });

    // Staff eligible for DJ/Host
    const djCandidates = useMemo(() => staffList.filter(u =>
        u.role === 'dj' || u.secondaryRoles?.includes('dj') ||
        u.role === 'owner' || u.role === 'super_admin'
    ), [staffList]);

    const hostCandidates = useMemo(() => staffList.filter(u =>
        u.role === 'host' || u.secondaryRoles?.includes('host') ||
        u.role === 'owner' || u.role === 'super_admin'
    ), [staffList]);

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const dateStr = startDate.toISOString().split('T')[0];
            const startTime = startDate.toTimeString().slice(0, 5);
            const endTime = endDate.toTimeString().slice(0, 5);
            const selectedDj = staffList.find(s => s.uid === djId);
            const selectedHost = staffList.find(s => s.uid === hostId);

            // Upload image if file selected
            let finalImageUrl = imageUrl;
            if (imageFile) {
                const tempId = `evt_${Date.now()}`;
                finalImageUrl = await uploadEventImage(imageFile, tempId);
            }

            // Auto-generate name if empty (schedule-only entry)
            const eventName = name.trim() || `Schedule — ${dateStr} ${startTime}`;

            await onSave({
                name: eventName,
                description: description.trim(),
                genre: genre.trim() || undefined,
                imageUrl: finalImageUrl || undefined,
                date: dateStr,
                startTime,
                endTime,
                djId: djId || undefined,
                djName: selectedDj?.displayName || undefined,
                djResponse: djId ? 'pending' : undefined,
                hostId: hostId || undefined,
                hostName: selectedHost?.displayName || undefined,
                hostResponse: hostId ? 'pending' : undefined,
                status: name.trim() ? 'scheduled' : 'draft',
            });
            // Reset form
            setName(''); setDescription(''); setGenre(''); setDjId(''); setHostId('');
            setImageUrl(''); setImageFile(null); setImagePreview(null);
            onClose();
        } catch (err) {
            console.error('[CreateEvent] Failed to save:', err);
            setError(err instanceof Error ? err.message : 'Failed to create event. Check console.');
        } finally {
            setSaving(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontSize: 13, outline: 'none',
    };

    return (
        <Modal open={open} onClose={onClose} title="Schedule Event" maxWidth={520}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#ef4444' }}>
                        <AlertTriangle size={14} /> {error}
                    </div>
                )}

                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Event Name <span style={{ color: 'var(--text-muted)', fontSize: 9, fontStyle: 'italic' }}>(optional for schedule-only)</span></label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Neon Nights (leave blank for schedule-only)" style={inputStyle} />
                </div>

                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the vibe..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
                </div>

                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Genre</label>
                    <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g. House, Techno" style={inputStyle} />
                </div>

                {/* WheelPicker DateRange */}
                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                    isRange={true}
                />

                {/* Staff Pickers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Headphones size={11} /> DJ
                        </label>
                        <select value={djId} onChange={e => setDjId(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
                            <option value="">Select DJ...</option>
                            {djCandidates.map(s => (
                                <option key={s.uid} value={s.uid}>{s.displayName} ({ROLE_CONFIG[s.role]?.label})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mic size={11} /> Host
                        </label>
                        <select value={hostId} onChange={e => setHostId(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
                            <option value="">Select Host...</option>
                            {hostCandidates.map(s => (
                                <option key={s.uid} value={s.uid}>{s.displayName} ({ROLE_CONFIG[s.role]?.label})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Image upload */}
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Event Image</label>
                    {imagePreview ? (
                        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                            <button onClick={() => { setImageUrl(''); setImageFile(null); setImagePreview(null); }} style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 24, height: 24, borderRadius: 6,
                                background: 'rgba(0,0,0,0.7)', border: 'none',
                                color: '#ff6b6b', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => fileInputRef.current?.click()} style={{
                                flex: 1, padding: 10, borderRadius: 10,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px dashed rgba(255,255,255,0.12)',
                                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}>
                                <Upload size={12} /> Upload Image
                            </button>
                            <input
                                value={imageUrl} onChange={e => { setImageUrl(e.target.value); if (e.target.value) setImagePreview(e.target.value); }}
                                placeholder="or paste URL"
                                style={{ flex: 1, ...inputStyle, fontSize: 11 }}
                            />
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }}
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                            setImageUrl('');
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{
                        flex: 1, padding: 12, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(192,132,252,0.2))',
                        border: '1px solid rgba(0,240,255,0.3)',
                        color: '#00f0ff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                        opacity: saving ? 0.5 : 1,
                    }}>
                        {saving ? 'Creating...' : 'Create & Schedule'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCHEDULE PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function SchedulePage() {
    const { appUser } = useAuth();
    const { can } = useRole();
    const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [staffList, setStaffList] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
    const [editEvent, setEditEvent] = useState<ClubEvent | null>(null);
    const [showFullDay, setShowFullDay] = useState(false);
    const [postingRoster, setPostingRoster] = useState(false);
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const visibleHours = useMemo(() => getVisibleHours(showFullDay), [showFullDay]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch from unified `events` collection
            const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('date', 'asc')));
            const fetchedEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClubEvent));
            setEvents(fetchedEvents);
            console.log(`[Schedule] Fetched ${fetchedEvents.length} events from Firestore`);

            if (can('manager')) {
                const usersSnap = await getDocs(query(collection(db, 'users')));
                setStaffList(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));
            }
        } catch (e) {
            console.error('[Schedule] Failed to fetch:', e);
        } finally {
            setLoading(false);
        }
    }, [can]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (data: Partial<ClubEvent>) => {
        if (!appUser) return;
        console.log('[Schedule] Creating event:', data);
        const docRef = await addDoc(collection(db, 'events'), {
            ...data,
            createdBy: appUser.uid,
            createdAt: new Date().toISOString(),
        });
        console.log('[Schedule] Created event:', docRef.id);
        // Re-fetch to ensure consistency
        await fetchData();
    };

    const handleRespond = async (eventId: string, role: 'dj' | 'host', response: string, message?: string) => {
        const field = role === 'dj' ? 'djResponse' : 'hostResponse';
        const msgField = role === 'dj' ? 'djMessage' : 'hostMessage';
        const updates: Record<string, string> = { [field]: response };
        if (message) updates[msgField] = message;

        await updateDoc(doc(db, 'events', eventId), updates);
        setEvents(prev => prev.map(s => s.id === eventId ? { ...s, ...updates } : s));
        setSelectedEvent(prev => prev && prev.id === eventId ? { ...prev, ...updates } : prev);
    };

    const handleDelete = async (eventId: string) => {
        await deleteDoc(doc(db, 'events', eventId));
        setEvents(prev => prev.filter(s => s.id !== eventId));
    };

    /* ── Week data ── */
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)), [currentWeek]);

    const myEvents = useMemo(() => {
        if (!appUser) return [];
        return events.filter(e => e.djId === appUser.uid || e.hostId === appUser.uid)
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [events, appUser]);

    const pendingCount = useMemo(() => {
        if (!appUser) return 0;
        return events.filter(e => {
            if (e.djId === appUser.uid && e.djResponse === 'pending') return true;
            if (e.hostId === appUser.uid && e.hostResponse === 'pending') return true;
            return false;
        }).length;
    }, [events, appUser]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Schedule</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {events.length} events
                        {pendingCount > 0 && <span style={{ color: '#fbbf24', marginLeft: 8 }}>· {pendingCount} awaiting response</span>}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Full day toggle */}
                    <button onClick={() => setShowFullDay(p => !p)} style={{
                        padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                        background: showFullDay ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
                        color: showFullDay ? '#00f0ff' : 'var(--text-muted)',
                        fontSize: 11, cursor: 'pointer', fontWeight: 500,
                    }}>
                        {showFullDay ? '24h View' : '12–06 View'}
                    </button>

                    {/* Week nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <button onClick={() => setCurrentWeek(p => addDays(p, -7))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}><ArrowLeft size={14} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            <Calendar size={12} color="var(--neon-cyan)" />
                            {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {addDays(currentWeek, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <button onClick={() => setCurrentWeek(p => addDays(p, 7))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}><ArrowRight size={14} /></button>
                    </div>

                    {can('manager') && (
                        <>
                            <button onClick={async () => {
                                setPostingRoster(true); setActionMsg(null);
                                try {
                                    const weekDate = currentWeek.toISOString().split('T')[0];
                                    const res = await fetch('/api/schedule/roster', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weekDate }) });
                                    const data = await res.json();
                                    if (res.ok) setActionMsg({ type: 'success', text: `Roster posted! (${data.eventsCount} events)` });
                                    else setActionMsg({ type: 'error', text: data.error || 'Failed to post roster' });
                                } catch { setActionMsg({ type: 'error', text: 'Network error posting roster' }); }
                                finally { setPostingRoster(false); setTimeout(() => setActionMsg(null), 4000); }
                            }} disabled={postingRoster} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8,
                                background: 'rgba(88,101,242,0.12)', border: '1px solid rgba(88,101,242,0.25)',
                                color: '#7289da', fontWeight: 500, fontSize: 11, cursor: 'pointer',
                                opacity: postingRoster ? 0.5 : 1,
                            }}>
                                <Send size={12} /> {postingRoster ? 'Posting...' : 'Post Roster'}
                            </button>

                            <button onClick={async () => {
                                setAutoAssigning(true); setActionMsg(null);
                                try {
                                    const res = await fetch('/api/schedule/auto-assign', { method: 'POST' });
                                    const data = await res.json();
                                    if (res.ok) {
                                        const count = data.proposals?.length || 0;
                                        setActionMsg({ type: 'success', text: `${count} assignments proposed. Check ${count > 0 ? 'console' : 'availability first'}.` });
                                        console.log('[AutoAssign] Proposals:', data.proposals);
                                    } else setActionMsg({ type: 'error', text: data.error || 'Failed to auto-assign' });
                                } catch { setActionMsg({ type: 'error', text: 'Network error auto-assigning' }); }
                                finally { setAutoAssigning(false); setTimeout(() => setActionMsg(null), 5000); }
                            }} disabled={autoAssigning} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8,
                                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                                color: '#fbbf24', fontWeight: 500, fontSize: 11, cursor: 'pointer',
                                opacity: autoAssigning ? 0.5 : 1,
                            }}>
                                <Sparkles size={12} /> {autoAssigning ? 'Assigning...' : 'Auto-Assign'}
                            </button>

                            <button onClick={() => setIsCreateOpen(true)} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 10,
                                background: 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(192,132,252,0.12))',
                                border: '1px solid rgba(0,240,255,0.25)',
                                color: '#00f0ff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            }}>
                                <Plus size={15} /> Schedule Event
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Action message toast */}
            {actionMsg && (
                <div style={{ padding: '10px 16px', borderRadius: 12, background: actionMsg.type === 'success' ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${actionMsg.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: actionMsg.type === 'success' ? '#4ade80' : '#ef4444' }}>
                    {actionMsg.type === 'success' ? '✅' : '❌'} {actionMsg.text}
                </div>
            )}

            {/* Pending banner */}
            {pendingCount > 0 && (
                <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#fbbf24' }}>
                    ⚡ {pendingCount} event{pendingCount > 1 ? 's' : ''} awaiting your response
                </div>
            )}

            {/* Calendar Grid */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule...</div>
            ) : (
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, overflow: 'auto',
                    maxHeight: '70vh',
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px repeat(7, 1fr)',
                        minWidth: 700,
                    }}>
                        {/* Header Row (sticky) */}
                        <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(15,15,30,0.95)' }} />
                        {weekDays.map(d => {
                            const isToday = fmtDateKey(d) === fmtDateKey(new Date());
                            return (
                                <div key={d.toISOString()} style={{
                                    padding: '10px 4px', textAlign: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    borderLeft: '1px solid rgba(255,255,255,0.04)',
                                    background: isToday ? 'rgba(0,240,255,0.04)' : 'rgba(15,15,30,0.95)',
                                    position: 'sticky', top: 0, zIndex: 20,
                                }}>
                                    <div style={{ fontSize: 10, color: isToday ? '#00f0ff' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? '#00f0ff' : 'var(--text-primary)', marginTop: 2 }}>
                                        {d.getDate()}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Time rows */}
                        {visibleHours.map(h => (
                            <React.Fragment key={h}>
                                <div style={{
                                    padding: '4px 6px', fontSize: 10, color: 'var(--text-muted)',
                                    textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.04)',
                                    fontFamily: 'var(--font-mono)',
                                }}>
                                    {h.toString().padStart(2, '0')}:00
                                </div>
                                {weekDays.map(day => {
                                    const dateStr = fmtDateKey(day);
                                    const cellEvents = events.filter(ev => {
                                        if (ev.date !== dateStr) return false;
                                        const startH = parseInt(ev.startTime.split(':')[0]);
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

            {/* My schedule section */}
            {myEvents.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>My Upcoming Events</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {myEvents.slice(0, 10).map(ev => {
                            const myRole = ev.djId === appUser?.uid ? 'DJ' : 'Host';
                            const myResp = myRole === 'DJ' ? ev.djResponse : ev.hostResponse;
                            return (
                                <button key={ev.id} onClick={() => setSelectedEvent(ev)} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s',
                                }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(192,132,252,0.3)'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{ev.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {ev.date} · {ev.startTime}–{ev.endTime} · {myRole}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, color: responseColor(myResp), background: `${responseColor(myResp)}15`, fontWeight: 600, textTransform: 'uppercase' }}>
                                        {myResp || 'none'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateEventModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleCreate}
                staffList={staffList}
            />

            <EventDetailModal
                event={selectedEvent}
                open={!!selectedEvent}
                onClose={() => {
                    const ev = selectedEvent;
                    setSelectedEvent(null);
                    // Check if edit was requested
                    if (ev && (ev as any).__editRequested) {
                        delete (ev as any).__editRequested;
                        setEditEvent(ev);
                    }
                }}
                canManage={can('manager')}
                currentUserId={appUser?.uid || ''}
                onRespond={handleRespond}
                onDelete={handleDelete}
            />

            {/* Edit Event Modal (reuses AddEventModal) */}
            <AddEventModal
                open={!!editEvent}
                onClose={() => setEditEvent(null)}
                onSave={() => { setEditEvent(null); fetchData(); }}
                staffList={staffList}
                eventToEdit={editEvent}
            />
        </div>
    );
}
