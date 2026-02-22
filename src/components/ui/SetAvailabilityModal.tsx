'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Calendar, Repeat } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Availability } from '@/lib/types';

interface SetAvailabilityModalProps {
    open: boolean;
    onClose: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SetAvailabilityModal({ open, onClose }: SetAvailabilityModalProps) {
    const { appUser } = useAuth();
    const [existing, setExisting] = useState<Availability[]>([]);
    const [loading, setLoading] = useState(true);

    // New entry form
    const [type, setType] = useState<'single' | 'recurring'>('recurring');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('20:00');
    const [endTime, setEndTime] = useState('02:00');
    const [recurringDays, setRecurringDays] = useState<number[]>([5, 6]); // Fri, Sat default
    const [genres, setGenres] = useState('');
    const [saving, setSaving] = useState(false);

    // Fetch existing availability
    useEffect(() => {
        if (!open || !appUser?.uid) return;
        setLoading(true);
        const fetchAvail = async () => {
            try {
                const q = query(collection(db, 'availability'), where('staffId', '==', appUser.uid));
                const snap = await getDocs(q);
                setExisting(snap.docs.map(d => ({ id: d.id, ...d.data() } as Availability)));
            } catch (err) {
                console.warn('[Availability] Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAvail();
    }, [open, appUser?.uid]);

    async function handleAdd() {
        if (!appUser) return;
        setSaving(true);
        try {
            const avail: Omit<Availability, 'id'> = {
                staffId: appUser.uid,
                staffName: appUser.displayName,
                role: appUser.role,
                type,
                date: type === 'single' ? date : '',
                startTime,
                endTime,
                ...(type === 'recurring' ? { recurringDays } : {}),
                ...(genres.trim() ? { preferredGenres: genres.split(',').map(g => g.trim()).filter(Boolean) } : {}),
                createdAt: new Date().toISOString(),
            };
            const docRef = await addDoc(collection(db, 'availability'), avail);
            setExisting(prev => [...prev, { id: docRef.id, ...avail } as Availability]);
            setDate(''); setGenres('');
        } catch (err) {
            console.error('[Availability] Save error:', err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteDoc(doc(db, 'availability', id));
            setExisting(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('[Availability] Delete error:', err);
        }
    }

    function toggleDay(day: number) {
        setRecurringDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    }

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose} title="My Availability">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Existing entries */}
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
                        Current Availability ({existing.length})
                    </label>
                    {loading ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>
                    ) : existing.length === 0 ? (
                        <div style={{
                            padding: 16, textAlign: 'center', borderRadius: 8,
                            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-muted)', fontSize: 12,
                        }}>
                            No availability set yet. Add your available times below.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {existing.map(a => (
                                <div key={a.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', borderRadius: 8,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                        {a.type === 'recurring' ? <Repeat size={13} style={{ color: 'var(--neon-cyan)' }} /> : <Calendar size={13} style={{ color: 'var(--neon-purple)' }} />}
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {a.type === 'recurring' ? a.recurringDays?.map(d => DAY_LABELS[d]).join(', ') : a.date}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.startTime}–{a.endTime}</span>
                                        {a.preferredGenres && a.preferredGenres.length > 0 && (
                                            <span style={{ fontSize: 10, color: 'var(--neon-pink)' }}>{a.preferredGenres.join(', ')}</span>
                                        )}
                                    </div>
                                    <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                {/* Add new */}
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
                        Add Availability
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {(['recurring', 'single'] as const).map(t => (
                            <button key={t} type="button" onClick={() => setType(t)} style={{
                                padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                                border: `1px solid ${type === t ? 'var(--neon-cyan)' : 'var(--glass-border)'}`,
                                background: type === t ? 'rgba(0,240,255,0.1)' : 'transparent',
                                color: type === t ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                cursor: 'pointer',
                            }}>
                                {t === 'recurring' ? '🔁 Weekly' : '📅 Specific Date'}
                            </button>
                        ))}
                    </div>

                    {type === 'recurring' && (
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Days</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {DAY_LABELS.map((label, i) => (
                                    <button key={i} type="button" onClick={() => toggleDay(i)} style={{
                                        width: 36, height: 36, borderRadius: 8, fontSize: 11, fontWeight: 600,
                                        border: `1px solid ${recurringDays.includes(i) ? 'var(--neon-cyan)' : 'var(--glass-border)'}`,
                                        background: recurringDays.includes(i) ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
                                        color: recurringDays.includes(i) ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                    }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {type === 'single' && (
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
                                width: '100%', padding: '8px 10px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                            }} />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Start Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{
                                width: '100%', padding: '8px 10px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                            }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>End Time</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{
                                width: '100%', padding: '8px 10px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                            }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Preferred Genres (optional, comma-separated)</label>
                        <input type="text" value={genres} onChange={e => setGenres(e.target.value)} placeholder="e.g. House, Techno, Trance" style={{
                            width: '100%', padding: '8px 10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                        }} />
                    </div>

                    <button onClick={handleAdd} disabled={saving || (type === 'single' && !date) || (type === 'recurring' && recurringDays.length === 0)} style={{
                        width: '100%', padding: 12, borderRadius: 10,
                        background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)',
                        color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: saving ? 0.6 : 1,
                    }}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {saving ? 'Saving...' : 'Add Availability'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
