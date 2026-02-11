'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserRole, User } from '@/lib/types';
import { MOCK_STAFF } from '@/lib/mock-data';
import { hasPermission } from '@/lib/constants';

interface RoleContextValue {
    currentUser: User;
    currentRole: UserRole;
    switchRole: (role: UserRole) => void;
    can: (requiredRole: UserRole) => boolean;
    isStaff: boolean;
    isManagement: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [currentRole, setCurrentRole] = useState<UserRole>('owner');

    const currentUser = MOCK_STAFF.find(s => s.role === currentRole) || MOCK_STAFF[0];

    const switchRole = useCallback((role: UserRole) => {
        setCurrentRole(role);
    }, []);

    const can = useCallback((requiredRole: UserRole) => {
        return hasPermission(currentRole, requiredRole);
    }, [currentRole]);

    const isStaff = hasPermission(currentRole, 'host');
    const isManagement = hasPermission(currentRole, 'manager');

    return (
        <RoleContext.Provider
            value={{ currentUser: currentUser as User, currentRole, switchRole, can, isStaff, isManagement }}
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
