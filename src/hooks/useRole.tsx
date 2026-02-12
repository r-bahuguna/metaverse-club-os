'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { UserRole, AppUser } from '@/lib/types';
import { hasPermission, ROLE_CONFIG } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

interface RoleContextValue {
    /** Resolved app user (null for anonymous guests) */
    currentUser: AppUser | null;
    /** Active role — from Firestore profile or 'member' for guests */
    currentRole: UserRole;
    /** Super Admin can switch role for debugging */
    switchRole: (role: UserRole) => void;
    /** Permission check against active role */
    can: (requiredRole: UserRole) => boolean;
    isStaff: boolean;
    isManagement: boolean;
    isSuperAdmin: boolean;
    isGuest: boolean;
    roleLabel: string;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const { appUser, isAnonymous, isSuperAdmin } = useAuth();

    /* Super Admin override — stored in state for dev role switching */
    const [overrideRole, setOverrideRole] = React.useState<UserRole | null>(null);

    /* Determine the active role */
    const resolvedRole: UserRole = (() => {
        // Super Admin override takes priority (for debugging)
        if (isSuperAdmin && overrideRole) return overrideRole;
        // Firestore profile has authority
        if (appUser?.role) return appUser.role;
        // Anonymous users are members (Risky Addicts)
        if (isAnonymous) return 'member';
        // Fallback
        return 'member';
    })();

    const switchRole = useCallback((role: UserRole) => {
        // Only super admin can switch roles
        if (isSuperAdmin) {
            setOverrideRole(role);
        }
    }, [isSuperAdmin]);

    const can = useCallback((requiredRole: UserRole) => {
        return hasPermission(resolvedRole, requiredRole);
    }, [resolvedRole]);

    const isStaff = hasPermission(resolvedRole, 'host');
    const isManagement = hasPermission(resolvedRole, 'manager');
    const isGuest = isAnonymous && !appUser;
    const roleLabel = ROLE_CONFIG[resolvedRole]?.label ?? 'Guest';

    return (
        <RoleContext.Provider
            value={{
                currentUser: appUser,
                currentRole: resolvedRole,
                switchRole,
                can,
                isStaff,
                isManagement,
                isSuperAdmin,
                isGuest,
                roleLabel,
            }}
        >
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const ctx = useContext(RoleContext);
    if (!ctx) throw new Error('useRole must be used within RoleProvider');
    return ctx;
}
