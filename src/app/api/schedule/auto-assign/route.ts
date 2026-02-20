import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Smart Scheduling Algorithm
 * 
 * Input: List of events without DJ/Host → availability records
 * Output: Proposed assignments scored by:
 *   - Availability match (40%)
 *   - Fairness / workload balance (30%)
 *   - Genre match (20%)
 *   - Recency bonus (10%)
 */

interface AvailabilityRecord {
    staffId: string;
    staffName: string;
    role: string;
    type: string;
    date: string;
    startDate?: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    recurringDays?: number[];
    preferredGenres?: string[];
}

interface EventDoc {
    id: string;
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    genre?: string;
    djId?: string;
    hostId?: string;
}

interface StaffScore {
    staffId: string;
    staffName: string;
    score: number;
    breakdown: {
        availability: number;
        fairness: number;
        genre: number;
        recency: number;
    };
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    const a0 = timeToMinutes(aStart);
    let a1 = timeToMinutes(aEnd);
    const b0 = timeToMinutes(bStart);
    let b1 = timeToMinutes(bEnd);

    // Handle midnight crossing
    if (a1 <= a0) a1 += 24 * 60;
    if (b1 <= b0) b1 += 24 * 60;

    return a0 < b1 && b0 < a1;
}

function isAvailableForEvent(avail: AvailabilityRecord, event: EventDoc): boolean {
    // Check time overlap
    if (!timeOverlaps(avail.startTime, avail.endTime, event.startTime, event.endTime)) {
        return false;
    }

    // Check date
    if (avail.type === 'single') {
        return avail.date === event.date;
    }

    if (avail.type === 'range') {
        const start = avail.startDate || avail.date;
        const end = avail.endDate || avail.date;
        return event.date >= start && event.date <= end;
    }

    if (avail.type === 'recurring' && avail.recurringDays) {
        const eventDay = new Date(event.date + 'T00:00:00').getDay();
        return avail.recurringDays.includes(eventDay);
    }

    return false;
}

function scoreCandidate(
    staffId: string,
    event: EventDoc,
    availabilities: AvailabilityRecord[],
    allEvents: EventDoc[],
    role: 'dj' | 'host'
): StaffScore | null {
    // Check availability
    const staffAvail = availabilities.filter(a => a.staffId === staffId);
    const hasAvailability = staffAvail.some(a => isAvailableForEvent(a, event));
    if (!hasAvailability) return null;

    const staffName = staffAvail[0]?.staffName || 'Unknown';

    // Check no conflict (already assigned at same time)
    const roleField = role === 'dj' ? 'djId' : 'hostId';
    const hasConflict = allEvents.some(e =>
        e.id !== event.id &&
        e.date === event.date &&
        (e as any)[roleField] === staffId &&
        timeOverlaps(e.startTime, e.endTime, event.startTime, event.endTime)
    );
    if (hasConflict) return null;

    // Availability score (40%): how many availability windows cover this event
    const availScore = Math.min(staffAvail.filter(a => isAvailableForEvent(a, event)).length / 3, 1) * 40;

    // Fairness score (30%): fewer shifts this month = higher score
    const monthlyShifts = allEvents.filter(e => (e as any)[roleField] === staffId).length;
    const fairnessScore = Math.max(0, 30 - monthlyShifts * 5);

    // Genre match (20%): if DJ has preferred genres matching event genre
    let genreScore = 10; // Default: neutral
    if (event.genre) {
        const genres = staffAvail
            .flatMap(a => a.preferredGenres || [])
            .map(g => g.toLowerCase());
        if (genres.length > 0) {
            genreScore = genres.some(g => event.genre!.toLowerCase().includes(g)) ? 20 : 5;
        }
    }

    // Recency bonus (10%): haven't worked recently
    const recent = allEvents
        .filter(e => (e as any)[roleField] === staffId && e.date < event.date)
        .sort((a, b) => b.date.localeCompare(a.date));
    const daysSinceLast = recent.length > 0
        ? (new Date(event.date).getTime() - new Date(recent[0].date).getTime()) / (1000 * 60 * 60 * 24)
        : 30;
    const recencyScore = Math.min(daysSinceLast / 3, 10);

    return {
        staffId,
        staffName,
        score: availScore + fairnessScore + genreScore + recencyScore,
        breakdown: {
            availability: availScore,
            fairness: fairnessScore,
            genre: genreScore,
            recency: recencyScore,
        },
    };
}

export async function POST(req: NextRequest) {
    try {
        const db = getAdminDb();

        // Fetch unassigned events (no DJ or no Host)
        const eventsSnap = await db.collection('events').orderBy('date', 'asc').get();
        const allEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventDoc));

        const unassigned = allEvents.filter(e =>
            !e.djId || !e.hostId
        );

        if (unassigned.length === 0) {
            return NextResponse.json({ proposals: [], message: 'All events are fully assigned' });
        }

        // Fetch all availability records
        const availSnap = await db.collection('availability').get();
        const availabilities = availSnap.docs.map(d => ({ ...d.data() } as AvailabilityRecord));

        // Fetch staff with DJ/Host roles
        const usersSnap = await db.collection('users').get();
        const djStaff = usersSnap.docs
            .filter(d => {
                const data = d.data();
                return data.role === 'dj' || data.secondaryRoles?.includes('dj') ||
                    data.role === 'owner' || data.role === 'super_admin';
            })
            .map(d => d.id);

        const hostStaff = usersSnap.docs
            .filter(d => {
                const data = d.data();
                return data.role === 'host' || data.secondaryRoles?.includes('host') ||
                    data.role === 'owner' || data.role === 'super_admin';
            })
            .map(d => d.id);

        // For each unassigned event, score candidates
        const proposals: any[] = [];

        for (const event of unassigned) {
            const proposal: any = {
                eventId: event.id,
                eventName: event.name,
                date: event.date,
                startTime: event.startTime,
                endTime: event.endTime,
            };

            if (!event.djId) {
                const djScores = djStaff
                    .map(id => scoreCandidate(id, event, availabilities, allEvents, 'dj'))
                    .filter((s): s is StaffScore => s !== null)
                    .sort((a, b) => b.score - a.score);

                proposal.djCandidates = djScores.slice(0, 3);
                proposal.recommendedDj = djScores[0] || null;
            }

            if (!event.hostId) {
                const hostScores = hostStaff
                    .map(id => scoreCandidate(id, event, availabilities, allEvents, 'host'))
                    .filter((s): s is StaffScore => s !== null)
                    .sort((a, b) => b.score - a.score);

                proposal.hostCandidates = hostScores.slice(0, 3);
                proposal.recommendedHost = hostScores[0] || null;
            }

            proposals.push(proposal);
        }

        return NextResponse.json({
            proposals,
            totalUnassigned: unassigned.length,
            totalAvailability: availabilities.length,
        });
    } catch (error) {
        console.error('[AutoAssign] Error:', error);
        return NextResponse.json({ error: 'Failed to generate proposals' }, { status: 500 });
    }
}
