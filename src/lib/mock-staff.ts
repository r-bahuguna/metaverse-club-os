export const MOCK_STAFF_LIST = [
    { uid: 'u1', displayName: 'NovaStar Resident', role: 'owner', status: 'active', slName: 'Nova' },
    { uid: 'u2', displayName: 'Orion Vantara', role: 'owner', status: 'active', slName: 'Orion' },
    { uid: 'u3', displayName: 'Vera Billig', role: 'owner', status: 'active', slName: 'Vera' },
    { uid: 'u4', displayName: 'Zaneth Resident', role: 'general_manager', status: 'active', slName: 'Zane', secondaryRoles: ['dj'] },
    { uid: 'u5', displayName: 'Lyra Noir', role: 'manager', status: 'active', slName: 'Lyra' },
    { uid: 'u6', displayName: 'Echo Veil', role: 'manager', status: 'active', slName: 'Echo' },
    { uid: 'u7', displayName: 'Mira Spire', role: 'vip_member', status: 'active', slName: 'Mira', secondaryRoles: ['host'] },
    { uid: 'u8', displayName: 'Apex Resident', role: 'dj', status: 'active', slName: 'DJ Apex' },
    { uid: 'u9', displayName: 'Caspian Resident', role: 'dj', status: 'active', slName: 'DJ Caspian' },
    { uid: 'u10', displayName: 'Sable Resident', role: 'dj', status: 'active', slName: 'DJ Sable' },
    { uid: 'u11', displayName: 'Flint Resident', role: 'dj', status: 'active', slName: 'DJ Flint' },
    { uid: 'u12', displayName: 'Koya Resident', role: 'dj', status: 'active', slName: 'DJ Koya' },
    { uid: 'u13', displayName: 'Vex Resident', role: 'dj', status: 'active', slName: 'DJ Vex' },
    { uid: 'u14', displayName: 'Remi Resident', role: 'host', status: 'active', slName: 'Remi' },
    { uid: 'u15', displayName: 'Ivy Lace', role: 'host', status: 'active', slName: 'Ivy' },
    { uid: 'u16', displayName: 'Soleil Resident', role: 'host', status: 'active', slName: 'Soleil' },
    { uid: 'u17', displayName: 'Wren Dusk', role: 'host', status: 'active', slName: 'Wren' }
];

export const MOCK_PRESENCE_MAP = new Map([
    ['u1', { discordStatus: 'online', isOnWebsite: true }],
    ['u4', { discordStatus: 'online', isOnWebsite: false }],
    ['u8', { discordStatus: 'dnd', isOnWebsite: true }],
    ['u14', { discordStatus: 'idle', isOnWebsite: true }],
    ['u5', { discordStatus: 'online', isOnWebsite: true }],
]);
