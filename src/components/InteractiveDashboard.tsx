'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
    Headphones, Mic, Users, Clock,
    UserPlus, Activity,
    CalendarDays, TrendingUp, Bell,
    Play, Pause, Volume2, Heart,
    DollarSign, Zap, Maximize2, Minimize2,
    Settings, FileText, BarChart2, Calendar, LogOut
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useRole } from '@/hooks/useRole';
import { RoleToggle } from '@/components/RoleToggle';
import { ClubEvent } from '@/lib/types';
import {
    MOCK_DASHBOARD_STATS,
    MOCK_TIPS,
    MOCK_TIP_HISTORY,
    MOCK_DJ_BOOTH,
    MOCK_HOST_STATION,
    MOCK_STAFF_FEED,
    MOCK_GUEST_VISITS,
    MOCK_EVENTS,
} from '@/lib/mock-data';
import DemoScheduleView from './demo/DemoSchedule';
import DemoStaffView from './demo/DemoStaff';
import DemoEventsView from './demo/DemoEvents';
import DemoAnalyticsView from './demo/DemoAnalytics';
import DemoSettingsView from './demo/DemoSettings';
import DemoLogsView from './demo/DemoLogs';
import DemoApplyView from './demo/DemoApply';
import styles from './InteractiveDashboard.module.css';

/* ── Client-only time formatting (avoids hydration mismatch) ── */
function useTimeAgo(timestamp: string): string {
    const [label, setLabel] = useState('');
    useEffect(() => {
        function update() {
            const diff = Date.now() - new Date(timestamp).getTime();
            const mins = Math.round(diff / 60000);
            setLabel(mins < 1 ? 'now' : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`);
        }
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [timestamp]);
    return label;
}

function TimeAgo({ timestamp }: { timestamp: string }) {
    const label = useTimeAgo(timestamp);
    return <span className={styles.timeAgo}>{label}</span>;
}

function FeedTimeAgo({ timestamp }: { timestamp: string }) {
    const label = useTimeAgo(timestamp);
    return <span className={styles.feedTime}>{label}</span>;
}

function formatDate(dateStr: string): { day: string; month: string } {
    const d = new Date(dateStr);
    return {
        day: d.getDate().toString(),
        month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
        <div style={{
            background: 'rgba(10, 10, 20, 0.92)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{label}</div>
            {payload.map((entry: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
                    {entry.name}: L${entry.value.toLocaleString()}
                </div>
            ))}
        </div>
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Waveform bars heights ── */
const WAVE_HEIGHTS = [60, 80, 45, 90, 70, 55, 85, 40, 75, 95, 50, 65, 88, 42, 78, 58];

/* ── Tip Button ── */
function TipButton({ label, neonColor, icon: Icon }: { label: string; neonColor: string; icon: React.ElementType }) {
    const [tipped, setTipped] = useState(false);

    function handleTip() {
        setTipped(true);
        setTimeout(() => setTipped(false), 2000);
    }

    return (
        <button
            onClick={handleTip}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: tipped
                    ? `linear-gradient(135deg, ${neonColor}33, ${neonColor}22)`
                    : `rgba(255,255,255,0.03)`,
                border: `1px solid ${tipped ? neonColor + '55' : 'rgba(255,255,255,0.06)'}`,
                color: tipped ? neonColor : 'rgba(255,255,255,0.5)',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
            }}
        >
            <Icon size={13} />
            {tipped ? '❤️ Tipped!' : label}
        </button>
    );
}

/* ── Upcoming Events from Mock Data ── */
function MyShiftsSection({ role }: { role: string }) {
    const shifts = [
        { date: 'Today', time: '20:00 - 22:00', status: 'pending', name: 'Neon Nights Weekender' },
        { date: 'Tomorrow', time: '18:00 - 20:00', status: 'accepted', name: 'Sunset Chill' },
        { date: 'Saturday', time: '22:00 - 00:00', status: 'reschedule', name: 'Cyberpunk Rave' },
    ];

    return (
        <>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>My Upcoming Shifts</h2>
                <span className={styles.sectionBadge}>{shifts.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shifts.map((s, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.date} • {s.time}</div>
                        </div>
                        {s.status === 'pending' && <StatusBadge variant="away" pulse={false} />}
                        {s.status === 'accepted' && <StatusBadge variant="online" pulse={false} />}
                        {s.status === 'reschedule' && <StatusBadge variant="offline" pulse={false} />}
                    </div>
                ))}
            </div>
            <button style={{
                width: '100%', marginTop: 12, padding: '8px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
                Manage Availability
            </button>
        </>
    );
}

function UpcomingEventsSection() {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = MOCK_EVENTS.filter(e => e.date >= today && e.status !== 'cancelled').slice(0, 8);
    // Fallback if mock events are all in the past
    const displayEvents = upcoming.length > 0 ? upcoming : MOCK_EVENTS.slice(0, 8);
    const [events] = useState<ClubEvent[]>(displayEvents);
    const loading = false;

    return (
        <>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Upcoming</h2>
                <span className={styles.sectionBadge}>{events.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>
                ) : events.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No upcoming events scheduled.</div>
                ) : (
                    events.map(event => {
                        const { day, month } = formatDate(event.date);
                        const isEvent = event.type === 'event' || (event.type !== 'schedule' && event.status !== 'draft');
                        const hasImage = !!event.imageUrl;
                        return (
                            <div key={event.id} style={{
                                display: 'flex', gap: 12, padding: hasImage ? 0 : '10px 12px',
                                borderRadius: 12, overflow: 'hidden',
                                background: hasImage ? 'transparent' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isEvent && hasImage ? 'rgba(192,132,252,0.25)' : 'rgba(255,255,255,0.04)'}`,
                                position: 'relative',
                                ...(isEvent && hasImage ? {
                                    boxShadow: '0 0 15px rgba(192,132,252,0.1), 0 0 30px rgba(0,240,255,0.05)',
                                } : {}),
                                transition: 'border-color 0.3s ease',
                            }}>
                                {/* Image background for events with images */}
                                {hasImage && (
                                    <div style={{
                                        position: 'absolute', inset: 0, zIndex: 0,
                                        background: `url(${event.imageUrl}) center/cover`,
                                    }}>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(90deg, rgba(10,10,20,0.92) 55%, rgba(10,10,20,0.6) 100%)',
                                        }} />
                                    </div>
                                )}

                                {/* Content */}
                                <div style={{
                                    display: 'flex', gap: 12, padding: hasImage ? '10px 12px' : 0,
                                    position: 'relative', zIndex: 1, flex: 1, minWidth: 0,
                                }}>
                                    {/* Date badge */}
                                    <div style={{
                                        minWidth: 38, textAlign: 'center', flexShrink: 0,
                                        padding: '4px 0',
                                    }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: isEvent ? 'var(--neon-purple)' : 'var(--text-secondary)', lineHeight: 1 }}>{day}</div>
                                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>{month}</div>
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 600,
                                            color: isEvent ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {event.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {event.startTime}–{event.endTime}
                                            {event.genre && <span style={{ marginLeft: 6, color: 'var(--neon-pink)', fontSize: 10 }}>· {event.genre}</span>}
                                        </div>
                                        {event.description && (
                                            <div style={{
                                                fontSize: 11, color: 'rgba(255,255,255,0.35)',
                                                marginTop: 2, overflow: 'hidden',
                                                display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                                            }}>
                                                {event.description}
                                            </div>
                                        )}
                                        {/* DJ / Host */}
                                        {(event.djName || event.hostName) && (
                                            <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 10, color: 'var(--text-muted)' }}>
                                                {event.djName && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>🎧 {event.djName}</span>}
                                                {event.hostName && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>🎤 {event.hostName}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}

function DashboardView() {
    const { role, can, isGuest } = useRole();
    const stats = MOCK_DASHBOARD_STATS;
    const dj = MOCK_DJ_BOOTH;
    const host = MOCK_HOST_STATION;
    const capacityPct = Math.round((stats.currentGuests / stats.maxCapacity) * 100);
    const capacityColor = capacityPct > 85 ? '#ff4444' : capacityPct > 60 ? '#fbbf24' : '#4ade80';

    /* Guest = anonymous user → restricted view */

    /* ── Stream Player State ── */
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [volume, setVolume] = useState(0.7);

    function toggleStream() {
        if (!audioRef.current) {
            audioRef.current = new Audio(dj.streamUrl);
            audioRef.current.volume = volume;
        }
        if (isStreaming) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
            setIsStreaming(false);
        } else {
            audioRef.current.src = dj.streamUrl;
            audioRef.current.play().catch(() => { });
            setIsStreaming(true);
        }
    }

    function handleVolume(v: number) {
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    }

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    return (
        <div className={styles.dashboard}>
            {/* ═══ LIVE FLOOR — DJ Booth + Host Station ═══ */}
            <div className={styles.liveFloorGrid}>
                {/* DJ Booth */}
                <div className={`${styles.stationTile} ${styles.stationDj}`}>
                    <div className={styles.stationHeader}>
                        <div className={`${styles.stationIcon} ${styles.stationIconDj}`}>
                            <Headphones size={18} />
                        </div>
                        <span className={styles.stationLabel}>DJ Booth</span>
                        {dj.isLive && (
                            <div className={styles.stationStatus}>
                                <div className={styles.liveDot} />
                                <span className={styles.liveTag}>Live</span>
                            </div>
                        )}
                    </div>
                    <div className={styles.djInfo}>
                        <div className={styles.djName}>DJ: {dj.djName.replace('DJ ', '')}</div>
                        <div className={styles.djMeta}>
                            <span><span className={styles.djMetaLabel}>Genre:</span> {dj.genre}</span>
                            <span className={styles.djTrack}>Current Track: {dj.currentTrack}</span>
                        </div>
                    </div>
                    <div className={styles.waveform}>
                        {WAVE_HEIGHTS.map((h, i) => (
                            <div
                                key={i}
                                className={styles.waveBar}
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                    {/* Stream Player */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8,
                        background: isStreaming ? 'rgba(0, 240, 255, 0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isStreaming ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.04)'}`,
                        margin: '8px 0 4px',
                        transition: 'all 0.3s ease',
                    }}>
                        <button
                            onClick={toggleStream}
                            style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: isStreaming
                                    ? 'linear-gradient(135deg, #00f0ff, #c084fc)'
                                    : 'rgba(255,255,255,0.06)',
                                border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: isStreaming ? '0 0 12px rgba(0, 240, 255, 0.3)' : 'none',
                            }}
                        >
                            {isStreaming ? <Pause size={14} color="#fff" /> : <Play size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} />}
                        </button>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isStreaming ? '#00f0ff' : 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
                                {isStreaming ? '♫ STREAMING LIVE' : 'LISTEN LIVE'}
                            </span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{dj.streamUrl}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Volume2 size={13} color="rgba(255,255,255,0.3)" />
                            <input
                                type="range" min={0} max={1} step={0.01}
                                value={volume}
                                onChange={e => handleVolume(Number(e.target.value))}
                                style={{ width: 60, accentColor: '#00f0ff', cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                    {/* DJ Tips + Tip Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <div className={styles.djTips}>
                            Tips: L${dj.tipsThisSession.toLocaleString()}
                        </div>
                        <TipButton label="Tip DJ" neonColor="#c084fc" icon={Heart} />
                    </div>
                </div>

                {/* Host Station */}
                <div className={`${styles.stationTile} ${styles.stationHost}`}>
                    <div className={styles.stationHeader}>
                        <div className={`${styles.stationIcon} ${styles.stationIconHost}`}>
                            <Mic size={18} />
                        </div>
                        <span className={styles.stationLabel}>Host Station</span>
                        <div className={styles.stationStatus}>
                            <div className={styles.liveDot} />
                            <span className={styles.liveTag}>{host.status}</span>
                        </div>
                    </div>
                    <div className={styles.hostInfo}>
                        <div className={styles.hostName}>Host: {host.hostName}</div>
                        <div className={styles.hostMeta}>Status: {host.status === 'active' ? 'Active' : 'On Break'}</div>
                    </div>
                    <div className={styles.hostStats}>
                        <div className={styles.hostStatItem}>
                            <span className={styles.hostStatValue}>{host.guestsGreeted}</span>
                            <span className={styles.hostStatLabel}>Greeted</span>
                        </div>
                        <div className={styles.hostStatItem}>
                            <span className={styles.hostStatValue}>{stats.currentGuests}</span>
                            <span className={styles.hostStatLabel}>Current</span>
                        </div>
                        <div className={styles.hostStatItem}>
                            <span className={styles.hostStatValue}>{stats.newMembersThisEvent}</span>
                            <span className={styles.hostStatLabel}>New</span>
                        </div>
                    </div>
                    {/* Host Actions + Tip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        {can('host') && (
                            <>
                                <button className={`${styles.hostBtn} ${styles.hostBtnPrimary}`}>Send Message</button>
                                <button className={`${styles.hostBtn} ${styles.hostBtnSecondary}`}>View Profile</button>
                            </>
                        )}
                        <TipButton label="Tip Host" neonColor="#ff6b9d" icon={Heart} />
                    </div>
                </div>
            </div>

            {/* ═══ CLUB TIP — for guests to tip the club directly ═══ */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(0, 240, 255, 0.03)',
                border: '1px solid rgba(0, 240, 255, 0.08)',
                margin: '4px 0 8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(192, 132, 252, 0.12))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={16} color="#00f0ff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                            Your Club
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                            Support the club • Club tip jar: L${stats.tipsClub.toLocaleString()} tonight
                        </div>
                    </div>
                </div>
                <TipButton label="Tip Club" neonColor="#00f0ff" icon={DollarSign} />
            </div>

            {/* ═══ MAIN GRID: Vibe Graph + Real-Time Stats ═══ */}
            {/* Manager+ sections are hidden from guests */}
            <div className={styles.mainGrid}>
                {/* Left Column */}
                <div className={styles.leftCol}>
                    {/* Vibe Graph — managers only */}
                    {!isGuest && can('manager') && (
                        <GlassCard neon="purple">
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Vibe Graph</h2>
                                <span className={styles.sectionBadge}>tonight</span>
                            </div>
                            <div className={styles.vibeGraphWrapper}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={MOCK_TIP_HISTORY} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                        <defs>
                                            <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#c084fc" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradPink" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ff6b9d" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#ff6b9d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis
                                            dataKey="time"
                                            stroke="rgba(255,255,255,0.15)"
                                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="rgba(255,255,255,0.15)"
                                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => `${v / 1000}k`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="club" name="Club" stroke="#00f0ff" strokeWidth={2} fill="url(#gradCyan)" />
                                        <Area type="monotone" dataKey="dj" name="DJ" stroke="#c084fc" strokeWidth={2} fill="url(#gradPurple)" />
                                        <Area type="monotone" dataKey="host" name="Host" stroke="#ff6b9d" strokeWidth={2} fill="url(#gradPink)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    )}

                    {/* Upcoming Events / Shifts */}
                    {(role === 'dj' || role === 'host') ? (
                        <GlassCard>
                            <MyShiftsSection role={role} />
                        </GlassCard>
                    ) : (
                        <GlassCard>
                            <UpcomingEventsSection />
                        </GlassCard>
                    )}

                </div>

                {/* Right Column — Real-Time Stats (staff only) */}
                <div className={styles.rightCol}>
                    {can('host') && (
                        <GlassCard neon="cyan">
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>
                                    <StatusBadge variant="online" pulse />
                                    Real-Time Stats
                                </h2>
                            </div>

                            {/* Capacity + Avg Spend */}
                            <div className={styles.statsPanel}>
                                <div className={styles.statTile}>
                                    <div className={styles.statValue}>
                                        {stats.currentGuests}<span className={styles.statValueSmall}> / {stats.maxCapacity}</span>
                                    </div>
                                    <div className={styles.statLabel}>Current Guests</div>
                                    <div className={styles.capacityBar}>
                                        <div
                                            className={styles.capacityFill}
                                            style={{ width: `${capacityPct}%`, background: capacityColor }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.statTile}>
                                    <div className={styles.statValue}>
                                        L${stats.avgSpendPerGuest}
                                    </div>
                                    <div className={styles.statLabel}>Avg Spend / Guest</div>
                                </div>
                            </div>

                            {/* Tips Breakdown */}
                            <div className={styles.tipsBreakdown}>
                                <svg width="52" height="52" viewBox="0 0 52 52">
                                    {(() => {
                                        const total = stats.tipsClub + stats.tipsHost + stats.tipsDj;
                                        const r = 20; const c = 2 * Math.PI * r;
                                        const pClub = stats.tipsClub / total;
                                        const pHost = stats.tipsHost / total;
                                        const pDj = stats.tipsDj / total;
                                        return (
                                            <g transform="translate(26,26)">
                                                <circle r={r} fill="none" stroke="#00f0ff" strokeWidth="5"
                                                    strokeDasharray={`${pClub * c} ${c}`}
                                                    strokeDashoffset="0"
                                                    transform="rotate(-90)"
                                                />
                                                <circle r={r} fill="none" stroke="#ff6b9d" strokeWidth="5"
                                                    strokeDasharray={`${pHost * c} ${c}`}
                                                    strokeDashoffset={`${-(pClub) * c}`}
                                                    transform="rotate(-90)"
                                                />
                                                <circle r={r} fill="none" stroke="#c084fc" strokeWidth="5"
                                                    strokeDasharray={`${pDj * c} ${c}`}
                                                    strokeDashoffset={`${-(pClub + pHost) * c}`}
                                                    transform="rotate(-90)"
                                                />
                                            </g>
                                        );
                                    })()}
                                </svg>
                                <div className={styles.tipsLegend}>
                                    <div className={styles.tipsLegendItem}>
                                        <span className={styles.tipsLegendDot} style={{ background: '#00f0ff' }} />
                                        Club
                                        <span className={styles.tipsLegendValue}>L${stats.tipsClub.toLocaleString()}</span>
                                    </div>
                                    <div className={styles.tipsLegendItem}>
                                        <span className={styles.tipsLegendDot} style={{ background: '#ff6b9d' }} />
                                        Host
                                        <span className={styles.tipsLegendValue}>L${stats.tipsHost.toLocaleString()}</span>
                                    </div>
                                    <div className={styles.tipsLegendItem}>
                                        <span className={styles.tipsLegendDot} style={{ background: '#c084fc' }} />
                                        DJ
                                        <span className={styles.tipsLegendValue}>L${stats.tipsDj.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Group Stats */}
                            <div style={{ marginTop: 'var(--space-3)' }}>
                                <div className={styles.groupStats}>
                                    <div className={styles.groupStatRow}>
                                        <span><Users size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />Members Joined</span>
                                        <span className={styles.groupStatValue}>{stats.groupMembersJoined}</span>
                                    </div>
                                    <div className={styles.groupStatRow}>
                                        <span><Activity size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />Online (not joined)</span>
                                        <span className={styles.groupStatValue}>{stats.groupMembersOnline}</span>
                                    </div>
                                    <div className={styles.groupStatRow}>
                                        <span><UserPlus size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />New Members</span>
                                        <span className={styles.groupStatValue}>{stats.newMembersThisEvent}</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* Guest Activity — staff only */}
                    {can('host') && (
                        <GlassCard>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Guest Activity</h2>
                                <span className={styles.sectionBadge}>{MOCK_GUEST_VISITS.length}</span>
                            </div>
                            <div className={styles.guestList}>
                                {MOCK_GUEST_VISITS.map(g => (
                                    <div key={g.id} className={styles.guestItem}>
                                        <span className={styles.guestName}>{g.name}</span>
                                        {g.isNewMember && <span className={styles.guestNew}>new</span>}
                                        <span className={styles.guestDuration}>
                                            <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                                            {g.duration}m
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {/* Tip Feed — managers only */}
                    {can('manager') && (
                        <GlassCard neon="green">
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Tip Feed</h2>
                                <span className={styles.sectionBadge}>live</span>
                            </div>
                            <div className={styles.tipFeed}>
                                {MOCK_TIPS.map(tip => (
                                    <div key={tip.id} className={styles.tipItem}>
                                        <span className={styles.tipAmount}>L${tip.amount.toLocaleString()}</span>
                                        <span>{tip.tipperName} → {tip.recipientName}</span>
                                        <TimeAgo timestamp={tip.timestamp} />
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>

            {/* ═══ STAFF FEED — Staff only ═══ */}
            {can('host') && (
                <GlassCard>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Staff Feed</h2>
                        <span className={styles.sectionBadge}>{MOCK_STAFF_FEED.length}</span>
                    </div>
                    <div className={styles.staffFeed}>
                        {MOCK_STAFF_FEED.map(msg => (
                            <div key={msg.id} className={styles.feedItem}>
                                <span className={`${styles.feedBadge} ${msg.type === 'alert' ? styles.feedBadgeAlert :
                                    msg.type === 'message' ? styles.feedBadgeMessage :
                                        styles.feedBadgeSystem
                                    }`}>
                                    {msg.type}
                                </span>
                                <div className={styles.feedContent}>
                                    <div className={styles.feedText}>{msg.message}</div>
                                    <FeedTimeAgo timestamp={msg.timestamp} />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}

export default function InteractiveDashboard() {
    const { role, isGuest } = useRole();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Mock Notifications based on role
    const getNotifications = () => {
        if (isGuest) return [];
        if (role === 'dj' || role === 'host') {
            return [
                { id: 1, title: 'Shift Confirmed', desc: 'Your 22:00 shift tonight was accepted.', time: '2h ago', unread: true },
                { id: 2, title: 'Shift Awaiting Approval', desc: 'Please confirm availability for Saturday.', time: '5h ago', unread: true },
            ];
        }
        if (role === 'manager' || role === 'owner' || role === 'super_admin') {
            return [
                { id: 1, title: 'Roster Alert', desc: 'Missing DJ for tomorrow 20:00.', time: '10m ago', unread: true },
                { id: 2, title: 'Security', desc: 'Warning: Linkset data delay detected.', time: '1h ago', unread: true },
            ];
        }
        return [];
    };

    const notifications = getNotifications();

    const tabs = [
        { id: 'Dashboard', icon: Activity },
        { id: 'Schedule', icon: Calendar },
        { id: 'Staff', icon: Users },
        { id: 'Events', icon: CalendarDays },
        { id: 'Apply', icon: FileText },
        { id: 'Analytics', icon: BarChart2 },
        { id: 'Settings', icon: Settings },
        { id: 'Logs', icon: FileText },
    ];

    const renderView = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardView />;
            case 'Schedule': return <DemoScheduleView />;
            case 'Staff': return <DemoStaffView />;
            case 'Events': return <DemoEventsView />;
            case 'Apply': return <DemoApplyView />;
            case 'Analytics': return <DemoAnalyticsView />;
            case 'Settings': return <DemoSettingsView />;
            case 'Logs': return <DemoLogsView />;
            default: return <DashboardView />;
        }
    };

    const DASH_RESPONSIVE = `
        @media (max-width: 768px) {
            /* Hamburger visible on mobile */
            .mc-dash-hamburger { display: flex !important; }
            .mc-dash-title { display: none !important; }

            /* Sidebar slides in from left */
            .mc-dash-sidebar {
                position: absolute !important; top: 0; bottom: 0; left: 0;
                z-index: 50; transform: translateX(-100%); transition: transform 0.25s ease;
                width: 240px !important;
                background: rgba(10,10,20,0.98) !important;
                backdrop-filter: blur(20px);
            }
            .mc-dash-sidebar.mc-dash-sidebar-open { transform: translateX(0); }

            /* Topbar — compact spacing */
            .mc-dash-topbar-right { gap: 8px !important; }
            .mc-dash-topbar-right > div,
            .mc-dash-topbar-right > button { flex-shrink: 0; }

            /* Notification dropdown — full width on mobile */
            .mc-dash-notifications {
                position: fixed !important;
                top: 48px !important; left: 8px !important; right: 8px !important;
                width: auto !important;
                max-height: 60vh !important;
                margin-top: 0 !important;
                z-index: 200 !important;
            }

            /* Content area padding */
            .mc-dash-content { padding: 16px !important; }

            /* Dashboard main grid — single column */
            .mc-dash-content .liveFloorGrid,
            .mc-dash-content > div > div[style*="grid-template-columns"] {
                grid-template-columns: 1fr !important;
            }

            /* Stats panel — 2 columns stays OK but reduce padding */
            .mc-dash-content .statsPanel { gap: 8px !important; }
            .mc-dash-content .statTile { padding: 12px !important; }
            .mc-dash-content .statValue { font-size: 20px !important; }

            /* Staff feed items — narrower */
            .mc-dash-content .feedItem { min-width: 220px !important; }

            /* Event cards — stack vertically */
            .mc-dash-content .eventCard { flex-direction: column; align-items: flex-start !important; }

            /* Demo sub-view tables and grids */
            .mc-dash-content table { font-size: 12px !important; }
            .mc-dash-content table th,
            .mc-dash-content table td { padding: 8px 6px !important; white-space: nowrap; }

            /* Tip breakdown chart — shorter */
            .mc-dash-content .vibeGraphWrapper { height: 180px !important; }

            /* Host action buttons — wrap nicely */
            .mc-dash-content .hostActions { flex-wrap: wrap !important; }

            /* All section headers — smaller font */
            .mc-dash-content .sectionTitle { font-size: 13px !important; letter-spacing: 0.04em !important; }
        }
    `;

    return (
        <>
            <style>{DASH_RESPONSIVE}</style>
            <div id="demo" style={{
                padding: isFullscreen ? 0 : 'max(24px, 5vh) 24px',
                position: isFullscreen ? 'fixed' : 'relative',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: isFullscreen ? 99999 : 1,
                background: isFullscreen ? 'var(--bg-void)' : 'transparent',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                transition: 'all 0.3s ease'
            }}>
                <div style={{
                    width: '100%', maxWidth: isFullscreen ? '100%' : 1400,
                    height: isFullscreen ? '100vh' : 'calc(100vh - max(48px, 10vh))',
                    minHeight: isFullscreen ? '100vh' : 500,
                    maxHeight: isFullscreen ? 'none' : 900,
                    background: 'rgba(10, 10, 20, 0.8)',
                    backdropFilter: 'blur(30px)',
                    borderRadius: isFullscreen ? 0 : 24,
                    border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: isFullscreen ? 'none' : '0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{
                        height: 48, background: 'rgba(0,0,0,0.4)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen" style={{ display: 'flex', gap: 8, cursor: 'pointer' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f56' }} />
                                <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ffbd2e' }} />
                                <div style={{ width: 12, height: 12, borderRadius: 6, background: '#27c93f' }} />
                            </div>
                            {/* Hamburger — visible only on mobile */}
                            <button
                                className="mc-dash-hamburger"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                style={{
                                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer', padding: 4, display: 'none', alignItems: 'center',
                                    fontSize: 20, lineHeight: 1,
                                }}
                                title={sidebarOpen ? 'Close menu' : 'Open menu'}
                            >
                                {sidebarOpen ? '✕' : '☰'}
                            </button>
                        </div>
                        <div className="mc-dash-title" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>METAVERSE CLUB OS v2.4</div>

                        <div className="mc-dash-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <RoleToggle />
                            {/* Notification Bell */}
                            {!isGuest && (
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4, position: 'relative' }}
                                    >
                                        <Bell size={16} />
                                        {notifications.some(n => n.unread) && (
                                            <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, background: '#ff4444' }} />
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="mc-dash-notifications" style={{
                                            position: 'absolute', top: '100%', right: 0, marginTop: 8,
                                            width: 280, background: 'rgba(20,20,30,0.95)', backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100,
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13, fontWeight: 600 }}>
                                                Notifications
                                            </div>
                                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                {notifications.map(n => (
                                                    <div key={n.id} style={{
                                                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                        background: n.unread ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.desc}</div>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{n.time}</div>
                                                    </div>
                                                ))}
                                                {notifications.length === 0 && (
                                                    <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Caught up! No new notifications.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
                                title="Toggle Fullscreen"
                            >
                                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                        {/* Sidebar */}
                        <div className={`mc-dash-sidebar ${sidebarOpen ? 'mc-dash-sidebar-open' : ''}`} style={{
                            width: 260, flexShrink: 0,
                            borderRight: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.2)', padding: '24px 16px',
                            display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 16px', borderRadius: 12,
                                        background: activeTab === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        border: '1px solid',
                                        borderColor: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                                        fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s', textAlign: 'left'
                                    }}
                                >
                                    <tab.icon size={18} color={activeTab === tab.id ? 'var(--neon-purple)' : 'currentColor'} />
                                    {tab.id}
                                </button>
                            ))}

                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20 }}>
                                {/* Discord Section mock */}
                                <div style={{
                                    padding: 16, borderRadius: 16, border: '1px solid rgba(124,138,244,0.3)',
                                    background: 'linear-gradient(135deg, rgba(88,101,242,0.1), rgba(192,132,252,0.1))',
                                    position: 'relative', overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(88,101,242,0.1)'
                                }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 10, background: 'rgba(88,101,242,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <defs>
                                                    <linearGradient id="discordNeon2" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#5865F2" />
                                                        <stop offset="100%" stopColor="#c084fc" />
                                                    </linearGradient>
                                                </defs>
                                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" fill="url(#discordNeon2)" />
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Your Club</div>
                                            <div style={{ fontSize: 11, color: '#a5b4fc' }}>148 online</div>
                                        </div>
                                        <button onClick={() => alert("In the live deployment, this connects to the actual club Discord. Users clicking this are verified through Discord OAuth to seamlessly enter your server.")} style={{ background: '#5865F2', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(88,101,242,0.4)' }}>Join</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {[
                                            { name: 'Nova', status: '#4ade80' },
                                            { name: 'Zane', status: '#4ade80' },
                                            { name: 'DJ Apex', status: '#fbbf24' },
                                            { name: 'Ivy', status: '#f87171' }
                                        ].map(m => (
                                            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: m.status, border: '2px solid #1e1b4b' }} />
                                                </div>
                                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* User Profile info */}
                                <div style={{
                                    padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)',
                                    display: 'flex', alignItems: 'center', gap: 12
                                }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--neon-cyan)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, boxShadow: '0 0 15px rgba(0,240,255,0.3)' }}>
                                        {isGuest ? 'G' : 'R'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {isGuest ? 'Guest' : 'Nova Resident'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {role === 'super_admin' ? 'Super Admin' : role === 'owner' ? 'Owner' : role === 'manager' ? 'Manager' : role === 'dj' ? 'DJ' : role === 'host' ? 'Host' : 'Visitor'}
                                        </div>
                                    </div>
                                    <button onClick={() => alert("In production, this securely terminates the session and revokes access tokens.")} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }} title="Log out">
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="mc-dash-content" style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.1)', position: 'relative', padding: 24 }}>
                            {renderView()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
