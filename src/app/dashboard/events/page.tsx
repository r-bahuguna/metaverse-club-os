'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Music, MapPin, Plus, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AddEventModal from '@/components/ui/AddEventModal';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import { AppUser } from '@/lib/types';

interface EventData {
    id: string;
    name: string;
    description: string;
    genre: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    djId: string;
    djName: string;
    hostId: string;
    hostName: string;
    isRecurring: boolean;
    imageUrl?: string;
    createdBy: string;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(timeStr: string): string {
    // Simple pass-through or reformat if needed
    return timeStr;
}

export default function EventsPage() {
    const { can } = useRole();
    const [events, setEvents] = useState<EventData[]>([]);
    const [staffList, setStaffList] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventData | undefined>(undefined);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch events (ordered by date ideally, but simple fetch for now)
            const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('date', 'desc')));
            const fetchedEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventData));
            setEvents(fetchedEvents);

            // Fetch staff for picker (only need if manager)
            if (can('manager')) {
                const usersSnap = await getDocs(query(collection(db, 'users')));
                const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
                setStaffList(users);
            }
        } catch (e) {
            console.error('Failed to fetch events:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [can]);

    const handleCreateClick = () => {
        setEditingEvent(undefined);
        setIsAddModalOpen(true);
    };

    const handleEditClick = (event: EventData) => {
        setEditingEvent(event);
        setIsAddModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Events
                </h1>
                {can('manager') && (
                    <button
                        onClick={handleCreateClick}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8,
                            background: 'var(--neon-cyan)', border: 'none',
                            color: 'black', fontWeight: 600, fontSize: 13,
                            cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                        }}
                    >
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
                                {/* Event Header */}
                                <div style={{ marginBottom: 16 }}>
                                    <h2 style={{
                                        fontFamily: 'var(--font-display)', fontSize: 20,
                                        fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4,
                                    }}>
                                        {event.name}
                                    </h2>
                                    {event.isRecurring && (
                                        <span style={{
                                            fontSize: 10, padding: '2px 8px', borderRadius: 99,
                                            background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                                        }}>
                                            Recurring
                                        </span>
                                    )}
                                </div>

                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                                    {event.description}
                                </p>

                                {/* Event Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Calendar size={14} style={{ color: 'var(--neon-purple)', flexShrink: 0 }} />
                                        {formatDate(event.date)}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Clock size={14} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
                                    </div>

                                    {event.genre && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                            <Music size={14} style={{ color: 'var(--neon-pink)', flexShrink: 0 }} />
                                            {event.genre}
                                        </div>
                                    )}

                                    {/* Crew */}
                                    <div style={{
                                        borderTop: '1px solid var(--glass-border)', paddingTop: 12,
                                        marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', gap: 20 }}>
                                            {event.djName && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                                    <span style={{
                                                        width: 24, height: 24, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 10, fontWeight: 600, color: '#fff',
                                                    }}>
                                                        DJ
                                                    </span>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>DJ</div>
                                                        <div style={{ color: 'var(--neon-purple)', fontWeight: 500 }}>{event.djName}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {event.hostName && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                                    <span style={{
                                                        width: 24, height: 24, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #ff6b9d, #ec4899)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 10, fontWeight: 600, color: '#fff',
                                                    }}>
                                                        H
                                                    </span>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Host</div>
                                                        <div style={{ color: 'var(--neon-pink)', fontWeight: 500 }}>{event.hostName}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {can('manager') && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(event); }}
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--glass-border)',
                                                        color: 'white', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Delete event?')) {
                                                            await deleteDoc(doc(db, 'events', event.id));
                                                            fetchData();
                                                        }
                                                    }}
                                                    style={{
                                                        background: 'rgba(255, 0, 60, 0.1)', border: '1px solid rgba(255, 0, 60, 0.2)',
                                                        color: '#ff6b6b', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
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
