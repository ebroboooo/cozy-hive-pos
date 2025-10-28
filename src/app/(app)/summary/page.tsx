
"use client";

import { useEffect } from 'react';
import { SummaryView } from '@/components/app/summary-view';
import { useTranslation } from '@/context/settings-provider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function SummaryPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!profileLoading && profile?.role?.toLowerCase() !== 'admin') {
      router.push('/dashboard');
    }
  }, [profile, profileLoading, router]);

  if (profileLoading || profile?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><Skeleton className="h-28 w-full" /></Card>
          <Card><Skeleton className="h-28 w-full" /></Card>
        </div>
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('Summary')}</h1>
        <p className="text-muted-foreground">{t('Review completed sessions and income.')}</p>
      </div>
      <SummaryView />
    </div>
  );
}
