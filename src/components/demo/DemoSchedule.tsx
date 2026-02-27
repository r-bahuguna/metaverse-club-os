'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Plus, ArrowLeft, ArrowRight, Check, XCircle, MessageSquare, Headphones, Mic, AlertTriangle, Send, Sparkles, Pencil } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { ClubEvent } from '@/lib/types';
import { MOCK_EVENTS } from '@/lib/mock-data';

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

function getVisibleHours(showFullDay: boolean): number[] {
    const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
    if (showFullDay) return ALL_HOURS;
    const hours = [];
    for (let h = 12; h !== 6; h = (h + 1) % 24) {
        hours.push(h);
    }
    hours.push(6);
    return hours;
}

function EventBlock({ event, onClick }: { event: any; onClick: () => void }) {
    const startH = parseInt(event.startTime.split(':')[0]);
    const endH = parseInt(event.endTime.split(':')[0]);
    const span = endH > startH ? endH - startH : (24 - startH + endH);

    // Determine styles based on status
    let bgGradient = 'linear-gradient(135deg, rgba(192, 132, 252, 0.2), rgba(0, 240, 255, 0.15))';
    let borderColor = 'rgba(192, 132, 252, 0.3)';
    let statusText = '';
    let StatusIcon = null;

    if (event.status === 'accepted') {
        bgGradient = 'linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(34, 197, 94, 0.15))';
        borderColor = 'rgba(74, 222, 128, 0.4)';
        statusText = 'Accepted';
        StatusIcon = Check;
    } else if (event.status === 'pending') {
        bgGradient = 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.15))';
        borderColor = 'rgba(234, 179, 8, 0.4)';
        statusText = 'Pending Approval';
        StatusIcon = Clock;
    } else if (event.status === 'declined') {
        bgGradient = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))';
        borderColor = 'rgba(239, 68, 68, 0.4)';
        statusText = 'Declined';
        StatusIcon = XCircle;
    } else if (event.status === 'reschedule') {
        bgGradient = 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15))';
        borderColor = 'rgba(249, 115, 22, 0.4)';
        statusText = 'Reschedule Requested';
        StatusIcon = AlertTriangle;
    }

    return (
        <button
            onClick={onClick}
            style={{
                position: 'absolute', top: 2, left: 2, right: 2,
                height: `calc(${Math.min(span, 6) * 100}% - 4px)`,
                minHeight: 32,
                background: bgGradient,
                border: `1px solid ${borderColor}`,
                borderRadius: 8, padding: '6px 8px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden', zIndex: 10,
                display: 'flex', flexDirection: 'column', gap: 2,
            }}
            onMouseOver={e => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${borderColor.replace('0.4', '0.6')}`;
            }}
            onMouseOut={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.name}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                {event.startTime}–{event.endTime}
            </div>
            {StatusIcon && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 4px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, alignSelf: 'flex-start' }}>
                    <StatusIcon size={10} color={borderColor.replace('0.4', '1').replace('rgba', 'rgb').replace(/,[^,]+$/, ')')} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: borderColor.replace('0.4', '1').replace('rgba', 'rgb').replace(/,[^,]+$/, ')') }}>{statusText}</span>
                </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, flexShrink: 0 }}>
                {event.djName && (
                    <span style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: 'rgba(192,132,252,0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Headphones size={8} />{event.djName.split(' ')[0]}
                    </span>
                )}
                {event.hostName && (
                    <span style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: 'rgba(255,107,157,0.2)', color: '#ff6b9d', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Mic size={8} />{event.hostName.split(' ')[0]}
                    </span>
                )}
            </div>
        </button>
    );
}

export default function DemoScheduleView() {
    const { role, can, isGuest } = useRole();
    const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
    const [showFullDay, setShowFullDay] = useState(false);

    // Generate a set of dynamic 2-hour shifts for the week
    const shifts = React.useMemo(() => {
        const statuses: ('accepted' | 'pending' | 'declined' | 'reschedule')[] = ['accepted', 'pending', 'declined', 'reschedule', 'accepted', 'accepted'];
        const list = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(currentWeek, i).toISOString().split('T')[0];
            // 2 shifts per day at random hours
            const start1 = 18 + Math.floor(Math.random() * 2) * 2; // 18 or 20
            const start2 = 22 + Math.floor(Math.random() * 2) * 2; // 22 or 0 (24)

            list.push({
                id: `shift-${i}-1`,
                date,
                startTime: `${start1}:00`,
                endTime: `${(start1 + 2) % 24}:00`,
                name: 'Evening Shift',
                djName: ['DJ Shell', 'DJ Aiden', 'DJ Bravo'][Math.floor(Math.random() * 3)],
                hostName: ['Ice', 'Luna', 'Sarah P'][Math.floor(Math.random() * 3)],
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
            list.push({
                id: `shift-${i}-2`,
                date,
                startTime: `${start2}:00`,
                endTime: `${(start2 + 2) % 24}:00`,
                name: 'Late Shift',
                djName: ['DJ Tiago', 'DJ Del', 'DJ Yonny'][Math.floor(Math.random() * 3)],
                hostName: ['Desi', 'SARAH OPAH', 'Tiffany'][Math.floor(Math.random() * 3)],
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
        }
        return list;
    }, [currentWeek]);

    const visibleHours = getVisibleHours(showFullDay);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

    if (isGuest) {
        return (
            <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</p>
                <p>Login required to view the Schedule Engine.</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Switch to a Host role using the toggle above.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Schedule</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {shifts.length} events
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowFullDay(p => !p)} style={{
                        padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                        background: showFullDay ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
                        color: showFullDay ? '#00f0ff' : 'var(--text-muted)',
                        fontSize: 11, cursor: 'pointer', fontWeight: 500,
                    }}>
                        {showFullDay ? '24h View' : '12–06 View'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <button onClick={() => setCurrentWeek(p => addDays(p, -7))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}><ArrowLeft size={14} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            <Calendar size={12} color="var(--neon-cyan)" />
                            {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {addDays(currentWeek, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <button onClick={() => setCurrentWeek(p => addDays(p, 7))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}><ArrowRight size={14} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        {can('manager') && (
                            <>
                                <button onClick={() => alert('Demo Mode: Autopilot Scheduling\\n\\nIn the live version, this uses our scheduling algorithm to automatically draft the optimal roster based on staff availability, venue capacity rules, and budget metrics.')} style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 12px', borderRadius: 8,
                                    background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.25)',
                                    color: '#4ade80', fontWeight: 500, fontSize: 11, cursor: 'pointer',
                                }}>
                                    <Sparkles size={12} /> Auto-Filter Roster
                                </button>
                                <button onClick={() => alert('Demo Mode: Post Roster\\n\\nIn the live app, this locks the schedule, pushing Discord notifications to assigned DJs/Hosts and updating the public website schedule instantly.')} style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 12px', borderRadius: 8,
                                    background: 'rgba(88,101,242,0.12)', border: '1px solid rgba(88,101,242,0.25)',
                                    color: '#7289da', fontWeight: 500, fontSize: 11, cursor: 'pointer',
                                }}>
                                    <Send size={12} /> Post Roster
                                </button>
                            </>
                        )}
                        {(can('manager') || role === 'dj' || role === 'host') && (
                            <>
                                <button onClick={() => alert('Demo Mode: Apply for Open Shift\\n\\nStaff can instantly see unassigned shifts and submit an application. Management receives a ping to approve or deny.')} style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 12px', borderRadius: 8,
                                    background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.25)',
                                    color: '#ff6b9d', fontWeight: 500, fontSize: 11, cursor: 'pointer',
                                }}>
                                    <Sparkles size={12} /> Apply for Shift
                                </button>
                                <button onClick={() => alert('Demo Mode: Set Availability\\n\\nStaff can mark themselves available, unavailable, or request specific 2-hour blocks natively within the dashboard.')} style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 12px', borderRadius: 8,
                                    background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)',
                                    color: 'var(--neon-cyan)', fontWeight: 500, fontSize: 11, cursor: 'pointer',
                                }}>
                                    <Calendar size={12} /> Set Availability
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={{
                flex: 1, minHeight: 400, maxHeight: 'calc(100vh - 280px)',
                overflow: 'auto', background: 'rgba(0,0,0,0.2)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '50px repeat(7, 1fr)',
                    minWidth: 700,
                }}>
                    {/* Header Row (sticky) */}
                    <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(15,15,30,0.95)' }} />
                    {weekDays.map(d => {
                        return (
                            <div key={d.toISOString()} style={{
                                padding: '10px 4px', textAlign: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                borderLeft: '1px solid rgba(255,255,255,0.04)',
                                background: 'rgba(15,15,30,0.95)',
                                position: 'sticky', top: 0, zIndex: 20,
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                                    {d.getDate()}
                                </div>
                            </div>
                        );
                    })}

                    {/* Time rows */}
                    {visibleHours.map(h => (
                        <React.Fragment key={h}>
                            <div style={{
                                padding: '8px 4px', fontSize: 10, color: 'var(--text-muted)',
                                textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.04)',
                                fontFamily: 'var(--font-mono)', borderRight: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                {h.toString().padStart(2, '0')}:00
                            </div>
                            {weekDays.map(day => {
                                const dateStr = day.toISOString().split('T')[0];
                                const cellEvents = shifts.filter(ev => {
                                    if (ev.date !== dateStr) return false;
                                    const startH = parseInt(ev.startTime.split(':')[0]);
                                    return startH === h;
                                });

                                return (
                                    <div key={day.toISOString() + h} style={{
                                        borderTop: '1px solid rgba(255,255,255,0.04)',
                                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                                        height: 100, position: 'relative',
                                    }}>
                                        {cellEvents.map(ev => (
                                            <EventBlock key={ev.id} event={ev as any} onClick={() => alert(`Demo Mode: Event Details (${ev.name})\n\nClicking a shift allows Managers to edit staffing or Hosts/DJs to accept, decline, or request a reschedule.`)} />
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
