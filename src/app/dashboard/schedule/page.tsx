'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Plus, Users, User, ArrowLeft, ArrowRight, Save, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import WheelPicker from '@/components/ui/WheelPicker';
import DateRangePicker from '@/components/ui/DateRangePicker';
import SetAvailabilityModal from '@/components/ui/SetAvailabilityModal';
import { Shift, SchedulePairing, ShiftResponse, ShiftStatus, UserRole, AppUser } from '@/lib/types';
import { ROLE_CONFIG } from '@/lib/constants';

/* ── Types for local state ── */
type ViewMode = 'grid' | 'responses' | 'smart' | 'my-schedule' | 'availability';

/* ── Helper: Get start of week (Sunday) ── */
function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getDayName(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatDate(date: Date) {
    return date.toISOString().split('T')[0];
}

/* ── Sub-components ── */
function WeekNavigator({ currentWeek, onPrev, onNext }: { currentWeek: Date, onPrev: () => void, onNext: () => void }) {
    const endOfWeek = addDays(currentWeek, 6);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <button onClick={onPrev} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}><ArrowLeft size={16} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                <Calendar size={14} color="var(--neon-cyan)" />
                <span>
                    {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
            </div>
            <button onClick={onNext} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}><ArrowRight size={16} /></button>
        </div>
    );
}

/* ── Add Shift Modal ── */
function AddShiftModal({
    open,
    onClose,
    onSave,
    staffList
}: {
    open: boolean;
    onClose: () => void;
    onSave: (shift: Partial<Shift>) => Promise<void>;
    staffList: AppUser[]
}) {
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().setHours(new Date().getHours() + 4)));
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Filter staff by role (DJ/Host/Manager)
    const eligibleStaff = useMemo(() => staffList.filter(u => ['dj', 'host', 'manager'].includes(u.role)), [staffList]);

    // When staff selected, auto-set role
    const selectedStaff = staffList.find(s => s.uid === selectedStaffId);

    async function handleSave() {
        if (!selectedStaffId) return;
        setSaving(true);
        try {
            await onSave({
                staffId: selectedStaffId,
                staffName: selectedStaff?.displayName || 'Unknown',
                role: (selectedStaff?.role as any) || 'dj',
                date: formatDate(startDate),
                startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                notes,
                status: 'active',
                response: 'pending'
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                width: 500, maxWidth: '95%',
                background: 'rgba(15, 15, 30, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: 20, padding: 24,
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>Schedule Shift</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Staff Picker */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Staff Member</label>
                        <select
                            value={selectedStaffId}
                            onChange={e => setSelectedStaffId(e.target.value)}
                            style={{
                                width: '100%', padding: 12, borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white', fontSize: 14, outline: 'none'
                            }}
                        >
                            <option value="">Select Staff...</option>
                            {eligibleStaff.map(s => (
                                <option key={s.uid} value={s.uid}>
                                    {s.displayName} ({ROLE_CONFIG[s.role]?.label || s.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date/Time Picker */}
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                        isRange={true}
                    />

                    {/* Notes */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Neon Nights Theme"
                            style={{
                                width: '100%', padding: 12, borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white', fontSize: 14, outline: 'none',
                                minHeight: 80, resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedStaffId || saving}
                            style={{
                                flex: 1, padding: 12, borderRadius: 10,
                                background: 'var(--neon-cyan)', border: 'none',
                                color: 'black', fontWeight: 600, cursor: 'pointer',
                                opacity: (!selectedStaffId || saving) ? 0.5 : 1
                            }}
                        >
                            {saving ? 'Scheduling...' : 'Create Shift'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page Component ── */
export default function SchedulePage() {
    const { appUser } = useAuth();
    const { can } = useRole();
    const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [staffList, setStaffList] = useState<AppUser[]>([]);
    const [availability, setAvailability] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

    // Determine default view based on role
    useEffect(() => {
        if (appUser && !can('manager')) {
            setViewMode('my-schedule');
        }
    }, [appUser, can]);

    /* ── Fetch Data ── */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch users for staff picker (if manager)
            if (can('manager')) {
                const usersSnap = await getDocs(query(collection(db, 'users')));
                const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
                setStaffList(users);
            }

            // Fetch shifts (real Firestore query)
            const shiftsSnap = await getDocs(collection(db, 'shifts'));
            const fetchedShifts = shiftsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Shift));
            setShifts(fetchedShifts);

            // Fetch availability (if staff view)
            if (!can('manager') && appUser) {
                const availSnap = await getDocs(query(collection(db, 'availability'), where('staffId', '==', appUser.uid)));
                const fetchedAvail = availSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setAvailability(fetchedAvail);
            }

        } catch (e) {
            console.error('Failed to fetch schedule data:', e);
        } finally {
            setLoading(false);
        }
    }, [can, appUser]);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ── Handlers ── */
    const handlePrevWeek = () => setCurrentWeek(prev => addDays(prev, -7));
    const handleNextWeek = () => setCurrentWeek(prev => addDays(prev, 7));

    const handleCreateShift = async (shiftData: Partial<Shift>) => {
        if (!appUser) return;

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'shifts'), {
            ...shiftData,
            createdBy: appUser.uid,
            createdAt: new Date().toISOString()
        });

        // Optimistic update
        const newShift = { id: docRef.id, ...shiftData } as Shift;
        setShifts(prev => [...prev, newShift]);
    };

    /* ── Render Grid ── */
    const renderGrid = () => {
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
        const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

        return (
            <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, minmax(140px, 1fr))', gap: 1 }}>
                    {/* Header Row */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: '8px 0 0 8px' }} />
                    {weekDays.map(d => {
                        const isToday = formatDate(d) === formatDate(new Date());
                        return (
                            <div key={d.toISOString()} style={{
                                background: isToday ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                                padding: '12px 6px', textAlign: 'center',
                                borderRadius: 6, marginBottom: 4,
                                border: isToday ? '1px solid rgba(0, 240, 255, 0.3)' : 'none'
                            }}>
                                <div style={{ fontSize: 11, color: isToday ? 'var(--neon-cyan)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{getDayName(d)}</div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{d.getDate()}</div>
                            </div>
                        );
                    })}

                    {/* Time Grid */}
                    {hours.map(h => {
                        const timeLabel = `${h.toString().padStart(2, '0')}:00`;
                        return (
                            <React.Fragment key={h}>
                                {/* Time Label */}
                                <div style={{
                                    padding: '10px 4px', fontSize: 11, color: 'var(--text-muted)',
                                    textAlign: 'right', marginTop: -10
                                }}>
                                    {timeLabel}
                                </div>

                                {/* Day Cells */}
                                {weekDays.map(day => {
                                    const dateStr = formatDate(day);
                                    // Find shifts for this cell
                                    const cellShifts = shifts.filter(s => {
                                        if (s.date !== dateStr) return false;
                                        const startH = parseInt(s.startTime.split(':')[0]);
                                        // Simple duration logic for display
                                        return startH === h;
                                    });

                                    return (
                                        <div key={day.toISOString() + h} style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            borderLeft: '1px solid rgba(255,255,255,0.03)',
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            minHeight: 50, position: 'relative'
                                        }}>
                                            {cellShifts.map(s => (
                                                <div key={s.id} style={{
                                                    position: 'absolute', top: 2, left: 2, right: 2,
                                                    background: ROLE_CONFIG[s.role]?.color ? `var(${ROLE_CONFIG[s.role].color})` : '#444',
                                                    padding: '4px 6px', borderRadius: 4,
                                                    fontSize: 11, color: 'black', fontWeight: 600,
                                                    zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                    cursor: 'pointer'
                                                }}>
                                                    {s.staffName}
                                                    <div style={{ fontSize: 9, opacity: 0.8 }}>{s.startTime} - {s.endTime}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header / Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Schedule</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage shifts and events</p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <WeekNavigator currentWeek={currentWeek} onPrev={handlePrevWeek} onNext={handleNextWeek} />

                    {can('manager') && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 10,
                                background: 'var(--neon-cyan)', border: 'none',
                                color: 'black', fontWeight: 600, fontSize: 13,
                                cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                            }}
                        >
                            <Plus size={16} /> Add Shift
                        </button>
                    )}
                </div>
            </div>

            {/* View Tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
                {can('manager') && (
                    <>
                        {['grid', 'responses', 'smart'].map(m => (
                            <button key={m}
                                onClick={() => setViewMode(m as ViewMode)}
                                style={{
                                    padding: '6px 16px', borderRadius: 8, border: 'none',
                                    background: viewMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: viewMode === m ? 'white' : 'var(--text-muted)',
                                    fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize'
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </>
                )}
                {!can('manager') && (
                    <>
                        {['my-schedule', 'availability'].map(m => (
                            <button key={m}
                                onClick={() => setViewMode(m as ViewMode)}
                                style={{
                                    padding: '6px 16px', borderRadius: 8, border: 'none',
                                    background: viewMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: viewMode === m ? 'white' : 'var(--text-muted)',
                                    fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize'
                                }}
                            >
                                {m.replace('-', ' ')}
                            </button>
                        ))}
                    </>
                )}
            </div>

            {/* Content Area */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule...</div>
            ) : (
                <GlassCard>
                    <div style={{ minHeight: 400 }}>
                        {viewMode === 'grid' && renderGrid()}
                        {viewMode === 'responses' && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Shift Responses UI Coming Soon</div>}
                        {viewMode === 'smart' && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Smart Scheduler UI Coming Soon</div>}
                        {viewMode === 'my-schedule' && (
                            <div style={{ padding: 20 }}>
                                <h3 style={{ marginBottom: 16 }}>My Upcoming Shifts</h3>
                                {shifts.filter(s => s.staffId === appUser?.uid).length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No shifts scheduled.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: 10 }}>
                                        {shifts.filter(s => s.staffId === appUser?.uid).map(s => (
                                            <div key={s.id} style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                                                <div style={{ fontWeight: 600 }}>{s.date} @ {s.startTime} - {s.endTime}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.role.toUpperCase()} • {s.notes || 'No notes'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {viewMode === 'availability' && (
                            <div style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3>My Availability</h3>
                                    <button
                                        onClick={() => setIsAvailabilityModalOpen(true)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '8px 16px', borderRadius: 8,
                                            background: 'var(--neon-cyan)', border: 'none',
                                            color: 'black', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                                        }}
                                    >
                                        <Plus size={16} /> Set Availability
                                    </button>
                                </div>
                                {availability.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No availability set.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: 10 }}>
                                        {availability.map(a => (
                                            <div key={a.id} style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {a.type === 'single' && a.startDate}
                                                        {a.type === 'range' && `${a.startDate} to ${a.endDate}`}
                                                        {a.type === 'recurring' && `Recurring: ${a.recurringDays.length} days/week`}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                        {a.startTime} - {a.endTime}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{a.type}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* Add Shift Modal */}
            <AddShiftModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleCreateShift}
                staffList={staffList}
            />

            {/* Set Availability Modal */}
            <SetAvailabilityModal
                open={isAvailabilityModalOpen}
                onClose={() => setIsAvailabilityModalOpen(false)}
                onSave={fetchData}
            />
        </div>
    );
}
