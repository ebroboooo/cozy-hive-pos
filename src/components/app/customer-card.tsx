
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Plus, LogOut, ShoppingBag, Pencil } from "lucide-react";

import type { Session, Item } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AddItemModal } from "./add-item-modal";
import { CheckoutModal } from "./checkout-modal";
import { EditSessionItemsModal } from "./edit-session-items-modal";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Separator } from "@/components/ui/separator";

interface CustomerCardProps {
  session: Session;
  allItems: Item[];
}

function calculateElapsedTime(entryTime: Date) {
  const now = new Date();
  const diff = now.getTime() - entryTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CustomerCard({ session, allItems }: CustomerCardProps) {
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isEditItemsOpen, setEditItemsOpen] = useState(false);

  const entryTime = session.entryTime ? session.entryTime.toDate() : new Date();
  const avatarImage = PlaceHolderImages.find(img => img.id === 'avatar-1');

  useEffect(() => {
    if (session.entryTime) {
      setElapsedTime(calculateElapsedTime(entryTime));
      const timer = setInterval(() => {
        setElapsedTime(calculateElapsedTime(entryTime));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [entryTime, session.entryTime]);

  const totalItems = session.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Card className="flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-2xl border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={session.name} data-ai-hint={avatarImage.imageHint} />}
            <AvatarFallback>{session.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="font-headline text-lg">{session.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {session.entryTime ? `Entered at ${format(entryTime, "p")}` : 'Starting...'}
            </p>
          </div>
           <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setAddItemOpen(true)}>
              <Plus className="h-5 w-5" />
              <span className="sr-only">Add Item</span>
            </Button>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 p-4 pt-0">
          <div className="flex items-center justify-center gap-3 rounded-lg bg-muted p-4 text-center">
            <Clock className="h-6 w-6 text-primary" />
            <p className="text-3xl font-bold font-mono tabular-nums tracking-wider text-primary">
              {session.entryTime ? elapsedTime : "00:00:00"}
            </p>
          </div>
            <button 
              className="w-full text-left"
              onClick={() => session.items.length > 0 && setEditItemsOpen(true)}
              disabled={session.items.length === 0}
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1 hover:bg-muted p-2 rounded-md transition-colors">
                 <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'No items added'}</span>
                 </div>
                 {totalItems > 0 && <Pencil className="h-4 w-4 text-primary" />}
              </div>
            </button>
        </CardContent>
        <Separator />
        <CardFooter className="p-2">
          <Button className="w-full" onClick={() => setCheckoutOpen(true)}>
            <LogOut className="mr-2 h-4 w-4" /> Checkout
          </Button>
        </CardFooter>
      </Card>
      <AddItemModal
        isOpen={isAddItemOpen}
        onOpenChange={setAddItemOpen}
        session={session}
        allItems={allItems}
      />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onOpenChange={setCheckoutOpen}
        session={session}
      />
       <EditSessionItemsModal
        isOpen={isEditItemsOpen}
        onOpenChange={setEditItemsOpen}
        session={session}
      />
    </>
  );
}
