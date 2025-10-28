
"use client";

import React, { useState, useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { format, startOfDay, endOfDay, isToday, isYesterday, subDays, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Banknote, CreditCard } from 'lucide-react';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Session, Settings } from '@/lib/types';
import { useSettings, useTranslation } from '@/context/settings-provider';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function SummaryView() {
  const firestore = useFirestore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { settings } = useSettings();
  const { t } = useTranslation();

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sessions'));
  }, [firestore]);

  const { data: allSessions, isLoading: loading } = useCollection<Session>(sessionsQuery);
  
  const filteredSessions = useMemo(() => {
    if (!allSessions) return [];
    
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    return allSessions.filter(session => {
      if (session.status !== 'completed' || !session.exitTime) {
        return false;
      }
      const exitTimeMillis = session.exitTime.toMillis();
      return exitTimeMillis >= start.getTime() && exitTimeMillis <= end.getTime();
    });
  }, [allSessions, selectedDate]);

  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
        const timeA = a.exitTime ? a.exitTime.toMillis() : 0;
        const timeB = b.exitTime ? b.exitTime.toMillis() : 0;
        return timeB - timeA;
    });
  }, [filteredSessions]);

  const currency = settings?.currency ?? 'EGP';

  const { totalIncome, cashIncome, instapayIncome } = useMemo(() => {
    return filteredSessions.reduce(
      (acc, session) => {
        const amount = session.finalAmount ?? 0;
        acc.totalIncome += amount;
        if (session.paymentMethod === 'cash') {
          acc.cashIncome += amount;
        } else if (session.paymentMethod === 'instapay') {
          acc.instapayIncome += amount;
        }
        return acc;
      },
      { totalIncome: 0, cashIncome: 0, instapayIncome: 0 }
    );
  }, [filteredSessions]);


  const handlePreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };
  
  const getDisplayDate = () => {
    if (isToday(selectedDate)) return t('Today');
    if (isYesterday(selectedDate)) return t('Yesterday');
    return format(selectedDate, "PPP");
  }

  const handleExportCSV = () => {
    if (sortedSessions.length === 0) {
      alert("No data to export.");
      return;
    }
  
    const headers = ["Customer", "Checkout Time", "Duration (Minutes)", "Subtotal", "Discount", "Final Amount", "Payment Method"];
    const csvRows = [headers.join(",")];
  
    sortedSessions.forEach(session => {
      const row = [
        `"${session.name.replace(/"/g, '""')}"`,
        session.exitTime ? `"${format(session.exitTime.toDate(), 'PPpp')}"` : 'N/A',
        session.durationMinutes ?? 'N/A',
        session.totalCost?.toFixed(2) ?? 'N/A',
        session.discount?.toFixed(2) ?? '0.00',
        session.finalAmount?.toFixed(2) ?? 'N/A',
        session.paymentMethod ?? 'N/A'
      ];
      csvRows.push(row.join(","));
    });
  
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = `Cozy-Hive_Summary_${format(selectedDate, "yyyy-MM-dd")}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Total Income')}</CardTitle>
            <span className="text-muted-foreground">💰</span>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : 
            <div className="text-2xl font-bold">{totalIncome.toFixed(2)} {currency}</div>
            }
            <p className="text-xs text-muted-foreground">
              {t('Total revenue for')} {getDisplayDate()}.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Completed Sessions')}</CardTitle>
            <span className="text-muted-foreground">👥</span>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> :
            <div className="text-2xl font-bold">{filteredSessions.length}</div>
            }
            <p className="text-xs text-muted-foreground">
              {t('Customers checked out for')} {getDisplayDate()}.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Income</CardTitle>
            <Banknote className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : 
            <div className="text-2xl font-bold">{cashIncome.toFixed(2)} {currency}</div>
            }
            <p className="text-xs text-muted-foreground">
              {t('Total revenue for')} {getDisplayDate()}.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instapay Income</CardTitle>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : 
            <div className="text-2xl font-bold">{instapayIncome.toFixed(2)} {currency}</div>
            }
            <p className="text-xs text-muted-foreground">
              {t('Total revenue for')} {getDisplayDate()}.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{t('Session History')}</CardTitle>
            <CardDescription>{t('A list of all completed sessions for the selected day.')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-32 text-center font-medium">
                {getDisplayDate()}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isToday(selectedDate)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> {t('Export CSV')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Customer')}</TableHead>
                <TableHead>{t('Checkout Time')}</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Final Amount</TableHead>
                <TableHead className="text-right">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedSessions && sortedSessions.length > 0 ? (
                sortedSessions.map(session => {
                    return (
                        <TableRow key={session.id}>
                            <TableCell className="font-medium">{session.name}</TableCell>
                            <TableCell>{session.exitTime ? format(session.exitTime.toDate(), 'PPpp') : 'N/A'}</TableCell>
                            <TableCell>{session.totalCost?.toFixed(2)} {currency}</TableCell>
                            <TableCell className="text-destructive">-{session.discount?.toFixed(2)} {currency}</TableCell>
                            <TableCell className="font-medium">{session.finalAmount?.toFixed(2)} {currency}</TableCell>
                             <TableCell className="text-right capitalize">{session.paymentMethod}</TableCell>
                        </TableRow>
                    )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('No completed sessions for')} {getDisplayDate()}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
