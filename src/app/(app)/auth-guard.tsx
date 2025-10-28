
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';

export function AuthGuard({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, isUserLoading } = useUser();
  const { profile, loading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (adminOnly && profile?.role?.toLowerCase() !== 'admin') {
        router.push('/dashboard'); // Redirect non-admins from admin-only pages
      }
    }
  }, [user, profile, isLoading, adminOnly, router]);

  if (isLoading || !user || (adminOnly && profile?.role?.toLowerCase() !== 'admin')) {
    return (
       <div className="flex h-screen w-screen items-center justify-center">
        <div className="space-y-4 p-4 w-full">
            <Skeleton className="h-10 w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
       </div>
    );
  }

  return <>{children}</>;
}
