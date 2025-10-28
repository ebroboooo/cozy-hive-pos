
"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, Sprout } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemForm } from '@/components/app/item-form';
import { deleteItem, seedDatabase } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useTranslation } from '@/context/settings-provider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function ItemsPage() {
  const firestore = useFirestore();
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useUser();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  // Redirect if user is not authorized
  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push('/dashboard');
    }
  }, [profile, profileLoading, router]);

  const itemsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'items'), orderBy('name', 'asc')) : null,
    [firestore]
  );
  const { data: items, isLoading: loading } = useCollection<Item>(itemsQuery);
  
  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const result = await deleteItem(firestore, id);
      if (result.success) {
        toast({ title: 'Item Deleted', description: 'The item has been successfully removed.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    }
  };

  const handleSeed = async () => {
    const result = await seedDatabase(firestore);
    if(result.success){
      toast({ title: 'Database Seeded', description: result.success });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }
  
  const canManage = profile?.role?.toLowerCase() === 'admin';

  if (profileLoading || !profile) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
             <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{t('Items Management')}</h1>
          <p className="text-muted-foreground">{t('Add, edit, or delete sale items.')}</p>
        </div>
        {canManage && (
            <div className='flex gap-2'>
                <Button onClick={handleSeed} variant="outline"><Sprout className="mr-2 h-4 w-4" /> {t('Seed Items')}</Button>
                <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> {t('Add New Item')}</Button>
            </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Item List')}</CardTitle>
          <CardDescription>{t('A list of all items available for purchase.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Name')}</TableHead>
                <TableHead>{t('Price')}</TableHead>
                {canManage && <TableHead className="text-right">{t('Actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    {canManage && <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>}
                  </TableRow>
                ))
              ) : items && items.length > 0 ? (
                items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.price.toFixed(2)} EGP</TableCell>
                    {canManage && (
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManage ? 3 : 2} className="h-24 text-center">
                    {t('No items found. Click "Seed Items" to get started.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ItemForm
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
        item={selectedItem}
      />
    </div>
  );
}
