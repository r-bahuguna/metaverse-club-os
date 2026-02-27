'use client';

import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '@/lib/types';

interface RoleContextType {
    role: UserRole | null;
    setRole: (role: UserRole | null) => void;
    can: (requiredRole: UserRole) => boolean;
    isGuest: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const roleHierarchy: Record<UserRole, number> = {
    super_admin: 100,
    owner: 90,
    general_manager: 80,
    manager: 70,
    dj: 40,
    host: 40,
    vip_member: 20,
    member: 10,
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<UserRole | null>('super_admin');

    const can = (requiredRole: UserRole) => {
        if (!role) return false;
        return roleHierarchy[role] >= roleHierarchy[requiredRole];
    };

    const isGuest = !role;

    return (
        <RoleContext.Provider value={{ role, setRole, can, isGuest }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
