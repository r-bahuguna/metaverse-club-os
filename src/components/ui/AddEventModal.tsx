'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Loader2, Save, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import Modal from './Modal';
import DateRangePicker from './DateRangePicker';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { uploadEventImage } from '@/lib/storage';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { AppUser } from '@/lib/types';
import { ROLE_CONFIG } from '@/lib/constants';

interface AddEventModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
    staffList: AppUser[];
    eventToEdit?: any;
}

export default function AddEventModal({ open, onClose, onSave, staffList, eventToEdit }: AddEventModalProps) {
    const { appUser } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().setHours(new Date().getHours() + 2)));

    const [djId, setDjId] = useState('');
    const [hostId, setHostId] = useState('');

    const [recurring, setRecurring] = useState(false);
    const [createShifts, setCreateShifts] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Filter staff
    const djs = useMemo(() => staffList.filter(u => ['dj', 'manager', 'owner', 'super_admin'].includes(u.role)), [staffList]);
    const hosts = useMemo(() => staffList.filter(u => ['host', 'manager', 'owner', 'super_admin'].includes(u.role)), [staffList]);

    // Pre-fill for Edit Mode
    useEffect(() => {
        if (open && eventToEdit) {
            setName(eventToEdit.name);
            setDescription(eventToEdit.description);
            setGenre(eventToEdit.genre || '');
            setImageUrl(eventToEdit.imageUrl || '');
            setImagePreview(eventToEdit.imageUrl || null);
            setDjId(eventToEdit.djId || '');
            setHostId(eventToEdit.hostId || '');
            setRecurring(eventToEdit.isRecurring || false);

            // Reconstruct dates
            const start = new Date(`${eventToEdit.date}T${eventToEdit.startTime}`);
            if (!isNaN(start.getTime())) {
                setStartDate(start);
                if (eventToEdit.endTime) {
                    const [h, m] = eventToEdit.endTime.split(':');
                    const e = new Date(start);
                    e.setHours(parseInt(h), parseInt(m));
                    if (e < start) e.setDate(e.getDate() + 1);
                    setEndDate(e);
                }
            }
        } else if (open && !eventToEdit) {
            setName('');
            setDescription('');
            setGenre('');
            setImageUrl('');
            setImagePreview(null);
            setDjId('');
            setHostId('');
            setRecurring(false);
            setCreateShifts(false);
            setStartDate(new Date());
            setEndDate(new Date(new Date().setHours(new Date().getHours() + 2)));
        }
    }, [open, eventToEdit]);

    if (!open) return null;

    const handleSave = async () => {
        if (!appUser || !name) return;
        setSaving(true);
        try {
            // Upload image to Firebase Storage if a file was selected
            let finalImageUrl = imageUrl;
            if (imageFile) {
                const tempId = eventToEdit?.id || `evt_${Date.now()}`;
                finalImageUrl = await uploadEventImage(imageFile, tempId);
            }

            const eventData = {
                name,
                description,
                genre,
                imageUrl: finalImageUrl,
                date: startDate.toISOString().split('T')[0],
                startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                djId,
                djName: staffList.find(s => s.uid === djId)?.displayName || '',
                hostId,
                hostName: staffList.find(s => s.uid === hostId)?.displayName || '',
                isRecurring: recurring,
                status: eventToEdit?.status || 'scheduled',
                djResponse: djId ? 'pending' : undefined,
                hostResponse: hostId ? 'pending' : undefined,
                updatedAt: new Date().toISOString(),
                ...(eventToEdit ? {} : { createdBy: appUser.uid, createdAt: new Date().toISOString() })
            };

            if (eventToEdit) {
                await updateDoc(doc(db, 'events', eventToEdit.id), eventData);
            } else {
                await addDoc(collection(db, 'events'), eventData);
            }

            // Create Shifts if requested (and not editing)
            if (createShifts && !eventToEdit) {
                const commonShiftData = {
                    date: eventData.date,
                    startTime: eventData.startTime,
                    endTime: eventData.endTime,
                    status: 'active',
                    response: 'pending',
                    notes: `Event: ${name}`,
                    createdBy: appUser.uid,
                    createdAt: new Date().toISOString()
                };

                if (djId) {
                    await addDoc(collection(db, 'shifts'), {
                        ...commonShiftData,
                        staffId: djId,
                        staffName: eventData.djName,
                        role: 'dj'
                    });
                }
                if (hostId) {
                    await addDoc(collection(db, 'shifts'), {
                        ...commonShiftData,
                        staffId: hostId,
                        staffName: eventData.hostName,
                        role: 'host'
                    });
                }
            }

            onSave?.();
            onClose();
        } catch (e) {
            console.error('Failed to save event', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={eventToEdit ? 'Edit Event' : 'Create New Event'}>
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

                {/* Genre & Image */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Event Image</label>
                        {imagePreview ? (
                            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                <img src={imagePreview} alt="Event preview" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                                <button onClick={() => { setImageUrl(''); setImagePreview(null); }} style={{
                                    position: 'absolute', top: 6, right: 6,
                                    width: 24, height: 24, borderRadius: 6,
                                    background: 'rgba(0,0,0,0.7)', border: 'none',
                                    color: '#ff6b6b', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => fileInputRef.current?.click()} style={{
                                    flex: 1, padding: 12, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px dashed rgba(255,255,255,0.15)',
                                    color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}>
                                    <Upload size={14} /> Upload Image
                                </button>
                                <input
                                    value={imageUrl} onChange={e => { setImageUrl(e.target.value); if (e.target.value) setImagePreview(e.target.value); }}
                                    placeholder="or paste URL"
                                    style={{
                                        flex: 1, padding: 12, borderRadius: 10,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white', fontSize: 12, outline: 'none'
                                    }}
                                />
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            style={{ display: 'none' }}
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    alert('Image must be under 5MB');
                                    return;
                                }
                                setImageFile(file);
                                // Show local preview
                                const url = URL.createObjectURL(file);
                                setImagePreview(url);
                                setImageUrl(''); // Will be set after upload
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

                {/* Recurring & Shift Creation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="checkbox"
                            checked={recurring}
                            onChange={e => setRecurring(e.target.checked)}
                            style={{ width: 16, height: 16 }}
                        />
                        <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Recurring Event</label>
                    </div>

                    {!eventToEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="checkbox"
                                checked={createShifts}
                                onChange={e => setCreateShifts(e.target.checked)}
                                // Disable if no staff selected
                                disabled={!djId && !hostId}
                                style={{ width: 16, height: 16 }}
                            />
                            <label style={{ fontSize: 14, color: (!djId && !hostId) ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                                Automatically create shifts for DJ/Host
                            </label>
                        </div>
                    )}
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
                    {eventToEdit ? 'Update Event' : 'Create Event'}
                </button>
            </div>
        </Modal>
    );
}

