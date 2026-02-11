/* ==========================================================================
   Second Life Integration Data — Parsed from SL Notecards
   ========================================================================== */

/** DJ entry from the DG-X Shoutcast Board notecard */
export interface SlDj {
    streamUrl: string;
    slUsername: string;
    djName: string;
    profilePic: 'PROFILE' | string; // UUID or 'PROFILE' for SL profile pic
}

/** Board settings from the DG-X settings notecard */
export interface SlBoardSettings {
    headline: string;
    verbose: 'say' | 'shout' | 'whisper' | 'disable';
    defaultStream: string;
    tipJarChannel: string | 'DISABLE';
    managerAccess: 'GROUP' | 'NOTECARD';
}

/* ── Parsed DJ Roster from SL Notecard ── */
export const SL_DJ_ROSTER: SlDj[] = [
    { streamUrl: 'http://live.na2.lightmanstreams.com:10930', slUsername: 'darkmysticlove', djName: 'DJ MYSTIC', profilePic: 'PROFILE' },
    { streamUrl: 'http://srv1.goodsoundstream.com:3577', slUsername: 'Violet Stone', djName: 'DJ VIOLET', profilePic: 'PROFILE' },
    { streamUrl: 'http://srv1.goodsoundstream.com:3470', slUsername: 'LeaFy01', djName: 'DJ LEAFY', profilePic: 'PROFILE' },
    { streamUrl: 'http://mix-stream.com:10040', slUsername: 'Chris Criss', djName: 'Mr.Crisis', profilePic: 'PROFILE' },
    { streamUrl: 'http://sin.lightmanstreams.com:10040', slUsername: '3ntropyRahul', djName: 'DJ Rahul', profilePic: 'PROFILE' },
    { streamUrl: 'http://live.lightmanstreams.com:10142', slUsername: 'LanciaNightfire', djName: 'DJ Lancia', profilePic: 'PROFILE' },
    { streamUrl: 'https://srv1.goodsoundstream.com:3621', slUsername: 'articwitch', djName: 'DJ Artica', profilePic: 'PROFILE' },
    { streamUrl: 'http://live.na2.lightmanstreams.com:10068', slUsername: 'iMightBeLying', djName: 'DJ LEVI', profilePic: 'PROFILE' },
    { streamUrl: 'http://srv1.goodsoundstream.com:3213', slUsername: 'eyeknowz', djName: 'DJ ISH', profilePic: 'PROFILE' },
    { streamUrl: 'http://live.na2.lightmanstreams.com:8710', slUsername: 'Violet Stone', djName: 'DJ VIOLET', profilePic: 'PROFILE' },
];

/* ── Board Settings ── */
export const SL_BOARD_SETTINGS: SlBoardSettings = {
    headline: 'DG-X 900 SHOUTCAST BOARD v1.9',
    verbose: 'disable',
    defaultStream: 'DG Radio',
    tipJarChannel: '654987',
    managerAccess: 'NOTECARD',
};

/** Get DJ by SL username */
export function getDjByUsername(username: string): SlDj | undefined {
    return SL_DJ_ROSTER.find(dj => dj.slUsername.toLowerCase() === username.toLowerCase());
}

/** Get DJ by display name */
export function getDjByName(name: string): SlDj | undefined {
    return SL_DJ_ROSTER.find(dj => dj.djName.toLowerCase() === name.toLowerCase());
}
