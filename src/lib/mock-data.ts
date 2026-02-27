/* ==========================================================================
   Mock Data — Metaverse Club OS
   Realistic demo data showing the platform's capabilities
   ========================================================================== */

import {
    StaffMember, Shift, ClubEvent, TipRecord, DashboardStats,
    Expense, Availability, SchedulePairing, GuestVisit,
    StaffFeedMessage, DjBoothData, HostStationData,
} from './types';

/** ── Staff Roster ── */
export const MOCK_STAFF: StaffMember[] = [
    {
        id: 'staff-001',
        displayName: 'Nova',
        slName: 'NovaStar Resident',
        slUuid: '00000000-0000-0000-0000-000000000001',
        role: 'owner',
        onlineStatus: 'online',
        joinedDate: '2023-01-15',
        lastSeen: '2026-02-11T12:00:00Z',
        hoursThisWeek: 28,
        tipsThisWeek: 0,
        bio: 'Owner & Founder — built this place from scratch',
    },
    {
        id: 'staff-002',
        displayName: 'Zane',
        slName: 'Zaneth Resident',
        slUuid: '00000000-0000-0000-0000-000000000002',
        role: 'general_manager',
        onlineStatus: 'online',
        joinedDate: '2023-03-10',
        lastSeen: '2026-02-11T12:00:00Z',
        hoursThisWeek: 32,
        tipsThisWeek: 0,
        bio: 'General Manager & Systems Architect',
    },
    {
        id: 'staff-003',
        displayName: 'DJ Apex',
        slName: 'Apex Resident',
        slUuid: '00000000-0000-0000-0000-000000000003',
        role: 'dj',
        specialties: ['Techno', 'House', 'Synthwave'],
        onlineStatus: 'online',
        joinedDate: '2023-06-20',
        lastSeen: '2026-02-11T12:00:00Z',
        hoursThisWeek: 12,
        tipsThisWeek: 4200,
        rating: 4.8,
        bio: 'Resident DJ — spinning since 2019',
    },
    {
        id: 'staff-004',
        displayName: 'DJ Caspian',
        slName: 'Caspian Resident',
        slUuid: '00000000-0000-0000-0000-000000000004',
        role: 'dj',
        specialties: ['Deep House', 'Chill', 'Lo-Fi'],
        onlineStatus: 'offline',
        joinedDate: '2024-01-10',
        lastSeen: '2026-02-10T18:30:00Z',
        hoursThisWeek: 8,
        tipsThisWeek: 2800,
        rating: 4.5,
        bio: 'Night shift vibes specialist',
    },
    {
        id: 'staff-005',
        displayName: 'Remi',
        slName: 'Remi Resident',
        slUuid: '00000000-0000-0000-0000-000000000005',
        role: 'host',
        onlineStatus: 'online',
        joinedDate: '2023-09-12',
        lastSeen: '2026-02-11T12:00:00Z',
        hoursThisWeek: 18,
        tipsThisWeek: 3100,
        rating: 4.9,
        bio: 'Head Host — the life of the party',
    },
    {
        id: 'staff-006',
        displayName: 'Ivy',
        slName: 'Ivy Lace',
        slUuid: '00000000-0000-0000-0000-000000000006',
        role: 'host',
        onlineStatus: 'away',
        joinedDate: '2024-03-05',
        lastSeen: '2026-02-11T00:15:00Z',
        hoursThisWeek: 10,
        tipsThisWeek: 1500,
        rating: 4.3,
        bio: 'Guest greeter & VIP concierge',
    },
    {
        id: 'staff-007',
        displayName: 'Lyra',
        slName: 'Lyra Noir',
        slUuid: '00000000-0000-0000-0000-000000000007',
        role: 'manager',
        onlineStatus: 'online',
        joinedDate: '2023-11-01',
        lastSeen: '2026-02-11T12:00:00Z',
        hoursThisWeek: 22,
        tipsThisWeek: 0,
        bio: 'Floor manager & schedule coordinator',
    },
    {
        id: 'staff-008',
        displayName: 'Orion',
        slName: 'Orion Vantara',
        slUuid: '00000000-0000-0000-0000-000000000008',
        role: 'owner',
        onlineStatus: 'offline',
        joinedDate: '2022-05-10',
        lastSeen: '2026-02-10T15:00:00Z',
        hoursThisWeek: 14,
        tipsThisWeek: 0,
        bio: 'Co-Owner',
    },
    {
        id: 'staff-009',
        displayName: 'Vera',
        slName: 'Vera Billig',
        slUuid: '00000000-0000-0000-0000-000000000009',
        role: 'owner',
        onlineStatus: 'online',
        joinedDate: '2022-08-22',
        lastSeen: '2026-02-11T12:00:00Z',
        hoursThisWeek: 20,
        tipsThisWeek: 0,
        bio: 'Co-Owner',
    },
    {
        id: 'staff-010',
        displayName: 'Echo',
        slName: 'Echo Veil',
        slUuid: '00000000-0000-0000-0000-000000000010',
        role: 'manager',
        onlineStatus: 'online',
        joinedDate: '2024-01-05',
        lastSeen: '2026-02-11T10:30:00Z',
        hoursThisWeek: 24,
        tipsThisWeek: 0,
        bio: 'Events manager',
    },
    {
        id: 'staff-011',
        displayName: 'Mira',
        slName: 'Mira Spire',
        slUuid: '00000000-0000-0000-0000-000000000011',
        role: 'host',
        onlineStatus: 'offline',
        joinedDate: '2023-11-15',
        lastSeen: '2026-02-10T22:00:00Z',
        hoursThisWeek: 16,
        tipsThisWeek: 1200,
        rating: 4.6,
        bio: 'Fashion consultant & Host',
    },
    {
        id: 'staff-012',
        displayName: 'DJ Sable',
        slName: 'Sable Resident',
        slUuid: '00000000-0000-0000-0000-000000000012',
        role: 'dj',
        specialties: ['EDM', 'Dubstep'],
        onlineStatus: 'offline',
        joinedDate: '2024-02-01',
        lastSeen: '2026-02-05T01:00:00Z',
        hoursThisWeek: 6,
        tipsThisWeek: 1500,
        rating: 4.8,
        bio: 'Weekend heavy bass',
    },
    {
        id: 'staff-013',
        displayName: 'Soleil',
        slName: 'Soleil Resident',
        slUuid: '00000000-0000-0000-0000-000000000013',
        role: 'host',
        onlineStatus: 'online',
        joinedDate: '2023-12-10',
        lastSeen: '2026-02-11T12:00:00Z',
        hoursThisWeek: 12,
        tipsThisWeek: 2100,
        rating: 4.9,
        bio: 'VIP Host',
    }
];

/** ── This Week's Schedule ── */
const today = new Date();
const getDateStr = (daysFromNow: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
};

export const MOCK_SHIFTS: Shift[] = [
    // Today
    { id: 'shift-001', staffId: 'staff-003', staffName: 'DJ Apex', role: 'dj', date: getDateStr(0), startTime: '20:00', endTime: '00:00', status: 'active', response: 'accepted', notes: 'Neon Nights theme' },
    { id: 'shift-002', staffId: 'staff-005', staffName: 'Remi', role: 'host', date: getDateStr(0), startTime: '19:00', endTime: '01:00', status: 'active', response: 'accepted' },
    { id: 'shift-003', staffId: 'staff-007', staffName: 'Lyra', role: 'manager', date: getDateStr(0), startTime: '18:00', endTime: '02:00', status: 'active', response: 'accepted' },
    // Tomorrow
    { id: 'shift-004', staffId: 'staff-004', staffName: 'DJ Caspian', role: 'dj', date: getDateStr(1), startTime: '22:00', endTime: '04:00', status: 'scheduled', response: 'pending' },
    { id: 'shift-005', staffId: 'staff-006', staffName: 'Ivy', role: 'host', date: getDateStr(1), startTime: '20:00', endTime: '02:00', status: 'scheduled', response: 'accepted' },
    { id: 'shift-006', staffId: 'staff-007', staffName: 'Lyra', role: 'manager', date: getDateStr(1), startTime: '19:00', endTime: '03:00', status: 'scheduled', response: 'accepted' },
    // Day after
    { id: 'shift-007', staffId: 'staff-003', staffName: 'DJ Apex', role: 'dj', date: getDateStr(2), startTime: '21:00', endTime: '01:00', status: 'scheduled', response: 'accepted', notes: 'Ladies Night' },
    { id: 'shift-008', staffId: 'staff-005', staffName: 'Remi', role: 'host', date: getDateStr(2), startTime: '20:00', endTime: '02:00', status: 'scheduled', response: 'reschedule_requested' },
    // 3 days out
    { id: 'shift-009', staffId: 'staff-004', staffName: 'DJ Caspian', role: 'dj', date: getDateStr(3), startTime: '22:00', endTime: '04:00', status: 'scheduled', response: 'pending' },
    { id: 'shift-010', staffId: 'staff-006', staffName: 'Ivy', role: 'host', date: getDateStr(3), startTime: '21:00', endTime: '03:00', status: 'scheduled', response: 'declined' },
];

/** ── Upcoming Events ── */
export const MOCK_EVENTS: ClubEvent[] = [
    {
        id: 'event-001',
        name: 'Neon Nights',
        description: 'The ultimate synthwave experience. Glow sticks, laser shows, and non-stop beats.',
        date: getDateStr(0),
        startTime: '20:00',
        endTime: '02:00',
        djId: 'staff-003',
        hostId: 'staff-005',
        genre: 'Synthwave / Techno',
        isRecurring: true,
        status: 'confirmed',
        createdBy: 'staff-001',
        createdAt: '2026-02-01T00:00:00Z',
    },
    {
        id: 'event-002',
        name: 'Ladies Night',
        description: 'Free drinks for the first hour. VIP access included.',
        date: getDateStr(2),
        startTime: '21:00',
        endTime: '03:00',
        djId: 'staff-003',
        hostId: 'staff-005',
        genre: 'House / Deep House',
        isRecurring: true,
        status: 'scheduled',
        createdBy: 'staff-001',
        createdAt: '2026-02-01T00:00:00Z',
    },
    {
        id: 'event-003',
        name: 'Lo-Fi Lounge',
        description: 'Chill beats, ambience, and smooth conversations.',
        date: getDateStr(3),
        startTime: '22:00',
        endTime: '04:00',
        djId: 'staff-004',
        hostId: 'staff-006',
        genre: 'Lo-Fi / Chill',
        isRecurring: false,
        status: 'draft',
        createdBy: 'staff-002',
        createdAt: '2026-02-05T00:00:00Z',
    },
];

/** ── Recent Tips (static timestamps to avoid hydration mismatch) ── */
export const MOCK_TIPS: TipRecord[] = [
    { id: 'tip-001', timestamp: '2026-02-11T11:55:00Z', amount: 500, tipperName: 'CoolCat42', recipientId: 'staff-003', recipientName: 'DJ Apex', category: 'dj', source: 'DG-T 100s DJ Jar' },
    { id: 'tip-002', timestamp: '2026-02-11T11:50:00Z', amount: 200, tipperName: 'NightOwl88', recipientId: 'staff-005', recipientName: 'Remi', category: 'host', source: 'DG-T 100s Host Jar' },
    { id: 'tip-003', timestamp: '2026-02-11T11:45:00Z', amount: 1000, tipperName: 'VIPKing', recipientId: 'staff-001', recipientName: 'Club', category: 'club', source: 'DG-T 200 Club Jar' },
    { id: 'tip-004', timestamp: '2026-02-11T11:40:00Z', amount: 300, tipperName: 'DancerFan', recipientId: 'staff-003', recipientName: 'DJ Apex', category: 'dj', source: 'DG-T 100s DJ Jar' },
    { id: 'tip-005', timestamp: '2026-02-11T11:30:00Z', amount: 150, tipperName: 'WanderlustSL', recipientId: 'staff-005', recipientName: 'Remi', category: 'host', source: 'DG-T 100s Host Jar' },
    { id: 'tip-006', timestamp: '2026-02-11T11:20:00Z', amount: 750, tipperName: 'HighRoller99', recipientId: 'staff-001', recipientName: 'Club', category: 'club', source: 'DG-T 200 Club Jar' },
];

/** ── Dashboard Stats ── */
export const MOCK_DASHBOARD_STATS: DashboardStats = {
    staffOnline: 4,
    totalStaff: 7,
    tonightRevenue: 12500,
    weeklyRevenue: 48200,
    upcomingEvents: 3,
    peakGuests: 34,
    averageVibe: 8.4,
    currentGuests: 34,
    maxCapacity: 60,
    avgSpendPerGuest: 85,
    tipsClub: 4800,
    tipsHost: 3450,
    tipsDj: 4250,
    groupMembersJoined: 22,
    groupMembersOnline: 8,
    newMembersThisEvent: 5,
};

/** ── Tip History (for Vibe Graph) ── */
export const MOCK_TIP_HISTORY = [
    { time: '20:00', club: 200, dj: 100, host: 50 },
    { time: '20:30', club: 350, dj: 200, host: 100 },
    { time: '21:00', club: 800, dj: 450, host: 200 },
    { time: '21:30', club: 1200, dj: 750, host: 350 },
    { time: '22:00', club: 2200, dj: 1200, host: 500 },
    { time: '22:30', club: 3100, dj: 1800, host: 800 },
    { time: '23:00', club: 4500, dj: 2500, host: 1100 },
    { time: '23:30', club: 5200, dj: 3100, host: 1400 },
    { time: '00:00', club: 5800, dj: 3600, host: 1700 },
    { time: '00:30', club: 6100, dj: 3800, host: 1900 },
    { time: '01:00', club: 6300, dj: 3900, host: 2000 },
];

/** ── DJ Booth & Host Station ── */
export const MOCK_DJ_BOOTH: DjBoothData = {
    djName: 'DJ Apex',
    slUsername: 'Apex Resident',
    genre: 'Techno / House',
    currentTrack: '"Neon Drift" – Synthwave',
    tipsThisSession: 4200,
    isLive: true,
    streamUrl: 'http://sin.lightmanstreams.com:10040',
};

export const MOCK_HOST_STATION: HostStationData = {
    hostName: 'Remi',
    status: 'active',
    guestsGreeted: 27,
};

/** ── Staff Feed Messages ── */
export const MOCK_STAFF_FEED: StaffFeedMessage[] = [
    { id: 'feed-001', type: 'alert', message: 'Club at 57% capacity', timestamp: '2026-02-11T11:50:00Z' },
    { id: 'feed-002', type: 'message', message: 'DJ Apex: switching to Synthwave set next', timestamp: '2026-02-11T11:48:00Z' },
    { id: 'feed-003', type: 'system', message: '5 new group members joined this event', timestamp: '2026-02-11T11:45:00Z' },
    { id: 'feed-004', type: 'alert', message: 'Tip jar total passed L$10,000 tonight', timestamp: '2026-02-11T11:40:00Z' },
    { id: 'feed-005', type: 'message', message: 'Remi: new guest needs orientation', timestamp: '2026-02-11T11:38:00Z' },
    { id: 'feed-006', type: 'system', message: 'Sploder payout: L$500 distributed', timestamp: '2026-02-11T11:35:00Z' },
];

/** ── Guest Visits ── */
export const MOCK_GUEST_VISITS: GuestVisit[] = [
    { id: 'guest-001', name: 'NightOwl88', joinedAt: '2026-02-11T11:10:00Z', duration: 45, isNewMember: false },
    { id: 'guest-002', name: 'CyberPunk42', joinedAt: '2026-02-11T11:15:00Z', duration: 38, isNewMember: true },
    { id: 'guest-003', name: 'VIPKing', joinedAt: '2026-02-11T10:50:00Z', duration: 65, isNewMember: false },
    { id: 'guest-004', name: 'GlowStickGirl', joinedAt: '2026-02-11T11:25:00Z', duration: 22, isNewMember: true },
    { id: 'guest-005', name: 'BassDropper', joinedAt: '2026-02-11T11:30:00Z', duration: 18, isNewMember: true },
    { id: 'guest-006', name: 'WanderlustSL', joinedAt: '2026-02-11T10:30:00Z', duration: 80, isNewMember: false },
    { id: 'guest-007', name: 'DancerFan', joinedAt: '2026-02-11T11:00:00Z', duration: 55, isNewMember: false },
    { id: 'guest-008', name: 'NeonRider', joinedAt: '2026-02-11T11:40:00Z', duration: 12, isNewMember: true },
    { id: 'guest-009', name: 'HighRoller99', joinedAt: '2026-02-11T10:45:00Z', duration: 70, isNewMember: false },
    { id: 'guest-010', name: 'StarDust77', joinedAt: '2026-02-11T11:35:00Z', duration: 15, isNewMember: true },
];

/** ── Expenses ── */
export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp-001', name: 'Sploder Payout — Neon Nights', amount: 500, category: 'sploder', date: '2026-02-11', notes: 'Weekly event sploder', createdBy: 'staff-001' },
    { id: 'exp-002', name: 'Sploder Payout — Lo-Fi Lounge', amount: 300, category: 'sploder', date: '2026-02-08', notes: '', createdBy: 'staff-001' },
    { id: 'exp-003', name: 'Fishbowl Raffle — Ladies Night', amount: 200, category: 'fishbowl', date: '2026-02-09', notes: 'Random winner draws', createdBy: 'staff-002' },
    { id: 'exp-004', name: 'New Dance Floor Particles', amount: 800, category: 'asset_purchase', date: '2026-02-07', notes: 'Marketplace purchase — animated particle system', createdBy: 'staff-001' },
    { id: 'exp-005', name: 'DJ Booth Redesign Props', amount: 1200, category: 'asset_purchase', date: '2026-02-05', notes: 'Custom built props for booth upgrade', createdBy: 'staff-001' },
    { id: 'exp-006', name: 'Fishbowl Raffle — Weekend Special', amount: 350, category: 'fishbowl', date: '2026-02-04', notes: '', createdBy: 'staff-002' },
];

/** ── Availability (for Smart Scheduling) ── */
export const MOCK_AVAILABILITY: Availability[] = [
    { id: 'avail-001', staffId: 'staff-003', staffName: 'DJ Apex', role: 'dj', date: getDateStr(4), startTime: '19:00', endTime: '01:00' },
    { id: 'avail-002', staffId: 'staff-003', staffName: 'DJ Apex', role: 'dj', date: getDateStr(5), startTime: '20:00', endTime: '02:00' },
    { id: 'avail-003', staffId: 'staff-004', staffName: 'DJ Caspian', role: 'dj', date: getDateStr(4), startTime: '21:00', endTime: '03:00' },
    { id: 'avail-004', staffId: 'staff-004', staffName: 'DJ Caspian', role: 'dj', date: getDateStr(6), startTime: '22:00', endTime: '04:00' },
    { id: 'avail-005', staffId: 'staff-005', staffName: 'Remi', role: 'host', date: getDateStr(4), startTime: '18:00', endTime: '00:00' },
    { id: 'avail-006', staffId: 'staff-005', staffName: 'Remi', role: 'host', date: getDateStr(5), startTime: '19:00', endTime: '01:00' },
    { id: 'avail-007', staffId: 'staff-006', staffName: 'Ivy', role: 'host', date: getDateStr(5), startTime: '20:00', endTime: '02:00' },
    { id: 'avail-008', staffId: 'staff-006', staffName: 'Ivy', role: 'host', date: getDateStr(6), startTime: '21:00', endTime: '03:00' },
];

/** ── Smart Schedule Pairings ── */
export const MOCK_PAIRINGS: SchedulePairing[] = [
    { id: 'pair-001', eventId: 'event-004', eventName: 'Techno Tuesday', date: getDateStr(4), djId: 'staff-003', djName: 'DJ Apex', hostId: 'staff-005', hostName: 'Remi', status: 'proposed' },
    { id: 'pair-002', eventId: 'event-005', eventName: 'Chill Friday', date: getDateStr(5), djId: 'staff-003', djName: 'DJ Apex', hostId: 'staff-006', hostName: 'Ivy', status: 'proposed' },
    { id: 'pair-003', eventId: 'event-006', eventName: 'Weekend Rave', date: getDateStr(6), djId: 'staff-004', djName: 'DJ Caspian', hostId: 'staff-006', hostName: 'Ivy', status: 'proposed' },
];

/** ── Revenue Trend (for Analytics) ── */
export const MOCK_REVENUE_TREND = [
    { week: 'Jan W1', revenue: 28000, expenses: 3200, tips_club: 12000, tips_dj: 10000, tips_host: 6000 },
    { week: 'Jan W2', revenue: 32000, expenses: 2800, tips_club: 14000, tips_dj: 11000, tips_host: 7000 },
    { week: 'Jan W3', revenue: 35000, expenses: 4100, tips_club: 15000, tips_dj: 12000, tips_host: 8000 },
    { week: 'Jan W4', revenue: 29000, expenses: 3500, tips_club: 13000, tips_dj: 9500, tips_host: 6500 },
    { week: 'Feb W1', revenue: 41000, expenses: 3800, tips_club: 18000, tips_dj: 14000, tips_host: 9000 },
    { week: 'Feb W2', revenue: 48200, expenses: 3350, tips_club: 21000, tips_dj: 16000, tips_host: 11200 },
];

/** ── Expense Trend (for Analytics) ── */
export const MOCK_EXPENSE_TREND = [
    { week: 'Jan W1', sploder: 1000, fishbowl: 400, assets: 1800, custom: 0 },
    { week: 'Jan W2', sploder: 800, fishbowl: 500, assets: 1500, custom: 0 },
    { week: 'Jan W3', sploder: 1200, fishbowl: 600, assets: 2300, custom: 0 },
    { week: 'Jan W4', sploder: 900, fishbowl: 350, assets: 2250, custom: 0 },
    { week: 'Feb W1', sploder: 1100, fishbowl: 500, assets: 2200, custom: 0 },
    { week: 'Feb W2', sploder: 800, fishbowl: 550, assets: 2000, custom: 0 },
];

/** ── Peak Hours Analysis ── */
export const MOCK_PEAK_HOURS = [
    { hour: '18:00', guests: 8, tips: 200 },
    { hour: '19:00', guests: 15, tips: 800 },
    { hour: '20:00', guests: 28, tips: 2200 },
    { hour: '21:00', guests: 42, tips: 4500 },
    { hour: '22:00', guests: 55, tips: 6800 },
    { hour: '23:00', guests: 58, tips: 7200 },
    { hour: '00:00', guests: 52, tips: 5800 },
    { hour: '01:00', guests: 38, tips: 3500 },
    { hour: '02:00', guests: 20, tips: 1200 },
    { hour: '03:00', guests: 8, tips: 400 },
];

/** ── Event ROI (for Analytics) ── */
export const MOCK_EVENT_ROI = [
    { event: 'Neon Nights', revenue: 12500, cost: 800, attendees: 48, roi: 14.6 },
    { event: 'Ladies Night', revenue: 9800, cost: 550, attendees: 55, roi: 16.8 },
    { event: 'Lo-Fi Lounge', revenue: 6200, cost: 400, attendees: 32, roi: 14.5 },
    { event: 'Techno Tuesday', revenue: 8400, cost: 600, attendees: 40, roi: 13.0 },
    { event: 'Weekend Rave', revenue: 15000, cost: 1200, attendees: 58, roi: 11.5 },
];
