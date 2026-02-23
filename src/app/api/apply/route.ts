/* ==========================================================================
   POST /api/apply
   Accepts job applications and sends formatted message to Discord channel.
   No auth required — accessible by guests.
   ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1475598533771006092/Q01B9tYI9owUCiTVrg4LDYlCy8DAPtBZIv7ViVgpzcn_6R-rJqmZvE70G3CDuFrSRzzc';

interface ApplicationData {
    displayName: string;
    slName: string;
    discordUsername: string;
    role: 'dj' | 'host' | 'both';
    experience: string;
    genres: string;
    availability: string;
    timezone: string;
    aboutYou: string;
    sampleLink?: string;
}

function buildDiscordMessage(data: ApplicationData): object {
    const roleEmoji = data.role === 'dj' ? '🎧' : data.role === 'host' ? '🎤' : '🎧🎤';
    const roleLabel = data.role === 'dj' ? 'DJ' : data.role === 'host' ? 'Host' : 'DJ + Host';
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    return {
        embeds: [{
            title: `${roleEmoji} New Staff Application`,
            color: data.role === 'dj' ? 0x00F0FF : data.role === 'host' ? 0xC084FC : 0xFF6B9D,
            thumbnail: {
                url: 'https://i.imgur.com/8TLwVbW.png'
            },
            fields: [
                {
                    name: '👤 Display Name',
                    value: `\`${data.displayName}\``,
                    inline: true,
                },
                {
                    name: '🎮 SL Name',
                    value: `\`${data.slName}\``,
                    inline: true,
                },
                {
                    name: '💬 Discord',
                    value: `\`${data.discordUsername}\``,
                    inline: true,
                },
                {
                    name: `${roleEmoji} Applying For`,
                    value: `**${roleLabel}**`,
                    inline: true,
                },
                {
                    name: '🌍 Timezone',
                    value: data.timezone || 'Not specified',
                    inline: true,
                },
                {
                    name: '📅 Availability',
                    value: data.availability || 'Not specified',
                    inline: true,
                },
                {
                    name: '🎵 Experience',
                    value: data.experience || 'No experience listed',
                    inline: false,
                },
                {
                    name: '🎶 Genres / Specialties',
                    value: data.genres || 'Not specified',
                    inline: false,
                },
                {
                    name: '✨ About',
                    value: data.aboutYou || 'Nothing provided',
                    inline: false,
                },
                ...(data.sampleLink ? [{
                    name: '🔗 Sample / Portfolio',
                    value: data.sampleLink,
                    inline: false,
                }] : []),
            ],
            footer: {
                text: `Risky Desires • ${timestamp}`,
            },
            timestamp: now.toISOString(),
        }],
    };
}

export async function POST(req: NextRequest) {
    try {
        const data: ApplicationData = await req.json();

        // Validate required fields
        if (!data.displayName || !data.slName || !data.discordUsername || !data.role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Send to Discord
        const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildDiscordMessage(data)),
        });

        if (!discordRes.ok) {
            const errText = await discordRes.text();
            console.error('[apply] Discord webhook failed:', errText);
            return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Application submitted!' });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[apply] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
