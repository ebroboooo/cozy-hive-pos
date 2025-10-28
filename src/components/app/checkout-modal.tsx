
"use client";

import { useTransition, useState, useEffect } from "react";
import { differenceInMinutes } from "date-fns";
import { Banknote, CreditCard, LogOut, Receipt, Trash2, X } from "lucide-react";

import type { Session } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { checkoutSession, cancelSession } from "@/lib/actions";
import { useSettings } from "@/context/settings-provider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFirestore } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface CheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  session: Session;
}

export function CheckoutModal({ isOpen, onOpenChange, session }: CheckoutModalProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [discount, setDiscount] = useState(0);
  const firestore = useFirestore();
  const { settings } = useSettings();

  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
      setDiscount(0); // Reset discount when modal opens
      return () => clearInterval(timer);
    }
  }, [isOpen]);
  
  const calculateTimeCost = (durationMinutes: number): number => {
    if (durationMinutes <= 0) return 0;
    const hourlyRate = settings.hourlyRate;
    const maxCharge = 100;
    const maxHoursCap = 4;
    
    const durationHours = durationMinutes / 60;
  
    if (durationHours > maxHoursCap) {
      return maxCharge;
    }
    
    const hoursCharged = Math.ceil(durationHours);
    return hoursCharged * hourlyRate;
  }

  const entryTime = session.entryTime ? session.entryTime.toDate() : new Date();
  const durationMinutes = differenceInMinutes(currentTime, entryTime);
  
  const currency = settings?.currency ?? 'EGP';

  const timeCost = calculateTimeCost(durationMinutes);
  const itemsCost = session.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCost = timeCost + itemsCost;
  const finalAmount = totalCost - discount;

  async function handleCheckout(paymentMethod: 'cash' | 'instapay') {
    startTransition(async () => {
      const finalDurationMinutes = differenceInMinutes(new Date(), entryTime);
      
      const result = await checkoutSession(firestore, session.id, totalCost, discount, finalAmount, paymentMethod, finalDurationMinutes);
      if (result.success) {
        toast({
          title: "Checkout Successful",
          description: `${session.name} has been checked out. Total: ${finalAmount.toFixed(2)} ${currency}`,
        });
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  }

  async function handleCancelSession() {
      startTransition(async () => {
          const result = await cancelSession(firestore, session.id);
          if (result.success) {
              toast({
                  title: 'Session Cancelled',
                  description: `The session for ${session.name} has been cancelled and will not be included in the summary.`
              });
              onOpenChange(false);
          } else {
              toast({ variant: 'destructive', title: 'Error', description: result.error });
          }
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt /> Checkout for {session.name}
          </DialogTitle>
          <DialogDescription>
            Review the session details and confirm checkout.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-medium">Session Summary</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time Spent</span>
              <span>{Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time Cost</span>
              <span>{timeCost.toFixed(2)} {currency}</span>
            </div>
             {session.items.length > 0 && (
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items Cost</span>
                    <span>{itemsCost.toFixed(2)} {currency}</span>
                </div>
             )}
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-medium">Billing</h4>
            <div className="flex justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span>{totalCost.toFixed(2)} {currency}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Label htmlFor="discount" className="text-muted-foreground">Discount</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, e.target.valueAsNumber || 0))}
                className="w-24 h-8"
                min="0"
                step="1"
              />
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount</span>
              <span>{finalAmount.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:flex sm:justify-end sm:space-x-2">
            <div className="flex items-center gap-2 sm:mr-auto">
                 <ConfirmationDialog
                    trigger={<Button variant="destructive" size="icon" disabled={isPending}><X className="h-4 w-4"/></Button>}
                    title="Are you sure?"
                    description="This will cancel the session entirely. It will not be recorded in the daily summary. This action cannot be undone."
                    onConfirm={handleCancelSession}
                    confirmText="Yes, Cancel Session"
                />
            </div>
            <div className="col-span-2 sm:col-span-1 flex justify-end gap-2">
                <Button onClick={() => handleCheckout('cash')} disabled={isPending} className="w-full sm:w-auto">
                    <Banknote className="mr-2 h-4 w-4" /> Pay with Cash
                </Button>
                <Button onClick={() => handleCheckout('instapay')} disabled={isPending} className="w-full sm:w-auto">
                    <CreditCard className="mr-2 h-4 w-4" /> Pay with Instapay
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
