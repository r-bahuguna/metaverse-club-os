'use client';

/* ==========================================================================
   usePresence — Hybrid presence detection
   Merges Discord Widget API status + Firestore web session status.
   
   Discord API polled every 60s. Returns a map of uid → PresenceStatus.
   ========================================================================== */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DISCORD } from '@/lib/constants';
import { AppUser, OnlineStatus } from '@/lib/types';

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

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

/** Maps Discord status → our PresenceStatus */
function mapDiscordStatus(status: string): PresenceStatus {
    switch (status) {
        case 'online': return 'online';
        case 'idle': return 'idle';
        case 'dnd': return 'dnd';
        default: return 'offline';
    }
}

/**
 * usePresence hook — merges Discord presence with Firestore onlineStatus.
 * 
 * @param staffList - Array of AppUser objects to match against Discord members
 * @returns Map of uid → PresenceStatus, plus Discord member count
 */
export function usePresence(staffList: AppUser[]) {
    const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(new Map());
    const [discordOnlineCount, setDiscordOnlineCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchDiscordPresence = useCallback(async () => {
        try {
            const res = await fetch(DISCORD.jsonApi, { cache: 'no-store' });
            if (!res.ok) return;

            const data: DiscordWidgetData = await res.json();
            setDiscordOnlineCount(data.presence_count);

            const newMap = new Map<string, PresenceStatus>();

            // For each staff member, try to find them in Discord
            for (const user of staffList) {
                let matched = false;

                for (const dm of data.members) {
                    const discordName = dm.username.toLowerCase();
                    const displayName = user.displayName?.toLowerCase() || '';
                    const slName = user.slName?.toLowerCase() || '';
                    const discordField = user.discordUsername?.toLowerCase() || '';

                    // Match by explicit discordUsername field, displayName, or slName
                    if (
                        (discordField && discordName === discordField) ||
                        discordName === displayName ||
                        discordName === slName
                    ) {
                        newMap.set(user.uid, mapDiscordStatus(dm.status));
                        matched = true;
                        break;
                    }
                }

                // If not found in Discord, fall back to Firestore onlineStatus
                if (!matched) {
                    const fsStatus = user.onlineStatus || 'offline';
                    newMap.set(user.uid, fsStatus === 'away' ? 'idle' : fsStatus as PresenceStatus);
                }
            }

            setPresenceMap(newMap);
        } catch (err) {
            console.warn('[usePresence] Discord API fetch failed:', err);
        }
    }, [staffList]);

    useEffect(() => {
        if (staffList.length === 0) return;

        // Initial fetch
        fetchDiscordPresence();

        // Poll every 60 seconds
        intervalRef.current = setInterval(fetchDiscordPresence, 60_000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchDiscordPresence, staffList]);

    return { presenceMap, discordOnlineCount };
}

/** Get a display color for presence status */
export function getPresenceColor(status: PresenceStatus): string {
    switch (status) {
        case 'online': return '#4ade80';
        case 'idle': return '#fbbf24';
        case 'dnd': return '#ef4444';
        case 'offline': return 'rgba(255,255,255,0.2)';
    }
}

/** Get a display label for presence status */
export function getPresenceLabel(status: PresenceStatus): string {
    switch (status) {
        case 'online': return 'Online';
        case 'idle': return 'Away';
        case 'dnd': return 'Do Not Disturb';
        case 'offline': return 'Offline';
    }
}
