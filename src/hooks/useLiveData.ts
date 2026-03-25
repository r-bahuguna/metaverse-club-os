/* ==========================================================================
   Firestore Real-Time Hooks — Metaverse Club OS
   Replace mock data with live onSnapshot listeners.

   Collections (written by SL→API ingestion routes, under orgs/{orgId}/):
     tips_realtime    → Recent tips (TipRecord[])
     visitors_live    → Currently present guests (GuestVisit[])
     active_state/dj  → DJ booth live status (DjBoothData)
     stats/tonight    → Tonight's aggregated stats (DashboardStats partial)
     dj_sessions      → DJ session events (DjSession[])
     visitor_log      → Historical visitor log
     staff_feed       → Staff feed messages (StaffFeedMessage[])
   ========================================================================== */

'use client';

import { useState, useEffect } from 'react';
import {
    collection, doc, query, orderBy, limit, onSnapshot,
    Timestamp, DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
    DashboardStats, TipRecord, GuestVisit,
    DjBoothData, HostStationData, StaffFeedMessage,
} from '@/lib/types';

// ── Default/empty states ──
const EMPTY_STATS: DashboardStats = {
    staffOnline: 0, totalStaff: 0,
    tonightRevenue: 0, weeklyRevenue: 0,
    upcomingEvents: 0, peakGuests: 0,
    averageVibe: 0, currentGuests: 0,
    maxCapacity: 60, avgSpendPerGuest: 0,
    tipsClub: 0, tipsHost: 0, tipsDj: 0,
    groupMembersJoined: 0, groupMembersOnline: 0,
    newMembersThisEvent: 0,
};

const EMPTY_DJ: DjBoothData = {
    djName: '', slUsername: '', genre: '',
    currentTrack: '', tipsThisSession: 0,
    isLive: false, streamUrl: '',
};

const EMPTY_HOST: HostStationData = {
    hostName: '', status: 'break', guestsGreeted: 0,
};

// ── Helper: convert Firestore Timestamp to ISO string ──
function toIsoString(val: Timestamp | string | undefined): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    return val as string;
}

// ══════════════════════════════════════════════════════════
// useLiveDashboardStats — stats/tonight document
// ══════════════════════════════════════════════════════════
export function useLiveDashboardStats(orgId?: string | null) {
    const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        const unsub = onSnapshot(doc(db, 'orgs', orgId, 'stats', 'tonight'), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setStats({
                    ...EMPTY_STATS,
                    tonightRevenue: d.totalTips || 0,
                    currentGuests: d.currentVisitors || 0,
                    peakGuests: d.peakConcurrent || 0,
                    tipsClub: d.tipsClub || 0,
                    tipsHost: d.tipsHost || 0,
                    tipsDj: d.tipsDj || 0,
                    totalStaff: d.totalStaff || 0,
                    staffOnline: d.staffOnline || 0,
                    weeklyRevenue: d.weeklyRevenue || 0,
                    upcomingEvents: d.upcomingEvents || 0,
                    averageVibe: d.averageVibe || 0,
                    newMembersThisEvent: d.newVisitors || 0,
                    groupMembersJoined: d.groupMembersJoined || 0,
                    groupMembersOnline: d.groupMembersOnline || 0,
                });
            }
            setLoading(false);
        });
        return unsub;
    }, [orgId]);

    return { stats, loading };
}

// ══════════════════════════════════════════════════════════
// useLiveTips — tips_realtime collection (latest N)
// ══════════════════════════════════════════════════════════
export function useLiveTips(orgId?: string | null, count = 20) {
    const [tips, setTips] = useState<TipRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        const q = query(
            collection(db, 'orgs', orgId, 'tips_realtime'),
            orderBy('createdAt', 'desc'),
            limit(count)
        );

        const unsub = onSnapshot(q, (snap) => {
            const items: TipRecord[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    timestamp: toIsoString(data.createdAt || data.timestamp),
                    amount: data.amount || 0,
                    tipperName: data.sourceName || 'Unknown',
                    recipientId: data.recipientUuid || '',
                    recipientName: data.recipientName || '',
                    category: data.category || 'club',
                    source: data.jarObjectKey || 'RD Smart Tip Jar',
                };
            });
            setTips(items);
            setLoading(false);
        });
        return unsub;
    }, [orgId, count]);

    return { tips, loading };
}

// ══════════════════════════════════════════════════════════
// useLiveGuests — visitors_live collection
// ══════════════════════════════════════════════════════════
export function useLiveGuests(orgId?: string | null) {
    const [guests, setGuests] = useState<GuestVisit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        const unsub = onSnapshot(collection(db, 'orgs', orgId, 'visitors_live'), (snap) => {
            const now = Date.now();
            const items: GuestVisit[] = snap.docs.map((d) => {
                const data = d.data();
                const arrivedAt = data.arrivedAt instanceof Timestamp
                    ? data.arrivedAt.toDate()
                    : new Date(data.arrivedAt || now);

                return {
                    id: d.id,
                    name: data.avatarName || 'Guest',
                    joinedAt: arrivedAt.toISOString(),
                    duration: Math.round((now - arrivedAt.getTime()) / 60000),
                    isNewMember: data.isNew || false,
                };
            });
            setGuests(items);
            setLoading(false);
        });
        return unsub;
    }, [orgId]);

    return { guests, loading };
}

// ══════════════════════════════════════════════════════════
// useLiveDjBooth — active_state/dj document
// ══════════════════════════════════════════════════════════
export function useLiveDjBooth(orgId?: string | null) {
    const [dj, setDj] = useState<DjBoothData>(EMPTY_DJ);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        const unsub = onSnapshot(doc(db, 'orgs', orgId, 'active_state', 'dj'), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setDj({
                    djName: d.djName || '',
                    slUsername: d.djUuid || '',
                    genre: d.genre || '',
                    currentTrack: d.currentTrack || '',
                    tipsThisSession: d.tipsThisSession || 0,
                    isLive: d.isLive || false,
                    streamUrl: d.streamUrl || '',
                });
            } else {
                setDj(EMPTY_DJ);
            }
            setLoading(false);
        });
        return unsub;
    }, [orgId]);

    return { dj, loading };
}

// ══════════════════════════════════════════════════════════
// useLiveHostStation — active_state/host document
// ══════════════════════════════════════════════════════════
export function useLiveHostStation(orgId?: string | null) {
    const [host, setHost] = useState<HostStationData>(EMPTY_HOST);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        const unsub = onSnapshot(doc(db, 'orgs', orgId, 'active_state', 'host'), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setHost({
                    hostName: d.hostName || '',
                    status: d.isActive ? 'active' : 'break',
                    guestsGreeted: d.guestsGreeted || 0,
                });
            } else {
                setHost(EMPTY_HOST);
            }
            setLoading(false);
        });
        return unsub;
    }, [orgId]);

    return { host, loading };
}

// ══════════════════════════════════════════════════════════
// useLiveStaffFeed — staff_feed collection (latest N)
// ══════════════════════════════════════════════════════════
export function useLiveStaffFeed(orgId?: string | null, count = 20) {
    const [feed, setFeed] = useState<StaffFeedMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        const q = query(
            collection(db, 'orgs', orgId, 'staff_feed'),
            orderBy('timestamp', 'desc'),
            limit(count)
        );

        const unsub = onSnapshot(q, (snap) => {
            const items: StaffFeedMessage[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    type: data.type || 'system',
                    message: data.message || '',
                    timestamp: toIsoString(data.timestamp),
                };
            });
            setFeed(items);
            setLoading(false);
        });
        return unsub;
    }, [orgId, count]);

    return { feed, loading };
}

// ══════════════════════════════════════════════════════════
// useLiveTipHistory — builds vibe graph data from tips_realtime
// Groups tips by 30-min intervals for the AreaChart
// ══════════════════════════════════════════════════════════
export interface TipHistoryPoint {
    time: string;
    club: number;
    dj: number;
    host: number;
}

export function useLiveTipHistory(orgId?: string | null) {
    const [history, setHistory] = useState<TipHistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        const q = query(
            collection(db, 'orgs', orgId, 'tips_realtime'),
            orderBy('createdAt', 'asc'),
            limit(500)  // Last 500 tips for tonight
        );

        const unsub = onSnapshot(q, (snap) => {
            // Bucket tips into 30-min intervals
            const buckets = new Map<string, { club: number; dj: number; host: number }>();

            snap.docs.forEach((d) => {
                const data = d.data();
                const ts = data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate()
                    : new Date(data.createdAt || Date.now());

                // Round to 30-min interval
                const hours = ts.getHours().toString().padStart(2, '0');
                const mins = ts.getMinutes() < 30 ? '00' : '30';
                const key = `${hours}:${mins}`;

                const bucket = buckets.get(key) || { club: 0, dj: 0, host: 0 };
                const cat = data.category || 'club';
                if (cat === 'club') bucket.club += data.amount || 0;
                else if (cat === 'dj') bucket.dj += data.amount || 0;
                else bucket.host += data.amount || 0;
                buckets.set(key, bucket);
            });

            // Convert to cumulative array
            const sorted = Array.from(buckets.entries())
                .sort(([a], [b]) => a.localeCompare(b));

            let cumClub = 0, cumDj = 0, cumHost = 0;
            const points: TipHistoryPoint[] = sorted.map(([time, vals]) => {
                cumClub += vals.club;
                cumDj += vals.dj;
                cumHost += vals.host;
                return { time, club: cumClub, dj: cumDj, host: cumHost };
            });

            setHistory(points);
            setLoading(false);
        });
        return unsub;
    }, [orgId]);

    return { history, loading };
}
