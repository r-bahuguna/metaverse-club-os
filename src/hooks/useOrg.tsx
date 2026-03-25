/* ==========================================================================
   useOrg — Organization Context for Multi-Tenancy
   Provides orgId and orgName to all dashboard components.
   ========================================================================== */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Organization } from '@/lib/types';

interface OrgContextValue {
    orgId: string | null;
    orgName: string;
    orgSlug: string;
    org: Organization | null;
    loading: boolean;
}

const OrgContext = createContext<OrgContextValue>({
    orgId: null,
    orgName: '',
    orgSlug: '',
    org: null,
    loading: true,
});

export function OrgProvider({ children }: { children: ReactNode }) {
    const { appUser } = useAuth();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!appUser?.orgId) {
            setOrg(null);
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(
            doc(db, 'orgs', appUser.orgId),
            (snap) => {
                if (snap.exists()) {
                    setOrg({ id: snap.id, ...snap.data() } as Organization);
                } else {
                    setOrg(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('[useOrg] Error loading org:', err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [appUser?.orgId]);

    return (
        <OrgContext.Provider
            value={{
                orgId: appUser?.orgId || null,
                orgName: org?.name || appUser?.orgName || '',
                orgSlug: org?.slug || '',
                org,
                loading,
            }}
        >
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    return useContext(OrgContext);
}
