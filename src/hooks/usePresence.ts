'use client';

/* ==========================================================================
   usePresence — Dual presence detection
   
   Returns TWO separate indicators per user:
   1. Discord status (online/idle/dnd/offline) — from Discord Widget API
   2. Web presence (boolean) — from Firestore onlineStatus + lastSeen timestamp
   
   Discord API polled every 60s. Web presence uses heartbeat + staleness check.
   ========================================================================== */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DISCORD } from '@/lib/constants';
import { AppUser } from '@/lib/types';

export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface UserPresence {
    discordStatus: DiscordStatus;    // From Discord Widget API
    isOnWebsite: boolean;            // From Firestore heartbeat
    lastSeen?: string;               // ISO timestamp of last heartbeat
}

interface DiscordMember {
    id: string;
    username: string;
    status: 'online' | 'idle' | 'dnd';
    avatar_url: string;
    game?: { name: string };
}

interface DiscordWidgetData {
    members: DiscordMember[];
    presence_count: number;
}

/* Staleness threshold: if lastSeen > 3 minutes ago, consider offline from web */
const STALE_THRESHOLD_MS = 3 * 60 * 1000;

/**
 * usePresence — returns dual presence info for each staff member.
 */
export function usePresence(staffList: AppUser[]) {
    const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
    const [discordOnlineCount, setDiscordOnlineCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPresence = useCallback(async () => {
        const now = Date.now();
        let discordMembers: DiscordMember[] = [];

        // 1. Fetch Discord presence
        try {
            const res = await fetch(DISCORD.jsonApi, { cache: 'no-store' });
            if (res.ok) {
                const data: DiscordWidgetData = await res.json();
                discordMembers = data.members;
                setDiscordOnlineCount(data.presence_count);
            }
        } catch (err) {
            console.warn('[usePresence] Discord API failed:', err);
        }

        // 2. Build presence map
        const newMap = new Map<string, UserPresence>();

        for (const user of staffList) {
            // Discord matching
            let discordStatus: DiscordStatus = 'offline';
            for (const dm of discordMembers) {
                const dName = dm.username.toLowerCase();
                const displayName = user.displayName?.toLowerCase() || '';
                const slName = user.slName?.toLowerCase() || '';
                const discordField = user.discordUsername?.toLowerCase() || '';

                if (
                    (discordField && dName === discordField) ||
                    dName === displayName ||
                    dName === slName
                ) {
                    discordStatus = dm.status;
                    break;
                }
            }

            // Web presence: check Firestore onlineStatus + lastSeen staleness
            const fsStatus = user.onlineStatus;
            const lastSeen = (user as any).lastSeen as string | undefined;
            let isOnWebsite = false;

            if (fsStatus === 'online') {
                if (lastSeen) {
                    const elapsed = now - new Date(lastSeen).getTime();
                    isOnWebsite = elapsed < STALE_THRESHOLD_MS;
                } else {
                    // No lastSeen but status says online — trust it for now
                    isOnWebsite = true;
                }
            }
            // 'away' with recent lastSeen = still on website but tab hidden
            if (fsStatus === 'away' && lastSeen) {
                const elapsed = now - new Date(lastSeen).getTime();
                isOnWebsite = elapsed < STALE_THRESHOLD_MS;
            }

            newMap.set(user.uid, {
                discordStatus,
                isOnWebsite,
                lastSeen,
            });
        }

        setPresenceMap(newMap);
    }, [staffList]);

    useEffect(() => {
        if (staffList.length === 0) return;

        fetchPresence();
        intervalRef.current = setInterval(fetchPresence, 60_000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchPresence, staffList]);

    return { presenceMap, discordOnlineCount };
}

/* ── Discord status helpers ── */

export function getDiscordColor(status: DiscordStatus): string {
    switch (status) {
        case 'online': return '#4ade80';
        case 'idle': return '#fbbf24';
        case 'dnd': return '#ef4444';
        case 'offline': return 'rgba(255,255,255,0.2)';
    }
}

export function getDiscordLabel(status: DiscordStatus): string {
    switch (status) {
        case 'online': return 'Online';
        case 'idle': return 'Away';
        case 'dnd': return 'Busy';
        case 'offline': return 'Offline';
    }
}

/* ── Backward compat aliases ── */
export type PresenceStatus = DiscordStatus;
export const getPresenceColor = getDiscordColor;
export const getPresenceLabel = getDiscordLabel;
