/* ==========================================================================
   TypeScript Interfaces — Risky Desires OS
   ========================================================================== */

/** Role hierarchy for access control */
export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'general_manager'
  | 'manager'
  | 'dj'
  | 'host'
  | 'vip_member'
  | 'member'; // "Risky Addicts"

/** Application user profile (Firestore-backed) */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  secondaryRoles?: UserRole[];
  slName?: string;
  slUuid?: string;
  createdAt?: string;
  createdBy?: string;
  onlineStatus?: OnlineStatus;
  mustChangePassword?: boolean;
}

/** Staff online status */
export type OnlineStatus = 'online' | 'away' | 'offline';

/** Shift status */
export type ShiftStatus = 'scheduled' | 'active' | 'completed' | 'cancelled' | 'no_show';

/** Shift response from staff */
export type ShiftResponse = 'pending' | 'accepted' | 'declined' | 'reschedule_requested';

/** Staff feed message type */
export type FeedMessageType = 'alert' | 'message' | 'system';

/** Expense category */
export type ExpenseCategory = 'sploder' | 'fishbowl' | 'asset_purchase' | 'custom';

/** User profile (staff or member) */
export interface User {
  id: string;
  displayName: string;
  slName: string;         // Second Life display name
  slUuid: string;         // Second Life UUID
  role: UserRole;
  avatarUrl?: string;
  onlineStatus: OnlineStatus;
  joinedDate: string;
  lastSeen: string;
}

/** Staff-specific profile extension */
export interface StaffMember extends User {
  role: Extract<UserRole, 'owner' | 'general_manager' | 'manager' | 'dj' | 'host'>;
  specialties?: string[]; // e.g., ["House", "Techno"] for DJs
  hoursThisWeek: number;
  tipsThisWeek: number;
  rating?: number;        // 1-5 star rating
  bio?: string;
}

/** Schedule shift */
export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: Extract<UserRole, 'dj' | 'host' | 'manager'>;
  date: string;           // ISO date 
  startTime: string;      // "22:00"
  endTime: string;        // "02:00"
  status: ShiftStatus;
  response: ShiftResponse;
  notes?: string;
}

/** Staff availability window for smart scheduling */
export interface Availability {
  id: string;
  staffId: string;
  staffName: string;
  role: Extract<UserRole, 'dj' | 'host'>;
  date: string;
  startTime: string;
  endTime: string;
}

/** Proposed pairing from smart scheduler */
export interface SchedulePairing {
  id: string;
  eventId: string;
  eventName: string;
  date: string;
  djId: string;
  djName: string;
  hostId: string;
  hostName: string;
  status: 'proposed' | 'approved' | 'rejected';
}

/** Event listing */
export interface ClubEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  djId?: string;
  hostId?: string;
  genre?: string;
  coverImage?: string;
  isRecurring: boolean;
}

/** Tip transaction */
export interface TipRecord {
  id: string;
  timestamp: string;
  amount: number;         // in L$ (Linden Dollars)
  tipperName: string;
  recipientId: string;
  recipientName: string;
  category: 'club' | 'host' | 'dj' | 'dancer_1' | 'dancer_2';
  source: string;         // e.g., "DG-T 200 Club Jar"
}

/** Expense record */
export interface Expense {
  id: string;
  name: string;
  amount: number;         // L$
  category: ExpenseCategory;
  customCategory?: string;
  date: string;
  notes?: string;
  createdBy: string;      // staff ID
}

/** Dashboard quick stats */
export interface DashboardStats {
  staffOnline: number;
  totalStaff: number;
  tonightRevenue: number;
  weeklyRevenue: number;
  upcomingEvents: number;
  peakGuests: number;
  averageVibe: number;    // 1-10
  currentGuests: number;
  maxCapacity: number;
  avgSpendPerGuest: number;
  tipsClub: number;
  tipsHost: number;
  tipsDj: number;
  groupMembersJoined: number;
  groupMembersOnline: number;
  newMembersThisEvent: number;
}

/** Guest visit record for "new guests" display */
export interface GuestVisit {
  id: string;
  name: string;
  joinedAt: string;       // ISO timestamp
  duration: number;       // minutes
  isNewMember: boolean;
}

/** Staff feed message */
export interface StaffFeedMessage {
  id: string;
  type: FeedMessageType;
  message: string;
  timestamp: string;
}

/** Active station data for DJ Booth & Host Station */
export interface DjBoothData {
  djName: string;
  slUsername: string;
  genre: string;
  currentTrack: string;
  tipsThisSession: number;
  isLive: boolean;
  streamUrl: string;
}

export interface HostStationData {
  hostName: string;
  status: 'active' | 'break';
  guestsGreeted: number;
}

/** Navigation item */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;           // Lucide icon name
  neonColor: string;      // hex color for icon
  requiredRoles: UserRole[];
  badge?: number;
}

/** Role metadata for display */
export interface RoleConfig {
  role: UserRole;
  label: string;
  shortLabel: string;
  color: string;        // CSS variable name 
  neonClass: string;    // glass-neon-* class
  iconName: string;     // Lucide icon
}
