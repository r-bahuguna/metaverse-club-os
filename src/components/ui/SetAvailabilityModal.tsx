'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Loader2, Save } from 'lucide-react';
import WheelPicker from './WheelPicker';
import DateRangePicker from './DateRangePicker';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

interface SetAvailabilityModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export default function SetAvailabilityModal({ open, onClose, onSave }: SetAvailabilityModalProps) {
    const { appUser } = useAuth();
    const [mode, setMode] = useState<'single' | 'range' | 'recurring'>('single');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().setHours(new Date().getHours() + 4)));
    const [recurringDays, setRecurringDays] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const handleSave = async () => {
        if (!appUser) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'availability'), {
                staffId: appUser.uid,
                staffName: appUser.displayName,
                role: appUser.role,
                type: mode, // 'single', 'range', 'recurring'
                startDate: startDate.toISOString().split('T')[0],
                endDate: mode === 'range' ? endDate.toISOString().split('T')[0] : startDate.toISOString().split('T')[0],
                startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                recurringDays: mode === 'recurring' ? recurringDays : [],
                createdAt: new Date().toISOString()
            });
            onSave?.();
            onClose();
        } catch (e) {
            console.error('Failed to save availability', e);
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: number) => {
        setRecurringDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                width: 440, maxWidth: '95%',
                background: 'rgba(15, 15, 30, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: 20, padding: 24,
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>Set Availability</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Mode Selector */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10 }}>
                        {(['single', 'range', 'recurring'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                style={{
                                    flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                                    background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: mode === m ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                    fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize'
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    {/* Date/Time Pickers */}
                    {mode === 'recurring' ? (
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Days of Week</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleDay(i)}
                                        style={{
                                            width: 36, height: 36, borderRadius: 18, border: '1px solid var(--glass-border)',
                                            background: recurringDays.includes(i) ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.05)',
                                            color: recurringDays.includes(i) ? 'black' : 'var(--text-secondary)',
                                            fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <DateRangePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                                    isRange={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                            isRange={mode === 'range'}
                        />
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            width: '100%', padding: 12, borderRadius: 10,
                            background: 'var(--neon-cyan)', border: 'none',
                            color: 'black', fontWeight: 600, cursor: 'pointer',
                            marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Availability
                    </button>
                </div>
            </div>
        </div>
    );
}
