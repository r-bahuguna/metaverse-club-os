'use client';

import React, { useState } from 'react';
import { Plus, Check, Clock, Globe, ArrowRight, Star } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { MOCK_EVENTS, MOCK_STAFF } from '@/lib/mock-data';
import GlassCard from '@/components/ui/GlassCard';

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return {
        day: d.getDate().toString(),
        month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
        year: d.getFullYear(),
    };
}

export default function DemoEventsView() {
    const { can, isGuest } = useRole();
    const [events] = useState(MOCK_EVENTS);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    if (!can('host') && isGuest) {
        return (
            <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</p>
                <p>Login required to view full event details.</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Guests can only view the overview dashboard.</p>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const filteredEvents = activeTab === 'upcoming'
        ? events.filter(e => e.date >= today && e.status !== 'cancelled')
        : events.filter(e => e.date < today && e.status !== 'cancelled');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Events</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Manage club events and theme nights</p>
                </div>
                {can('manager') && (
                    <button onClick={() => alert('Demo Mode: Create Event\\n\\nIn the live production application, Managers can generate new event flyers, assign Staff (DJs/Hosts), set themes, and automatically post event announcements to Discord.')} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(192, 132, 252, 0.3)',
                    }}>
                        <Plus size={16} /> Create Event
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: activeTab === 'upcoming' ? 'rgba(192,132,252,0.1)' : 'transparent',
                        color: activeTab === 'upcoming' ? 'var(--neon-purple)' : 'var(--text-muted)',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: activeTab === 'past' ? 'rgba(255,255,255,0.05)' : 'transparent',
                        color: activeTab === 'past' ? '#fff' : 'var(--text-muted)',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                >
                    Past Events
                </button>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filteredEvents.map(event => {
                    const { day, month } = formatDate(event.date);
                    const isSpecial = event.type === 'event';
                    const dj = MOCK_STAFF.find(s => s.id === event.djId);
                    const host = MOCK_STAFF.find(s => s.id === event.hostId);

                    return (
                        <div key={event.id} style={{
                            display: 'flex', flexDirection: 'column',
                            borderRadius: 16, overflow: 'hidden',
                            background: 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isSpecial ? 'rgba(192,132,252,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            position: 'relative',
                        }}>
                            {/* Image Header */}
                            <div style={{
                                height: 140, position: 'relative',
                                background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'rgba(0,0,0,0.5)',
                            }}>
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,20,0.95) 100%)' }} />

                                {isSpecial && (
                                    <div style={{
                                        position: 'absolute', top: 12, right: 12,
                                        padding: '4px 8px', borderRadius: 6,
                                        background: 'rgba(192, 132, 252, 0.2)', border: '1px solid rgba(192, 132, 252, 0.4)',
                                        color: '#c084fc', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                        display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)',
                                    }}>
                                        <Star size={10} /> Special Event
                                    </div>
                                )}

                                <div style={{
                                    position: 'absolute', bottom: -16, left: 16,
                                    width: 50, height: 50, borderRadius: 12,
                                    background: 'linear-gradient(135deg, rgba(10,10,20,0.9), rgba(20,20,30,0.9))',
                                    border: `1px solid ${isSpecial ? '#c084fc' : 'rgba(255,255,255,0.1)'}`,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.4)', zIndex: 2,
                                }}>
                                    <span style={{ fontSize: 20, fontWeight: 800, color: isSpecial ? '#c084fc' : '#fff', lineHeight: 1 }}>{day}</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{month}</span>
                                </div>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '24px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        {event.name}
                                    </h3>
                                    {(event.status === 'scheduled' || event.status === 'live') && <span title="Published"><Check size={16} color="#4ade80" /></span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {event.startTime} - {event.endTime}</span>
                                </div>

                                {event.description && (
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {event.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {dj && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dj.displayName.replace('DJ ', ''))}&background=c084fc&color=fff&size=32`} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="DJ" />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>{dj.displayName}</span>
                                                    <span style={{ fontSize: 10, color: event.status === 'scheduled' || event.status === 'live' || event.status === 'confirmed' ? '#4ade80' : '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: event.status === 'scheduled' || event.status === 'live' || event.status === 'confirmed' ? '#4ade80' : '#fbbf24' }} />
                                                        {event.status === 'scheduled' || event.status === 'live' || event.status === 'confirmed' ? 'Accepted' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {host && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(host.displayName)}&background=ff6b9d&color=fff&size=32`} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="Host" />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>{host.displayName}</span>
                                                    <span style={{ fontSize: 10, color: event.status === 'scheduled' || event.status === 'live' || event.status === 'confirmed' ? '#4ade80' : '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: event.status === 'scheduled' || event.status === 'live' || event.status === 'confirmed' ? '#4ade80' : '#fbbf24' }} />
                                                        {event.status === 'scheduled' || event.status === 'live' || event.status === 'confirmed' ? 'Accepted' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => alert('Demo Mode: View Details\\n\\nAllows managing RSVPs, tracking live attendance, adding/modifying the playlist, and pushing live announcements to Discord.')} style={{
                                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                                    }}>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {filteredEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No {activeTab} events found.
                </div>
            )}
        </div>
    );
}
