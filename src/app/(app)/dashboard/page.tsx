
"use client";

import React from 'react';
import type { Item, Session } from '@/lib/types';
import { AddCustomerForm } from '@/components/app/add-customer-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { CustomerCard } from '@/components/app/customer-card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/context/settings-provider';

export default function DashboardPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const { t } = useTranslation();

  // Fetch all sessions and filter on the client
  const sessionsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'sessions')) : null,
    [firestore]
  );
  const { data: allSessions, isLoading: loadingSessions } = useCollection<Session>(sessionsQuery);

  const activeSessions = React.useMemo(() => {
    return allSessions?.filter(session => session.status === 'active') || [];
  }, [allSessions]);

  const filteredSessions = React.useMemo(() => {
    if (!searchQuery) {
      return activeSessions;
    }
    return activeSessions.filter(session =>
      session.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSessions, searchQuery]);
  
  const itemsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'items')) : null,
    [firestore]
  );
  const { data: allItems, isLoading: loadingItems } = useCollection<Item>(itemsQuery);
  
  const isLoading = loadingSessions || loadingItems;
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">{t('Dashboard')}</h1>
                <p className="text-muted-foreground">{t('Manage active customer sessions.')}</p>
            </div>
             <AddCustomerForm />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight font-headline">{t('Active Customers')} ({filteredSessions?.length || 0})</h2>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder={t('Search by name...')}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4 border rounded-xl">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className='space-y-2 flex-1'>
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </div>
            ))}
           </div>
        ) : filteredSessions && filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSessions.map(session => (
              <CustomerCard key={session.id} session={session} allItems={allItems || []} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery ? t('No customers found') : t('No active customers')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? t('Try a different search term.') : t('Start a new session to see customers here.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
