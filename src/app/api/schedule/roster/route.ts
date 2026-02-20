import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1474196268141248514/UuE4PkXM__FDt18Kg0qwcWTnx2n9F8sG_FI-xgrBPj8eFpXiLfsPEJcfMTdwaemGreny';

function getWeekDates(dateStr?: string) {
    const now = dateStr ? new Date(dateStr) : new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
}

function formatWeekRange(start: Date, end: Date) {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

function statusEmoji(djResp?: string, hostResp?: string): string {
    const dj = djResp === 'accepted';
    const host = hostResp === 'accepted';
    if (dj && host) return '✅ Both Confirmed';
    if (!dj && !host) return '⏳ Awaiting Both Responses';
    if (!dj) return '⏳ Awaiting DJ Response';
    return '⏳ Awaiting Host Response';
}

function buildRosterMessage(events: any[], weekStart: Date, weekEnd: Date): string {
    const header = [
        '╔══════════════════════════════════════════╗',
        '║        🎵 RISKY DESIRES ROSTER 🎵       ║',
        `║     ${formatWeekRange(weekStart, weekEnd).padStart(28).padEnd(36)}║`,
        '╠══════════════════════════════════════════╣',
    ];

    if (events.length === 0) {
        header.push('║   No events scheduled this week         ║');
        header.push('╚══════════════════════════════════════════╝');
        return '```\n' + header.join('\n') + '\n```';
    }

    // Group by date
    const byDate = new Map<string, any[]>();
    for (const ev of events) {
        const list = byDate.get(ev.date) || [];
        list.push(ev);
        byDate.set(ev.date, list);
    }

    const body: string[] = [];
    const sortedDates = [...byDate.keys()].sort();

    for (const dateStr of sortedDates) {
        const dayEvents = byDate.get(dateStr)!;
        const d = new Date(dateStr + 'T00:00:00');
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        for (const ev of dayEvents) {
            const eventLabel = ev.name ? ` — ${ev.name}` : '';
            body.push(`║ 📅 ${dayLabel}${eventLabel}`.padEnd(43) + '║');
            body.push(`║    🎧 DJ: ${(ev.djName || 'TBD')} (${ev.startTime}–${ev.endTime})`.padEnd(43) + '║');
            body.push(`║    🎤 Host: ${(ev.hostName || 'TBD')} (${ev.startTime}–${ev.endTime})`.padEnd(43) + '║');
            body.push(`║    ${statusEmoji(ev.djResponse, ev.hostResponse)}`.padEnd(43) + '║');
            body.push('╠──────────────────────────────────────────╣');
        }
    }

    // Replace last separator with closing
    if (body.length > 0) {
        body[body.length - 1] = '╚══════════════════════════════════════════╝';
    }

    return '```\n' + [...header, ...body].join('\n') + '\n```';
}

export async function POST(req: NextRequest) {
    try {
        const { weekDate } = await req.json().catch(() => ({}));
        const { start, end } = getWeekDates(weekDate);

        const db = getAdminDb();
        const eventsRef = db.collection('events');

        // Fetch events in the week range
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const snapshot = await eventsRef
            .where('date', '>=', startStr)
            .where('date', '<=', endStr)
            .orderBy('date', 'asc')
            .get();

        const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Build ASCII roster
        const message = buildRosterMessage(events, start, end);

        // Post to Discord
        const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
        });

        if (!discordRes.ok) {
            const errorText = await discordRes.text();
            console.error('[Roster] Discord webhook failed:', errorText);
            return NextResponse.json({ error: 'Discord webhook failed', details: errorText }, { status: 500 });
        }

        // Mark events as roster posted
        const batch = db.batch();
        for (const ev of events) {
            batch.update(eventsRef.doc(ev.id), { rosterPosted: true });
        }
        await batch.commit();

        return NextResponse.json({
            success: true,
            eventsCount: events.length,
            week: `${startStr} to ${endStr}`,
        });
    } catch (error) {
        console.error('[Roster] Error:', error);
        return NextResponse.json({ error: 'Failed to post roster' }, { status: 500 });
    }
}
