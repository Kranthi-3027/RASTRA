// =============================================================================
// USER CONTEXT — provides the real authenticated user to all pages
// Replaces MOCK_USER hardcoding throughout the app
// =============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { type AuthResult } from '../services/firebase';

export interface CurrentUser extends User {
  isFirebaseAuth: boolean;
}

interface UserContextValue {
  currentUser: CurrentUser;
  updateCurrentUser: (patch: Partial<CurrentUser>) => void;
}

const DEFAULT_USER: CurrentUser = {
  id: 'guest',
  name: 'Citizen',
  email: '',
  role: UserRole.USER,
  avatarUrl: undefined,
  isFirebaseAuth: false,
};

export const UserContext = createContext<UserContextValue>({
  currentUser: DEFAULT_USER,
  updateCurrentUser: () => {},
});

export function buildCurrentUser(fbUser: AuthResult | null): CurrentUser {
  if (!fbUser) return DEFAULT_USER;
  return {
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Citizen',
    email: fbUser.email || '',
    role: UserRole.USER,
    avatarUrl: fbUser.photoURL || undefined,
    isFirebaseAuth: true,
  };
}

export function UserProvider({ children, fbUser }: React.PropsWithChildren<{ fbUser: AuthResult | null }>) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => buildCurrentUser(fbUser));

  const updateCurrentUser = useCallback((patch: Partial<CurrentUser>) => {
    setCurrentUser(prev => ({ ...prev, ...patch }));
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, updateCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUser {
  return useContext(UserContext).currentUser;
}

export function useUpdateCurrentUser(): (patch: Partial<CurrentUser>) => void {
  return useContext(UserContext).updateCurrentUser;
}
