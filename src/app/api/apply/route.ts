/* ==========================================================================
   POST /api/apply
   Accepts job applications and sends formatted message to Discord channel.
   No auth required — accessible by guests.
   ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1475598533771006092/Q01B9tYI9owUCiTVrg4LDYlCy8DAPtBZIv7ViVgpzcn_6R-rJqmZvE70G3CDuFrSRzzc';

interface ApplicationData {
    slDisplayName: string;
    agentName: string;
    slUuid: string;
    usesVoice: boolean;
    discordUsername?: string;
    role: 'dj' | 'host' | 'both';
    experience?: string;
    genres?: string;
    availability?: string;
    timezone?: string;
    aboutYou?: string;
    sampleLink?: string;
}

function buildDiscordMessage(data: ApplicationData): object {
    const roleEmoji = data.role === 'dj' ? '🎧' : data.role === 'host' ? '🎤' : '🎧🎤';
    const roleLabel = data.role === 'dj' ? 'DJ' : data.role === 'host' ? 'Host' : 'DJ + Host';
    const voiceEmoji = data.usesVoice ? '🔊 Yes' : '🔇 No';
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
                    name: '👤 SL Display Name',
                    value: `\`${data.slDisplayName}\``,
                    inline: true,
                },
                {
                    name: '🎮 Agent Name',
                    value: `\`${data.agentName}\``,
                    inline: true,
                },
                {
                    name: `${roleEmoji} Applying For`,
                    value: `**${roleLabel}**`,
                    inline: true,
                },
                {
                    name: '🆔 SL UUID',
                    value: `\`${data.slUuid}\``,
                    inline: false,
                },
                {
                    name: '🎙️ Uses Voice',
                    value: voiceEmoji,
                    inline: true,
                },
                ...(data.discordUsername ? [{
                    name: '💬 Discord',
                    value: `\`${data.discordUsername}\``,
                    inline: true,
                }] : []),
                ...(data.timezone ? [{
                    name: '🌍 Timezone',
                    value: data.timezone,
                    inline: true,
                }] : []),
                ...(data.availability ? [{
                    name: '📅 Availability',
                    value: data.availability,
                    inline: true,
                }] : []),
                ...(data.experience ? [{
                    name: '🎵 Experience',
                    value: data.experience,
                    inline: false,
                }] : []),
                ...(data.genres ? [{
                    name: '🎶 Genres / Specialties',
                    value: data.genres,
                    inline: false,
                }] : []),
                ...(data.aboutYou ? [{
                    name: '✨ About',
                    value: data.aboutYou,
                    inline: false,
                }] : []),
                ...(data.sampleLink ? [{
                    name: '🔗 Sample / Portfolio',
                    value: data.sampleLink,
                    inline: false,
                }] : []),
            ],
            footer: {
                text: `Metaverse Club OS • ${timestamp}`,
            },
            timestamp: now.toISOString(),
        }],
    };
}

export async function POST(req: NextRequest) {
    try {
        const data: ApplicationData = await req.json();

        // Validate required fields
        if (!data.slDisplayName || !data.agentName || !data.slUuid || !data.role || data.usesVoice === undefined) {
            return NextResponse.json({ error: 'Missing required fields (SL Display Name, Agent Name, UUID, Role, Voice)' }, { status: 400 });
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
