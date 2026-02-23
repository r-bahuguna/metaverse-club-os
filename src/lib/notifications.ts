/* ==========================================================================
   Notification utility — creates notification docs in Firestore.
   
   This is a standalone utility (not a hook) so it can be called from
   any component or handler without needing the useNotifications hook.
   ========================================================================== */

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export type NotificationType =
    | 'shift_assigned'
    | 'shift_response'
    | 'shift_cancelled'
    | 'schedule_update'
    | 'roster_posted'
    | 'availability_reminder';

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    eventId?: string;
}

/** Create a single notification for a specific user */
export async function createNotification(data: CreateNotificationInput): Promise<void> {
    try {
        await addDoc(collection(db, 'notifications'), {
            ...data,
            read: false,
            createdAt: new Date().toISOString(),
        });
    } catch (err) {
        console.warn('[notify] Failed to create notification:', err);
    }
}

/** Notify all managers (manager, general_manager, owner, super_admin) */
export async function notifyManagers(
    type: NotificationType,
    title: string,
    message: string,
    eventId?: string,
): Promise<void> {
    try {
        const usersSnap = await getDocs(query(collection(db, 'users')));
        const managerRoles = ['manager', 'general_manager', 'owner', 'super_admin'];
        const managers = usersSnap.docs
            .filter(d => managerRoles.includes(d.data().role))
            .map(d => d.id);

        await Promise.all(managers.map(uid =>
            createNotification({ userId: uid, type, title, message, eventId })
        ));
    } catch (err) {
        console.warn('[notify] Failed to notify managers:', err);
    }
}
