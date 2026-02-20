'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Music, Plus, Loader2, Headphones, Mic, Check, XCircle, Clock3 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AddEventModal from '@/components/ui/AddEventModal';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ClubEvent, AppUser } from '@/lib/types';

function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
}

function ResponseBadge({ response, label }: { response?: string; label: string }) {
    const colors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
        accepted: { bg: 'rgba(74,222,128,0.1)', text: '#4ade80', icon: <Check size={10} /> },
        declined: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', icon: <XCircle size={10} /> },
        pending: { bg: 'rgba(251,191,36,0.08)', text: '#fbbf24', icon: <Clock3 size={10} /> },
    };
    const c = colors[response || ''] || colors.pending;
    if (!response) return null;

    return (
        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 5, background: c.bg, color: c.text, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>
            {c.icon} {label}: {response}
        </span>
    );
}

export default function EventsPage() {
    const { can } = useRole();
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [staffList, setStaffList] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ClubEvent | undefined>(undefined);

    const fetchData = async () => {
        setLoading(true);
        try {
            const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('date', 'desc')));
            setEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClubEvent)));

            if (can('manager')) {
                const usersSnap = await getDocs(query(collection(db, 'users')));
                setStaffList(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));
            }
        } catch (e) {
            console.error('Failed to fetch events:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [can]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>Events</h1>
                {can('manager') && (
                    <button onClick={() => { setEditingEvent(undefined); setIsAddModalOpen(true); }} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: 'var(--neon-cyan)', border: 'none',
                        color: 'black', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                    }}>
                        <Plus size={16} /> Create Event
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <Loader2 size={24} className="animate-spin" style={{ marginBottom: 10 }} />
                    <p>Loading events...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
                    {events.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No events scheduled yet.</p>
                    ) : (
                        events.map(event => (
                            <GlassCard key={event.id} neon="purple" interactive>
                                <div style={{ marginBottom: 16 }}>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {event.name}
                                    </h2>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {event.isRecurring && (
                                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                                Recurring
                                            </span>
                                        )}
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: event.status === 'confirmed' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', color: event.status === 'confirmed' ? '#4ade80' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                            {event.status || 'scheduled'}
                                        </span>
                                    </div>
                                </div>

                                {event.description && (
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                                        {event.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Calendar size={14} style={{ color: 'var(--neon-purple)', flexShrink: 0 }} />
                                        {formatDate(event.date)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Clock size={14} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{event.startTime} – {event.endTime}</span>
                                    </div>
                                    {event.genre && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                            <Music size={14} style={{ color: 'var(--neon-pink)', flexShrink: 0 }} />
                                            {event.genre}
                                        </div>
                                    )}

                                    {/* Crew + Scheduling Status */}
                                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                {event.djName && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #c084fc, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Headphones size={12} color="#fff" />
                                                        </span>
                                                        <span style={{ color: 'var(--neon-purple)', fontWeight: 500 }}>{event.djName}</span>
                                                    </div>
                                                )}
                                                {event.hostName && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b9d, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Mic size={12} color="#fff" />
                                                        </span>
                                                        <span style={{ color: 'var(--neon-pink)', fontWeight: 500 }}>{event.hostName}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {can('manager') && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsAddModalOpen(true); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                                                    <button onClick={async (e) => { e.stopPropagation(); if (confirm('Delete event?')) { await deleteDoc(doc(db, 'events', event.id)); fetchData(); } }} style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.2)', color: '#ff6b6b', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Delete</button>
                                                </div>
                                            )}
                                        </div>
                                        {(event.djResponse || event.hostResponse) && (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {event.djResponse && <ResponseBadge response={event.djResponse} label="DJ" />}
                                                {event.hostResponse && <ResponseBadge response={event.hostResponse} label="Host" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}

            <AddEventModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={fetchData}
                staffList={staffList}
                eventToEdit={editingEvent}
            />
        </div>
    );
}
