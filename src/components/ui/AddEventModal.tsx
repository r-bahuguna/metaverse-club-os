'use client';

import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Loader2, Save, Upload } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { AppUser } from '@/lib/types';
import { ROLE_CONFIG } from '@/lib/constants';

interface AddEventModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
    staffList: AppUser[];
}

export default function AddEventModal({ open, onClose, onSave, staffList }: AddEventModalProps) {
    const { appUser } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [imageUrl, setImageUrl] = useState(''); // Placeholder for now

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().setHours(new Date().getHours() + 2)));

    const [djId, setDjId] = useState('');
    const [hostId, setHostId] = useState('');

    const [recurring, setRecurring] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filter staff
    const djs = useMemo(() => staffList.filter(u => ['dj', 'manager', 'owner', 'super_admin'].includes(u.role)), [staffList]);
    const hosts = useMemo(() => staffList.filter(u => ['host', 'manager', 'owner', 'super_admin'].includes(u.role)), [staffList]);

    if (!open) return null;

    const handleSave = async () => {
        if (!appUser || !name) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'events'), {
                name,
                description,
                genre,
                imageUrl,
                date: startDate.toISOString().split('T')[0],
                startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                djId,
                djName: staffList.find(s => s.uid === djId)?.displayName || '',
                hostId,
                hostName: staffList.find(s => s.uid === hostId)?.displayName || '',
                isRecurring: recurring,
                createdBy: appUser.uid,
                createdAt: new Date().toISOString()
            });
            onSave?.();
            onClose();
        } catch (e) {
            console.error('Failed to save event', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                width: 600, maxWidth: '95%',
                background: 'rgba(15, 15, 30, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: 20, padding: 24,
                boxShadow: '0 0 40px rgba(0,0,0,0.5)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>Create New Event</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Event Name */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Event Name</label>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="e.g. Neon Nights Grand Opening"
                            style={{
                                width: '100%', padding: 12, borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white', fontSize: 14, outline: 'none'
                            }}
                        />
                    </div>

                    {/* Date/Time */}
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                        isRange={true}
                    />

                    {/* Description */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Description</label>
                        <textarea
                            value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the vibe..."
                            style={{
                                width: '100%', padding: 12, borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white', fontSize: 14, outline: 'none',
                                minHeight: 80, resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Genre & Image URL */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Genre</label>
                            <input
                                value={genre} onChange={e => setGenre(e.target.value)}
                                placeholder="e.g. Techno, House"
                                style={{
                                    width: '100%', padding: 12, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: 14, outline: 'none'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Image URL</label>
                            <input
                                value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                placeholder="https://..."
                                style={{
                                    width: '100%', padding: 12, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: 14, outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Staff Assignment */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>DJ</label>
                            <select
                                value={djId} onChange={e => setDjId(e.target.value)}
                                style={{
                                    width: '100%', padding: 12, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: 14, outline: 'none'
                                }}
                            >
                                <option value="">Select DJ...</option>
                                {djs.map(s => <option key={s.uid} value={s.uid}>{s.displayName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Host</label>
                            <select
                                value={hostId} onChange={e => setHostId(e.target.value)}
                                style={{
                                    width: '100%', padding: 12, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: 14, outline: 'none'
                                }}
                            >
                                <option value="">Select Host...</option>
                                {hosts.map(s => <option key={s.uid} value={s.uid}>{s.displayName}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Recurring Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="checkbox"
                            checked={recurring}
                            onChange={e => setRecurring(e.target.checked)}
                            style={{ width: 16, height: 16 }}
                        />
                        <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Recurring Event</label>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || !name}
                        style={{
                            width: '100%', padding: 12, borderRadius: 10,
                            background: 'var(--neon-cyan)', border: 'none',
                            color: 'black', fontWeight: 600, cursor: 'pointer',
                            marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            opacity: (saving || !name) ? 0.6 : 1
                        }}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Create Event
                    </button>
                </div>
            </div>
        </div>
    );
}
