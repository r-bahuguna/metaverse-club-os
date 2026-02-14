'use client';

import React, { useState, useEffect, useMemo } from 'react';
import WheelPicker from './WheelPicker';
import { ChevronRight, Calendar, Clock } from 'lucide-react';

interface DateRangePickerProps {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
    isRange?: boolean; // If false, only picks a single date/time (start)
    minuteInterval?: number;
}

// Helper to generate date options (e.g. next 30 days)
function getDateOptions(days = 30) {
    const options = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        let label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (i === 0) label = 'Today';
        if (i === 1) label = 'Tomorrow';

        // Value is ISO date string (YYYY-MM-DD)
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
    minuteInterval = 15
}: DateRangePickerProps) {
    const dateOptions = useMemo(() => getDateOptions(60), []);

    // Internal state handling for wheels
    const [startDay, setStartDay] = useState(startDate.toISOString().split('T')[0]);
    const [startHour, setStartHour] = useState(startDate.getHours().toString().padStart(2, '0'));
    const [startMinute, setStartMinute] = useState(startDate.getMinutes().toString().padStart(2, '0'));

    const [endDay, setEndDay] = useState(endDate.toISOString().split('T')[0]);
    const [endHour, setEndHour] = useState(endDate.getHours().toString().padStart(2, '0'));
    const [endMinute, setEndMinute] = useState(endDate.getMinutes().toString().padStart(2, '0'));

    // Sync from props if they change externally (optional, but good practice)
    useEffect(() => {
        setStartDay(startDate.toISOString().split('T')[0]);
        setStartHour(startDate.getHours().toString().padStart(2, '0'));
        setStartMinute(startDate.getMinutes().toString().padStart(2, '0'));

        setEndDay(endDate.toISOString().split('T')[0]);
        setEndHour(endDate.getHours().toString().padStart(2, '0'));
        setEndMinute(endDate.getMinutes().toString().padStart(2, '0'));
    }, [startDate, endDate]);

    // Emit changes
    const update = (
        sDay: string, sH: string, sM: string,
        eDay: string, eH: string, eM: string
    ) => {
        const newStart = new Date(`${sDay}T${sH}:${sM}:00`);
        const newEnd = new Date(`${eDay}T${eH}:${eM}:00`);
        onChange(newStart, newEnd);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Start Time Section */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: 12
            }}>
                <div style={{
                    fontSize: 12, color: 'var(--neon-cyan)',
                    marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6
                }}>
                    <Clock size={12} /> START TIME
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 2 }}>
                        <WheelPicker
                            items={dateOptions}
                            value={startDay}
                            onChange={(val) => {
                                setStartDay(val);
                                // Auto-update end day if it was same
                                let newEndDay = endDay;
                                if (endDay < val) newEndDay = val;
                                update(val, startHour, startMinute, newEndDay, endHour, endMinute);
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <WheelPicker
                            items={HOURS}
                            value={startHour}
                            onChange={(val) => {
                                setStartHour(val);
                                update(startDay, val, startMinute, endDay, endHour, endMinute);
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <WheelPicker
                            items={MINUTES}
                            value={startMinute}
                            onChange={(val) => {
                                setStartMinute(val);
                                update(startDay, startHour, val, endDay, endHour, endMinute);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* End Time Section (only if range) */}
            {isRange ? (
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: 12
                }}>
                    <div style={{
                        fontSize: 12, color: 'var(--neon-purple)',
                        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                        <Clock size={12} /> END TIME
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 2 }}>
                            <WheelPicker
                                items={dateOptions}
                                value={endDay}
                                onChange={(val) => {
                                    setEndDay(val);
                                    update(startDay, startHour, startMinute, val, endHour, endMinute);
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <WheelPicker
                                items={HOURS}
                                value={endHour}
                                onChange={(val) => {
                                    setEndHour(val);
                                    update(startDay, startHour, startMinute, endDay, val, endMinute);
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <WheelPicker
                                items={MINUTES}
                                value={endMinute}
                                onChange={(val) => {
                                    setEndMinute(val);
                                    update(startDay, startHour, startMinute, endDay, endHour, val);
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                    Duration: {((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)).toFixed(1)} hours
                </div>
            )}
        </div>
    );
}
