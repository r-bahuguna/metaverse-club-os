'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
    Headphones, Mic, Users, Clock,
    UserPlus, Activity,
    CalendarDays, TrendingUp,
    Play, Pause, Volume2, Heart,
    DollarSign, Zap,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useRole } from '@/hooks/useRole';
import { useOrg } from '@/hooks/useOrg';
import {
    useLiveDashboardStats, useLiveTips, useLiveTipHistory,
    useLiveDjBooth, useLiveHostStation, useLiveStaffFeed, useLiveGuests,
} from '@/hooks/useLiveData';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClubEvent } from '@/lib/types';
import {
    MOCK_DASHBOARD_STATS,
    MOCK_TIPS,
    MOCK_TIP_HISTORY,
    MOCK_DJ_BOOTH,
    MOCK_HOST_STATION,
    MOCK_STAFF_FEED,
    MOCK_GUEST_VISITS,
} from '@/lib/mock-data';
import styles from './page.module.css';

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

/* ── Upcoming Events from Firestore ── */
function UpcomingEventsSection() {
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const today = new Date().toISOString().split('T')[0];
                const q = query(collection(db, 'events'), orderBy('date', 'asc'));
                const snap = await getDocs(q);
                const upcoming = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as ClubEvent))
                    .filter(e => e.date >= today && e.status !== 'cancelled');
                setEvents(upcoming.slice(0, 8));
            } catch (err) {
                console.warn('[Dashboard] Failed to fetch events:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, []);

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

export default function DashboardPage() {
    const { can, isGuest } = useRole();
    const { orgId } = useOrg();

    // ── Live Firestore Data (with mock fallback) ──
    const { stats: liveStats, loading: statsLoading } = useLiveDashboardStats(orgId);
    const { dj: liveDj, loading: djLoading } = useLiveDjBooth(orgId);
    const { host: liveHost, loading: hostLoading } = useLiveHostStation(orgId);
    const { tips: liveTips, loading: tipsLoading } = useLiveTips(orgId, 20);
    const { history: liveTipHistory, loading: historyLoading } = useLiveTipHistory(orgId);
    const { feed: liveFeed, loading: feedLoading } = useLiveStaffFeed(orgId, 20);
    const { guests: liveGuests, loading: guestsLoading } = useLiveGuests(orgId);

    // Use live data if available, otherwise fall back to mock
    const stats = liveStats.tonightRevenue > 0 ? liveStats : MOCK_DASHBOARD_STATS;
    const dj = liveDj.djName ? liveDj : MOCK_DJ_BOOTH;
    const host = liveHost.hostName ? liveHost : MOCK_HOST_STATION;
    const tips = liveTips.length > 0 ? liveTips : MOCK_TIPS;
    const tipHistory = liveTipHistory.length > 0 ? liveTipHistory : MOCK_TIP_HISTORY;
    const staffFeed = liveFeed.length > 0 ? liveFeed : MOCK_STAFF_FEED;
    const guests = liveGuests.length > 0 ? liveGuests : MOCK_GUEST_VISITS;

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
                            Club Tip Jar
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
                                    <AreaChart data={tipHistory} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
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

                    {/* Upcoming Events — visible to everyone */}
                    <GlassCard>
                        <UpcomingEventsSection />
                    </GlassCard>

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
                                <span className={styles.sectionBadge}>{guests.length}</span>
                            </div>
                            <div className={styles.guestList}>
                                {guests.map(g => (
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
                                {tips.map(tip => (
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
                        <span className={styles.sectionBadge}>{staffFeed.length}</span>
                    </div>
                    <div className={styles.staffFeed}>
                        {staffFeed.map(msg => (
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
