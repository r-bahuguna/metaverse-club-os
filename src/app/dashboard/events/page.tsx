'use client';

import React from 'react';
import { Calendar, Clock, Music, Mic, MapPin } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { MOCK_EVENTS, MOCK_STAFF } from '@/lib/mock-data';

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function EventsPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Events
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-5)' }}>
                {MOCK_EVENTS.map(event => {
                    const dj = MOCK_STAFF.find(s => s.id === event.djId);
                    const host = MOCK_STAFF.find(s => s.id === event.hostId);

                    return (
                        <GlassCard key={event.id} neon="purple" interactive>
                            {/* Event Header */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <h2 style={{
                                    fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
                                    fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px',
                                }}>
                                    {event.name}
                                </h2>
                                {event.isRecurring && (
                                    <span style={{
                                        fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                        background: 'var(--neon-cyan-dim)', color: 'var(--neon-cyan)',
                                        textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                                    }}>
                                        Recurring
                                    </span>
                                )}
                            </div>

                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
                                {event.description}
                            </p>

                            {/* Event Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    <Calendar size={14} style={{ color: 'var(--neon-purple)', flexShrink: 0 }} />
                                    {formatDate(event.date)}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    <Clock size={14} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>{event.startTime} – {event.endTime}</span>
                                </div>

                                {event.genre && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        <Music size={14} style={{ color: 'var(--neon-pink)', flexShrink: 0 }} />
                                        {event.genre}
                                    </div>
                                )}

                                {/* Crew */}
                                <div style={{
                                    borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-3)',
                                    marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-5)',
                                }}>
                                    {dj && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                                            <span style={{
                                                width: 24, height: 24, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 600, color: '#fff',
                                            }}>
                                                {dj.displayName.charAt(0)}
                                            </span>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>DJ</div>
                                                <div style={{ color: 'var(--neon-purple)', fontWeight: 500 }}>{dj.displayName}</div>
                                            </div>
                                        </div>
                                    )}
                                    {host && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                                            <span style={{
                                                width: 24, height: 24, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #ff6b9d, #ec4899)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 600, color: '#fff',
                                            }}>
                                                {host.displayName.charAt(0)}
                                            </span>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Host</div>
                                                <div style={{ color: 'var(--neon-pink)', fontWeight: 500 }}>{host.displayName}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
