'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import WheelPicker from './WheelPicker';
import { Clock } from 'lucide-react';

interface DateRangePickerProps {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
    isRange?: boolean;
    minuteInterval?: number;
}

// Generate date options (next 60 days)
function getDateOptions(days = 60) {
    const options = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        let label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (i === 0) label = 'Today';
        if (i === 1) label = 'Tomorrow';

        const value = d.toISOString().split('T')[0];
        options.push({ label, value });
    }
    return options;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export default function DateRangePicker({
    startDate,
    endDate,
    onChange,
    isRange = false,
}: DateRangePickerProps) {
    const dateOptions = useMemo(() => getDateOptions(60), []);

    /* ── Internal state initialized from props ONCE (lazy initializer) ──
       No useEffect syncing — this eliminates the circular update bug.
       The wheels are "uncontrolled" internally, only calling onChange when the user scrolls. */
    const [startDay, setStartDay] = useState(() => startDate.toISOString().split('T')[0]);
    const [startHour, setStartHour] = useState(() => startDate.getHours().toString().padStart(2, '0'));
    const [startMinute, setStartMinute] = useState(() => {
        const m = startDate.getMinutes();
        // Snap to nearest 15-minute interval
        return (Math.round(m / 15) * 15 % 60).toString().padStart(2, '0');
    });

    const [endDay, setEndDay] = useState(() => endDate.toISOString().split('T')[0]);
    const [endHour, setEndHour] = useState(() => endDate.getHours().toString().padStart(2, '0'));
    const [endMinute, setEndMinute] = useState(() => {
        const m = endDate.getMinutes();
        return (Math.round(m / 15) * 15 % 60).toString().padStart(2, '0');
    });

    // Emit changes to parent — builds Date objects from internal state
    const emitChange = useCallback((
        sDay: string, sH: string, sM: string,
        eDay: string, eH: string, eM: string
    ) => {
        const newStart = new Date(`${sDay}T${sH}:${sM}:00`);
        const newEnd = new Date(`${eDay}T${eH}:${eM}:00`);
        // Only emit if dates are valid
        if (!isNaN(newStart.getTime()) && !isNaN(newEnd.getTime())) {
            onChange(newStart, newEnd);
        }
    }, [onChange]);

    /* ── Each wheel handler updates local state AND emits ── */
    const handleStartDay = useCallback((val: string) => {
        setStartDay(val);
        // If end day is before new start day, auto-advance end day
        const newEndDay = endDay < val ? val : endDay;
        if (newEndDay !== endDay) setEndDay(newEndDay);
        emitChange(val, startHour, startMinute, newEndDay, endHour, endMinute);
    }, [endDay, startHour, startMinute, endHour, endMinute, emitChange]);

    const handleStartHour = useCallback((val: string) => {
        setStartHour(val);
        emitChange(startDay, val, startMinute, endDay, endHour, endMinute);
    }, [startDay, startMinute, endDay, endHour, endMinute, emitChange]);

    const handleStartMinute = useCallback((val: string) => {
        setStartMinute(val);
        emitChange(startDay, startHour, val, endDay, endHour, endMinute);
    }, [startDay, startHour, endDay, endHour, endMinute, emitChange]);

    const handleEndDay = useCallback((val: string) => {
        setEndDay(val);
        emitChange(startDay, startHour, startMinute, val, endHour, endMinute);
    }, [startDay, startHour, startMinute, endHour, endMinute, emitChange]);

    const handleEndHour = useCallback((val: string) => {
        setEndHour(val);
        emitChange(startDay, startHour, startMinute, endDay, val, endMinute);
    }, [startDay, startHour, startMinute, endDay, endMinute, emitChange]);

    const handleEndMinute = useCallback((val: string) => {
        setEndMinute(val);
        emitChange(startDay, startHour, startMinute, endDay, endHour, val);
    }, [startDay, startHour, startMinute, endDay, endHour, emitChange]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Start Time Section */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: 12
            }}>
                <div style={{
                    fontSize: 11, color: 'var(--neon-cyan)', fontWeight: 600,
                    marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                    <Clock size={12} /> START
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 2 }}>
                        <WheelPicker items={dateOptions} value={startDay} onChange={handleStartDay} />
                    </div>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1 }}>
                        <WheelPicker items={HOURS} value={startHour} onChange={handleStartHour} />
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', color: 'var(--text-muted)',
                        fontSize: 16, fontWeight: 700, padding: '0 2px',
                    }}>:</div>
                    <div style={{ flex: 1 }}>
                        <WheelPicker items={MINUTES} value={startMinute} onChange={handleStartMinute} />
                    </div>
                </div>
            </div>

            {/* End Time Section (only if range) */}
            {isRange && (
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: 12
                }}>
                    <div style={{
                        fontSize: 11, color: 'var(--neon-purple)', fontWeight: 600,
                        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                        <Clock size={12} /> END
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ flex: 2 }}>
                            <WheelPicker items={dateOptions} value={endDay} onChange={handleEndDay} />
                        </div>
                        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ flex: 1 }}>
                            <WheelPicker items={HOURS} value={endHour} onChange={handleEndHour} />
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', color: 'var(--text-muted)',
                            fontSize: 16, fontWeight: 700, padding: '0 2px',
                        }}>:</div>
                        <div style={{ flex: 1 }}>
                            <WheelPicker items={MINUTES} value={endMinute} onChange={handleEndMinute} />
                        </div>
                    </div>
                </div>
            )}

            {/* Duration indicator */}
            {isRange && (
                <div style={{
                    textAlign: 'center', fontSize: 11, color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                }}>
                    Duration: {(() => {
                        const s = new Date(`${startDay}T${startHour}:${startMinute}:00`);
                        const e = new Date(`${endDay}T${endHour}:${endMinute}:00`);
                        let diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
                        if (diff < 0) diff += 24; // Wraps midnight
                        return diff.toFixed(1);
                    })()} hours
                </div>
            )}
        </div>
    );
}
