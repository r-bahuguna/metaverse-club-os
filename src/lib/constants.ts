/* ==========================================================================
   Constants — Metaverse Club OS
   ========================================================================== */

import { NavItem, RoleConfig, UserRole } from './types';

/** Role configuration with colors and labels */
export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
    super_admin: {
        role: 'super_admin',
        label: 'Super Admin',
        shortLabel: 'SA',
        color: '--neon-red',
        neonClass: 'glass-neon-cyan',
        iconName: 'ShieldCheck',
    },
    owner: {
        role: 'owner',
        label: 'Owner',
        shortLabel: 'OWN',
        color: '--neon-amber',
        neonClass: 'glass-neon-cyan',
        iconName: 'Crown',
    },
    general_manager: {
        role: 'general_manager',
        label: 'General Manager',
        shortLabel: 'GM',
        color: '--neon-cyan',
        neonClass: 'glass-neon-cyan',
        iconName: 'Shield',
    },
    manager: {
        role: 'manager',
        label: 'Manager',
        shortLabel: 'MGR',
        color: '--neon-green',
        neonClass: 'glass-neon-green',
        iconName: 'UserCog',
    },
    dj: {
        role: 'dj',
        label: 'DJ',
        shortLabel: 'DJ',
        color: '--neon-purple',
        neonClass: 'glass-neon-purple',
        iconName: 'Headphones',
    },
    host: {
        role: 'host',
        label: 'Host',
        shortLabel: 'HOST',
        color: '--neon-pink',
        neonClass: 'glass-neon-pink',
        iconName: 'Mic',
    },
    vip_member: {
        role: 'vip_member',
        label: 'VIP Member',
        shortLabel: 'VIP',
        color: '--neon-amber',
        neonClass: 'glass-neon-cyan',
        iconName: 'Star',
    },
    member: {
        role: 'member',
        label: 'Club Member',
        shortLabel: 'MBR',
        color: '--text-secondary',
        neonClass: '',
        iconName: 'User',
    },
};

/** Navigation items with role-based access and neon icon colors */
export const NAV_ITEMS: NavItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        neonColor: '#4ade80',   // green
        requiredRoles: ['super_admin', 'owner', 'general_manager', 'manager', 'dj', 'host', 'vip_member', 'member'],
    },
    {
        id: 'schedule',
        label: 'Schedule',
        href: '/dashboard/schedule',
        icon: 'CalendarDays',
        neonColor: '#c084fc',   // purple
        requiredRoles: ['super_admin', 'owner', 'general_manager', 'manager', 'dj', 'host'],
    },
    {
        id: 'staff',
        label: 'Staff',
        href: '/dashboard/staff',
        icon: 'Users',
        neonColor: '#ff6b9d',   // pink
        requiredRoles: ['super_admin', 'owner', 'general_manager', 'manager'],
    },
    {
        id: 'analytics',
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: 'BarChart3',
        neonColor: '#00f0ff',   // cyan
        requiredRoles: ['super_admin', 'owner', 'general_manager'],
    },
    {
        id: 'events',
        label: 'Events',
        href: '/dashboard/events',
        icon: 'PartyPopper',
        neonColor: '#fbbf24',   // amber
        requiredRoles: ['super_admin', 'owner', 'general_manager', 'manager', 'dj', 'host', 'vip_member', 'member'],
    },
    {
        id: 'settings',
        label: 'Settings',
        href: '/dashboard/settings',
        icon: 'Settings',
        neonColor: 'rgba(255,255,255,0.7)', // white
        requiredRoles: ['super_admin', 'owner', 'general_manager', 'manager', 'dj', 'host', 'vip_member', 'member'],
    },
    {
        id: 'logs',
        label: 'Logs',
        href: '/dashboard/logs',
        icon: 'ScrollText',
        neonColor: '#94a3b8',   // slate
        requiredRoles: ['super_admin', 'owner'],
    },
    {
        id: 'apply',
        label: 'Apply',
        href: '/dashboard/apply',
        icon: 'Zap',
        neonColor: '#4ade80',   // green
        requiredRoles: ['super_admin', 'owner', 'general_manager', 'manager', 'dj', 'host', 'vip_member', 'member'],
    },
];

/** Role hierarchy — higher index = more privileges */
export const ROLE_HIERARCHY: UserRole[] = [
    'member',
    'vip_member',
    'host',
    'dj',
    'manager',
    'general_manager',
    'owner',
    'super_admin',
];

/** Check if a role has at least the required privilege level */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}

/** Expense categories */
export const EXPENSE_CATEGORIES = [
    { value: 'sploder', label: 'Sploder Payout' },
    { value: 'fishbowl', label: 'Fishbowl Raffle' },
    { value: 'asset_purchase', label: 'Asset Purchase' },
    { value: 'custom', label: 'Custom' },
] as const;

/** Brand constants */
export const BRAND = {
    name: 'Metaverse Club OS',
    tagline: 'Command Center',
    version: '1.0.0-alpha',
} as const;

/** Discord server config */
export const DISCORD = {
    guildId: '1462519920091725856',
    widgetUrl: 'https://discord.com/widget?id=1462519920091725856&theme=dark',
    jsonApi: 'https://discord.com/api/guilds/1462519920091725856/widget.json',
} as const;
