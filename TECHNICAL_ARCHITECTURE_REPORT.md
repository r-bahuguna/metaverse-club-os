# Risky Desires OS: Comprehensive Technical Architecture & Developer Guide

**Document Version:** 1.0.0  
**Last Updated:** February 25, 2026  
**Project Root:** `/Users/entropyrahul/risky-desires-os/risky-desires`

This document provides an end-to-end technical overview of the Risky Desires OS SaaS platform, intended for developers or stakeholders without direct codebase access.

---

## 1. System Overview
Risky Desires OS is a specialized ERP and Dashboard for Second Life (SL) clubs. It manages staff scheduling, real-time financial tracking, and guest engagement.

### Core Tech Stack:
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS.
- **Backend:** Next.js API Routes (Node.js), Firebase Admin SDK.
- **Database:** Google Cloud Firestore (NoSQL).
- **Auth:** Firebase Auth (Email/Pass + Custom Claims).
- **Hosting:** Firebase App Hosting (Google Cloud Run backend).

---

## 2. Component Inventory

### **A. Frontend Pages (src/app)**
- `/dashboard`: Main Command Center (Live Floor, Vibe Graph, Real-Time Stats).
- `/dashboard/analytics`: Revenue, Expense, and ROI trends.
- `/dashboard/schedule`: Calendar view and shift management.
- `/dashboard/staff`: Roster management, specialty tracking, and rating.
- `/dashboard/settings`: Profile management and system configuration.
- `/login`: Email/Password entry and guest access gateway.

### **B. Core UI Components (src/components/ui)**
- `GlassCard`: The primary container with glassmorphism (blur, border, neon glow).
- `StatusBadge`: Animated online/offline indicators.
- `NavItem`: Sidebar navigation with role-based visibility.

### **C. State Management & Hooks (src/hooks)**
- `useAuth`: Manages Firebase Auth state, profile fetching, and web presence heartbeats.
- `useRole`: Resolves permissions via hierarchy and custom claims.
- `usePresence`: Tracks user "Online/Away/Offline" status.

---

## 3. Data Models (Schema)
Located in `src/lib/types.ts`. This defines the entire Firestore schema.

### **Core Interfaces**
```typescript
/** Role hierarchy for access control */
export type UserRole = 'super_admin' | 'owner' | 'general_manager' | 'manager' | 'dj' | 'host' | 'vip_member' | 'member';

/** User Profile */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  secondaryRoles?: UserRole[];
  slName?: string;
  slUuid?: string;
  discordUsername?: string;
  createdAt?: string;
  onlineStatus?: 'online' | 'away' | 'offline';
  mustChangePassword?: boolean;
}

/** Unified Event & Schedule Assignment */
export interface ClubEvent {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  date: string;                  // YYYY-MM-DD
  startTime: string;             // HH:mm
  endTime: string;
  djId?: string;
  djName?: string;
  djResponse?: 'pending' | 'accepted' | 'declined';
  hostId?: string;
  hostName?: string;
  hostResponse?: 'pending' | 'accepted' | 'declined';
  status: 'draft' | 'scheduled' | 'confirmed' | 'live' | 'completed' | 'cancelled';
  imageUrl?: string;
}

/** Financial Records */
export interface TipRecord {
  id: string;
  timestamp: string;
  amount: number;         // L$ (Linden Dollars)
  tipperName: string;
  recipientId: string;
  category: 'club' | 'host' | 'dj' | 'dancer_1' | 'dancer_2';
}
```

---

## 4. Business Logic: Smart Scheduling
Located in `src/app/api/schedule/auto-assign/route.ts`. 

### **The Scoring Algorithm**
The system proposes assignments for unassigned events using a weighted score (0-100):

1.  **Availability (40%):** Matches the event date/time against staff `availability` records (supports single, range, and recurring days).
2.  **Fairness (30%):** Calculates `monthlyShifts` for each candidate.
    - `Score = Math.max(0, 30 - monthlyShifts * 5)`
3.  **Genre Match (20%):** Compares the event's `genre` string against the DJ's `preferredGenres`.
4.  **Recency (10%):** Rewards staff who haven't worked recently to prevent burnout.

```typescript
// Time overlap detection logic
function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    const a0 = timeToMinutes(aStart);
    let a1 = timeToMinutes(aEnd);
    const b0 = timeToMinutes(bStart);
    let b1 = timeToMinutes(bEnd);
    if (a1 <= a0) a1 += 1440; // Midnight cross
    if (b1 <= b0) b1 += 1440;
    return a0 < b1 && b0 < a1;
}
```

---

## 5. Security & RBAC (Role-Based Access Control)

### **A. Role Hierarchy**
Managed in `src/hooks/useRole.tsx` and `src/lib/constants.ts`.
- `super_admin`: Full system access, bypasses all checks.
- `manager+`: Can create users, edit schedules, view revenue.
- `staff` (DJ/Host): Can view roster, respond to assignments, update own profile.
- `member`: Read-only access to public event listings.

### **B. Custom Claims**
Upon user creation (`/api/create-user`), the Firebase Admin SDK injects a `role` claim into the Auth token. This allows Firestore Security Rules to verify permissions without an extra database lookup.

### **C. Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function hasRole(role) { return request.auth.token.role == role; }
    
    match /users/{userId} {
      allow read: if isSignedIn();
      allow update: if (request.auth.uid == userId) || hasRole('manager');
    }

    match /events/{eventId} {
      allow read: if true;
      allow create, delete: if hasRole('manager');
      allow update: if hasRole('manager') || 
        (resource.data.djId == request.auth.uid && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['djResponse', 'djMessage']));
    }
    
    match /tips/{tipId} {
      allow create: if isSignedIn();
      allow read: if hasRole('manager') || resource.data.recipientId == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

---

## 6. Real-Time Presence Engine
The platform implements a robust presence system to track staff online/offline status for scheduling.

1.  **Heartbeat:** A `useEffect` in `useAuth.tsx` updates the `lastSeen` timestamp every 2 minutes while the tab is active.
2.  **Visibility Tracking:** Monitors the `visibilitychange` event. When the tab is hidden, status switches to `away`.
3.  **Reliable Disconnect:** Uses `navigator.sendBeacon` during the `beforeunload` event to perform a last-second update to `offline` status in Firestore.

---

## 7. Infrastructure & Deployment
- **Provider:** Google Firebase.
- **Service Configuration (`apphosting.yaml`):**
  ```yaml
  runConfig:
    minInstances: 0  # Cold starts possible, cost-efficient
    maxInstances: 2  # Hard limit on resource usage
    cpu: 1
    memoryMiB: 512
  env:
    - variable: FIREBASE_ADMIN_PROJECT_ID
      value: risky-desires
  ```
- **Secrets Management:** `FIREBASE_ADMIN_PRIVATE_KEY` is injected from Firebase Secrets into the API routes to allow privileged DB access.

---

## 8. Feature Status (Implemented vs. Placeholder)

### **Implemented**
- **Auth Flow:** Complete (Login, Anonymous, Sign Out).
- **User Management:** Functional API for creating/updating staff.
- **Smart Scheduling:** Core algorithm for auto-assignment is functional.
- **Navigation:** Fully dynamic RBAC-based sidebar.

### **Placeholder (Current Mock Data)**
- **Revenue Charts:** Currently importing from `MOCK_REVENUE_TREND`. Needs integration with `tips` collection aggregation.
- **Live Stream Player:** Uses `MOCK_DJ_BOOTH.streamUrl`. Needs profile-based dynamic fetching.
- **Vibe Graph:** Uses `MOCK_TIP_HISTORY`. Needs real-time listener on `tips`.
- **Guest List:** Uses `MOCK_GUEST_VISITS`. Needs SL Script HTTP integration.

---

## 9. Performance & Scalability Analysis
1.  **Database Scalability:** Firestore handles millions of documents, but the current `auto-assign` API fetches *all* availability records. As staff count grows (>100), this should transition to a paginated or filtered query.
2.  **Frontend Performance:** Uses `Framer Motion` for layout transitions. Heavy use of `backdrop-filter: blur` in CSS can impact low-end mobile performance; recommend a fallback for Safari/Older Chrome.
3.  **Cold Starts:** Next.js API routes on Firebase App Hosting are serverless. Expect a 1-3s delay on the first request after inactivity.

---

## 10. Recommended Next Steps
1.  **Testing Suite:** Install `vitest` and write unit tests for the `auto-assign` score calculation.
2.  **Live Listeners:** Replace `useEffect` fetches in the dashboard with `onSnapshot` Firestore listeners for real-time tip tracking.
3.  **Aggregations:** Implement a Cloud Function or Cron Job to pre-calculate `weeklyRevenue` and `peakGuests` to avoid expensive client-side queries.
