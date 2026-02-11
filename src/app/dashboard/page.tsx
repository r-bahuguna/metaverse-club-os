'use client';

import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
    Headphones, Mic, Users, Clock,
    UserPlus, Activity,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
    MOCK_DASHBOARD_STATS,
    MOCK_EVENTS,
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
    const [text, setText] = useState('—');
    useEffect(() => {
        const update = () => {
            const diff = Date.now() - new Date(timestamp).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) setText('just now');
            else if (mins < 60) setText(`${mins}m ago`);
            else setText(`${Math.floor(mins / 60)}h ago`);
        };
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [timestamp]);
    return text;
}

function TimeAgo({ timestamp }: { timestamp: string }) {
    const text = useTimeAgo(timestamp);
    return <span className={styles.tipTime}>{text}</span>;
}

function FeedTimeAgo({ timestamp }: { timestamp: string }) {
    const text = useTimeAgo(timestamp);
    return <div className={styles.feedTime}>{text}</div>;
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
        <div
            style={{
                background: 'rgba(10, 10, 20, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                backdropFilter: 'blur(12px)',
            }}
        >
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                {label}
            </p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ fontSize: '12px', color: entry.color, fontFamily: 'var(--font-mono)' }}>
                    {entry.name}: L${entry.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Waveform bars heights ── */
const WAVE_HEIGHTS = [60, 80, 45, 90, 70, 55, 85, 40, 75, 95, 50, 65, 88, 42, 78, 58];

export default function DashboardPage() {
    const { can } = useRole();
    const stats = MOCK_DASHBOARD_STATS;
    const dj = MOCK_DJ_BOOTH;
    const host = MOCK_HOST_STATION;
    const capacityPct = Math.round((stats.currentGuests / stats.maxCapacity) * 100);
    const capacityColor = capacityPct > 85 ? '#ff4444' : capacityPct > 60 ? '#fbbf24' : '#4ade80';

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
                    <div className={styles.djTips}>
                        Tips: L${dj.tipsThisSession.toLocaleString()}
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
                    <div className={styles.hostActions}>
                        <button className={`${styles.hostBtn} ${styles.hostBtnPrimary}`}>Send Message</button>
                        <button className={`${styles.hostBtn} ${styles.hostBtnSecondary}`}>View Profile</button>
                    </div>
                </div>
            </div>

            {/* ═══ MAIN GRID: Vibe Graph + Real-Time Stats ═══ */}
            <div className={styles.mainGrid}>
                {/* Left Column */}
                <div className={styles.leftCol}>
                    {/* Vibe Graph */}
                    {can('manager') && (
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

                    {/* Upcoming Events */}
                    <GlassCard>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Upcoming Events</h2>
                            <span className={styles.sectionBadge}>{MOCK_EVENTS.length}</span>
                        </div>
                        <div className={styles.eventList}>
                            {MOCK_EVENTS.map(event => {
                                const { day, month } = formatDate(event.date);
                                return (
                                    <div key={event.id} className={styles.eventCard}>
                                        <div className={styles.eventDate}>
                                            <span className={styles.eventDay}>{day}</span>
                                            <span className={styles.eventMonth}>{month}</span>
                                        </div>
                                        <div className={styles.eventInfo}>
                                            <div className={styles.eventName}>{event.name}</div>
                                            <div className={styles.eventTime}>{event.startTime}–{event.endTime}</div>
                                            {event.genre && <div className={styles.eventGenre}>{event.genre}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column — Real-Time Stats */}
                <div className={styles.rightCol}>
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
                                {/* Mini donut chart */}
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

                    {/* New Guests */}
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

                    {/* Tip Feed */}
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

            {/* ═══ STAFF FEED — Horizontal Ticker ═══ */}
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
        </div>
    );
}
