
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useTransition, useEffect } from 'react';
import { Save, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/hooks/use-toast';
import { useSettings, useTranslation } from '@/context/settings-provider';
import { useUser, useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { clearAllSessions } from '@/lib/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

const formSchema = z.object({
  hourlyRate: z.coerce.number().min(0, 'Hourly rate must be a positive number.'),
  currency: z.string().min(1, 'Currency symbol is required.'),
  theme: z.string(),
  autoLogoutHours: z.coerce.number().min(1),
  enableArabic: z.boolean(),
});

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [isClearing, startClearingTransition] = useTransition();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const loadingSettings = !settings;
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push('/dashboard');
    }
  }, [profile, profileLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: settings,
  });

  const { reset } = form;
  
  React.useEffect(() => {
    if(settings) {
      reset(settings);
    }
  }, [settings, reset]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
      updateSettings(values); 
      toast({
        title: 'Settings Updated',
        description: 'Your changes have been saved.',
      });
    });
  }
  
  function onClearSessions() {
    startClearingTransition(async () => {
        const result = await clearAllSessions(firestore);
        if (result.success) {
            toast({ title: 'Data Cleared', description: result.success });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
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
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('Settings')}</h1>
        <p className="text-muted-foreground">{t('Manage application-wide settings.')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('General Settings')}</CardTitle>
          <CardDescription>{t('Configure the hourly rate and currency for the POS.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSettings ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Hourly Rate')}</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="e.g., 25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Currency Symbol')}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., EGP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Theme')}</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select a theme')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="white">{t('White')}</SelectItem>
                          <SelectItem value="dark">{t('Dark')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="autoLogoutHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Auto-logout Hours')}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="enableArabic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('Enable Arabic Language')}
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" /> {t('Save Changes')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      {canManage && (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
                <ConfirmationDialog
                    trigger={<Button variant="destructive" disabled={isClearing}><Trash className="mr-2 h-4 w-4" /> {isClearing ? 'Deleting...' : 'Delete All Sessions'}</Button>}
                    title="Are you absolutely sure?"
                    description="This action cannot be undone. This will permanently delete all session data from the database."
                    onConfirm={onClearSessions}
                    confirmText="Yes, delete everything"
                />
            </CardContent>
        </Card>
      )}

    </div>
  );
}
