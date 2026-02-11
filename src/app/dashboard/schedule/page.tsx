'use client';

import React, { useMemo, useState } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Sparkles, Check, X,
    Clock, AlertTriangle, CalendarDays,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { MOCK_SHIFTS, MOCK_PAIRINGS, MOCK_AVAILABILITY } from '@/lib/mock-data';
import type { Shift, SchedulePairing, ShiftResponse } from '@/lib/types';
import styles from './page.module.css';

const TIME_SLOTS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00'];

function getWeekDays(): { label: string; date: string; isToday: boolean }[] {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        return {
            label: d.toLocaleDateString('en', { weekday: 'short' }),
            date: dateStr,
            isToday: dateStr === today.toISOString().split('T')[0],
        };
    });
}

function getShiftStyle(role: string): string {
    switch (role) {
        case 'dj': return styles.shiftDj;
        case 'host': return styles.shiftHost;
        case 'manager': return styles.shiftManager;
        default: return styles.shiftDj;
    }
}

const RESPONSE_COLORS: Record<ShiftResponse, { bg: string; color: string; label: string }> = {
    pending: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', label: 'Pending' },
    accepted: { bg: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', label: 'Accepted' },
    declined: { bg: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', label: 'Declined' },
    reschedule_requested: { bg: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', label: 'Reschedule' },
};

/* ── Add Shift Modal ── */
function AddShiftModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        }} onClick={onClose}>
            <div style={{
                maxWidth: 420, width: '90%',
                background: 'rgba(15, 15, 30, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: 16, padding: 24,
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Add Shift</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {['Staff Name', 'Date (YYYY-MM-DD)', 'Start Time', 'End Time', 'Notes'].map(lbl => (
                        <div key={lbl}>
                            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</label>
                            <input style={{
                                width: '100%', marginTop: 4, padding: '8px 12px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                            }} />
                        </div>
                    ))}
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</label>
                        <select style={{
                            width: '100%', marginTop: 4, padding: '8px 12px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                        }}>
                            <option value="dj">DJ</option>
                            <option value="host">Host</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: 10, borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                        }}>Cancel</button>
                        <button onClick={onClose} style={{
                            flex: 1, padding: 10, borderRadius: 8,
                            background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)',
                            color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        }}>Create Shift</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SchedulePage() {
    const { can, currentRole } = useRole();
    const weekDays = useMemo(() => getWeekDays(), []);
    const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
    const [pairings, setPairings] = useState<SchedulePairing[]>(MOCK_PAIRINGS);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'grid' | 'responses' | 'smart'>('grid');

    const isManager = can('manager');

    const getShiftsForCell = (date: string, timeSlot: string) => {
        return shifts.filter(shift => {
            if (shift.date !== date) return false;
            const slotH = parseInt(timeSlot.split(':')[0]);
            const startH = parseInt(shift.startTime.split(':')[0]);
            const endH = parseInt(shift.endTime.split(':')[0]);
            if (endH > startH) return slotH >= startH && slotH < endH;
            return slotH >= startH || slotH < endH;
        });
    };

    /* Staff-side: respond to a shift */
    function handleShiftResponse(shiftId: string, response: ShiftResponse) {
        setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, response } : s));
    }

    /* Management-side: approve/reject pairing */
    function handlePairingDecision(pairingId: string, status: 'approved' | 'rejected') {
        setPairings(prev => prev.map(p => p.id === pairingId ? { ...p, status } : p));
    }

    const tabs = isManager
        ? [
            { id: 'grid' as const, label: 'Schedule Grid' },
            { id: 'responses' as const, label: 'Shift Responses' },
            { id: 'smart' as const, label: 'Smart Schedule' },
        ]
        : [
            { id: 'grid' as const, label: 'My Schedule' },
            { id: 'responses' as const, label: 'My Shifts' },
        ];

    return (
        <div className={styles.schedulePage}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>
                        <CalendarDays size={24} style={{ color: 'var(--neon-purple)' }} />
                        Schedule
                    </h1>
                </div>
                {isManager && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8,
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            background: 'rgba(0, 240, 255, 0.06)',
                            color: 'var(--neon-cyan)', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} /> Add Shift
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-4)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '8px 16px', borderRadius: 8,
                            border: activeTab === tab.id ? '1px solid var(--neon-cyan)' : '1px solid var(--glass-border)',
                            background: activeTab === tab.id ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: Schedule Grid ═══ */}
            {activeTab === 'grid' && (
                <>
                    <div className={styles.weekNav}>
                        <button className={styles.weekNavBtn}><ChevronLeft size={16} /></button>
                        <span className={styles.weekLabel}>
                            {weekDays[0]?.date && new Date(weekDays[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {weekDays[6]?.date && new Date(weekDays[6].date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button className={styles.weekNavBtn}><ChevronRight size={16} /></button>
                    </div>
                    <GlassCard>
                        <div className={styles.scheduleGrid}>
                            <div className={styles.gridHeader}></div>
                            {weekDays.map(day => (
                                <div key={day.date} className={`${styles.gridHeader} ${day.isToday ? styles.gridHeaderToday : ''}`}>
                                    {day.label}<br />
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{new Date(day.date).getDate()}</span>
                                </div>
                            ))}
                            {TIME_SLOTS.map(time => (
                                <React.Fragment key={time}>
                                    <div className={styles.timeLabel}>{time}</div>
                                    {weekDays.map(day => {
                                        const startsHere = getShiftsForCell(day.date, time).filter(s => s.startTime === time);
                                        return (
                                            <div key={`${day.date}-${time}`} className={styles.gridCell}>
                                                {startsHere.map(shift => {
                                                    const resp = RESPONSE_COLORS[shift.response];
                                                    return (
                                                        <div key={shift.id} className={`${styles.shiftBlock} ${getShiftStyle(shift.role)}`}>
                                                            <div className={styles.shiftName}>{shift.staffName}</div>
                                                            <div className={styles.shiftTime}>{shift.startTime}–{shift.endTime}</div>
                                                            <span style={{
                                                                fontSize: 8, padding: '1px 4px', borderRadius: 3,
                                                                background: resp.bg, color: resp.color,
                                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                            }}>{resp.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </GlassCard>
                    <div className={styles.legend}>
                        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--neon-purple)' }} />DJ</div>
                        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--neon-pink)' }} />Host</div>
                        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--neon-green)' }} />Manager</div>
                    </div>
                </>
            )}

            {/* ═══ TAB: Shift Responses ═══ */}
            {activeTab === 'responses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {shifts.filter(s => s.status === 'scheduled').map(shift => {
                        const resp = RESPONSE_COLORS[shift.response];
                        return (
                            <AnimatedCard key={shift.id} index={0}>
                                <GlassCard>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {shift.staffName}
                                                <span style={{
                                                    marginLeft: 8, fontSize: 10, padding: '2px 8px', borderRadius: 4,
                                                    background: resp.bg, color: resp.color,
                                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                                }}>{resp.label}</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                                                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                {shift.date} · {shift.startTime}–{shift.endTime}
                                            </div>
                                            {shift.notes && (
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{shift.notes}</div>
                                            )}
                                        </div>
                                        {/* Staff sees Accept/Decline, Management sees status */}
                                        {!isManager && shift.response === 'pending' ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => handleShiftResponse(shift.id, 'accepted')} style={{
                                                    padding: '6px 12px', borderRadius: 6,
                                                    background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)',
                                                    color: '#4ade80', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                }}><Check size={14} /> Accept</button>
                                                <button onClick={() => handleShiftResponse(shift.id, 'declined')} style={{
                                                    padding: '6px 12px', borderRadius: 6,
                                                    background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)',
                                                    color: '#ff4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                }}><X size={14} /> Decline</button>
                                                <button onClick={() => handleShiftResponse(shift.id, 'reschedule_requested')} style={{
                                                    padding: '6px 12px', borderRadius: 6,
                                                    background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.3)',
                                                    color: '#c084fc', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                }}><AlertTriangle size={14} /> Reschedule</button>
                                            </div>
                                        ) : (
                                            <span style={{
                                                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                                                background: resp.bg, color: resp.color,
                                                fontWeight: 500,
                                            }}>{resp.label}</span>
                                        )}
                                    </div>
                                </GlassCard>
                            </AnimatedCard>
                        );
                    })}
                </div>
            )}

            {/* ═══ TAB: Smart Schedule ═══ */}
            {activeTab === 'smart' && isManager && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    {/* Auto-generated pairings */}
                    <GlassCard neon="purple">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                            <h2 style={{
                                fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600,
                                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8,
                                textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}>
                                <Sparkles size={18} color="#c084fc" /> Proposed Pairings
                            </h2>
                            <span style={{
                                fontSize: 10, color: 'var(--text-muted)',
                                background: 'rgba(192, 132, 252, 0.08)',
                                padding: '3px 8px', borderRadius: 4,
                            }}>
                                Smart Scheduler · Greedy Heuristic
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {pairings.map(pair => (
                                <div key={pair.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                                    padding: 'var(--space-3) var(--space-4)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderRadius: 10,
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {pair.eventName}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                                            {pair.date}
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                            <span style={{ fontSize: 11, color: 'var(--neon-purple)' }}>🎧 {pair.djName}</span>
                                            <span style={{ fontSize: 11, color: 'var(--neon-pink)' }}>🎤 {pair.hostName}</span>
                                        </div>
                                    </div>
                                    {pair.status === 'proposed' ? (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => handlePairingDecision(pair.id, 'approved')} style={{
                                                padding: '6px 12px', borderRadius: 6,
                                                background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)',
                                                color: '#4ade80', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                            }}><Check size={14} /> Approve</button>
                                            <button onClick={() => handlePairingDecision(pair.id, 'rejected')} style={{
                                                padding: '6px 12px', borderRadius: 6,
                                                background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)',
                                                color: '#ff4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                            }}><X size={14} /> Reject</button>
                                        </div>
                                    ) : (
                                        <span style={{
                                            fontSize: 11, padding: '4px 10px', borderRadius: 6,
                                            background: pair.status === 'approved' ? 'rgba(74,222,128,0.1)' : 'rgba(255,68,68,0.1)',
                                            color: pair.status === 'approved' ? '#4ade80' : '#ff4444',
                                            fontWeight: 500,
                                        }}>
                                            {pair.status === 'approved' ? 'Approved' : 'Rejected'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Availability Overview */}
                    <GlassCard>
                        <h2 style={{
                            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600,
                            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8,
                            marginBottom: 'var(--space-4)',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            Staff Availability
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                            {MOCK_AVAILABILITY.map(avail => (
                                <div key={avail.id} style={{
                                    padding: 'var(--space-3)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderRadius: 8,
                                }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {avail.staffName}
                                    </div>
                                    <div style={{
                                        fontSize: 11, color: avail.role === 'dj' ? 'var(--neon-purple)' : 'var(--neon-pink)',
                                        textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
                                    }}>{avail.role}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                                        {avail.date} · {avail.startTime}–{avail.endTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            <AddShiftModal open={showAddModal} onClose={() => setShowAddModal(false)} />
        </div>
    );
}
