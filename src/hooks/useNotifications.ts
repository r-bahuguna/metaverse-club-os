'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp, limit } from 'firebase/firestore';

export interface AppNotification {
    id: string;
    userId: string;
    type: 'shift_assigned' | 'shift_response' | 'schedule_update' | 'roster_posted' | 'availability_reminder';
    title: string;
    message: string;
    read: boolean;
    eventId?: string;
    createdAt: string;
}

export function useNotifications() {
    const { appUser } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const hasRequestedRef = useRef(false);

    // Request browser notification permission
    const requestPermission = useCallback(async () => {
        if (hasRequestedRef.current) return;
        hasRequestedRef.current = true;

        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermissionGranted(result === 'granted');
        }
    }, []);

    // Show browser notification
    const showBrowserNotification = useCallback((title: string, body: string) => {
        if (permissionGranted && 'Notification' in window && document.visibilityState === 'hidden') {
            try {
                new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    tag: 'risky-desires',
                });
            } catch (e) {
                console.warn('[Notifications] Browser notification failed:', e);
            }
        }
    }, [permissionGranted]);

    // Listen for realtime notifications
    useEffect(() => {
        if (!appUser?.uid) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', appUser.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as AppNotification));

            // Check for new notifications
            const prevIds = new Set(notifications.map(n => n.id));
            for (const n of notifs) {
                if (!prevIds.has(n.id) && !n.read) {
                    showBrowserNotification(n.title, n.message);
                }
            }

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        }, (error) => {
            console.error('[Notifications] Listener error:', error);
        });

        return () => unsubscribe();
    }, [appUser?.uid, showBrowserNotification]); // eslint-disable-line react-hooks/exhaustive-deps

    // Mark as read
    const markRead = useCallback(async (notificationId: string) => {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    }, []);

    // Mark all as read
    const markAllRead = useCallback(async () => {
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n =>
            updateDoc(doc(db, 'notifications', n.id), { read: true })
        ));
    }, [notifications]);

    // Create notification (for use by other components)
    const createNotification = useCallback(async (data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
        await addDoc(collection(db, 'notifications'), {
            ...data,
            read: false,
            createdAt: new Date().toISOString(),
        });
    }, []);

    return {
        notifications,
        unreadCount,
        permissionGranted,
        requestPermission,
        markRead,
        markAllRead,
        createNotification,
    };
}
