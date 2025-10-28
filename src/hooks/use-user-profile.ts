
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

export function useUserProfile(uid: string | undefined) {
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (firestore && uid ? doc(firestore, 'users', uid) : null),
    [firestore, uid]
  );

  const { data: profile, isLoading: loading, error } = useDoc<UserProfile>(userProfileRef);

  return { profile, loading, error };
}
