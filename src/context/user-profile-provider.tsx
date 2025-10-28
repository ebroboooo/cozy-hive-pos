
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { UserProfile } from '@/lib/types';

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { profile, loading } = useUserProfile(user?.uid);

  return (
    <UserProfileContext.Provider value={{ profile, loading }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider');
  }
  return context;
}
