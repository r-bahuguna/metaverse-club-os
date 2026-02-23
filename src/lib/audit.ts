/* ==========================================================================
   Audit Log Helper — Risky Desires OS
   Logs every significant action to Firestore `audit_logs` collection.
   ========================================================================== */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type AuditAction =
    | 'event_created'
    | 'event_updated'
    | 'event_deleted'
    | 'staff_created'
    | 'staff_updated'
    | 'staff_deactivated'
    | 'roster_posted'
    | 'schedule_assigned'
    | 'availability_set'
    | 'tip_received'
    | 'login'
    | 'logout'
    | 'settings_changed'
    | 'notification_sent';

export interface AuditLogEntry {
    action: AuditAction;
    actorId: string;
    actorName: string;
    targetId?: string;
    targetName?: string;
    details?: string;
    metadata?: Record<string, unknown>;
    timestamp?: unknown; // serverTimestamp
}

/**
 * Log an action to the audit_logs collection.
 * Fire-and-forget — errors are swallowed to avoid breaking the main flow.
 */
export async function logAction(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
        await addDoc(collection(db, 'audit_logs'), {
            ...entry,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[audit] Failed to log action:', err);
    }
}
