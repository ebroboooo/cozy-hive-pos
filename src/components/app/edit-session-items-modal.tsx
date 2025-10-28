
"use client";

import { useState, useTransition, useEffect } from "react";
import { Minus, Plus, Save, X } from "lucide-react";
import { useFirestore } from "@/firebase";
import type { Session, SessionItem } from "@/lib/types";
import { updateSessionItems } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/context/settings-provider";


interface EditSessionItemsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  session: Session;
}

export function EditSessionItemsModal({ isOpen, onOpenChange, session }: EditSessionItemsModalProps) {
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editedItems, setEditedItems] = useState<SessionItem[]>([]);
  const { settings } = useSettings();
  const currency = settings?.currency ?? 'EGP';


  // Sync state if session items change from props
  useEffect(() => {
    // Deep copy to prevent direct mutation of props
    setEditedItems(JSON.parse(JSON.stringify(session.items)));
  }, [session.items, isOpen]);

  const handleQuantityChange = (itemId: string, delta: number) => {
    const newItems = editedItems.map(item => {
      if (item.itemId === itemId) {
        const newQuantity = item.quantity + delta;
        // Prevent quantity from going below 0
        return { ...item, quantity: Math.max(0, newQuantity) };
      }
      return item;
    }).filter(item => item.quantity > 0); // Automatically remove item if quantity is 0
    setEditedItems(newItems);
  };

  const handleSaveChanges = () => {
    startTransition(async () => {
      const result = await updateSessionItems(firestore, session.id, editedItems);
      if (result.success) {
        toast({
          title: "Items Updated",
          description: "The customer's tab has been successfully updated.",
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
  };
  
  const subtotal = editedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            // Reset changes if dialog is closed without saving
             setEditedItems(JSON.parse(JSON.stringify(session.items)));
        }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Items for {session.name}</DialogTitle>
          <DialogDescription>
            Adjust quantities or remove items from the session.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {editedItems.length > 0 ? (
            <ScrollArea className="h-64">
                <div className="space-y-4 pr-6">
                {editedItems.map(item => (
                    <div key={item.itemId} className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                        {item.price.toFixed(2)} {currency}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.itemId, -1)}>
                           <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                         <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.itemId, 1)}>
                           <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
             ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No items in this session.</p>
                </div>
            )}
             <Separator />
             <div className="flex justify-between font-bold text-lg">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} {currency}</span>
             </div>
        </div>
        <DialogFooter>
           <DialogClose asChild>
            <Button variant="outline">
                <X className="mr-2 h-4 w-4"/> Cancel
            </Button>
           </DialogClose>
          <Button onClick={handleSaveChanges} disabled={isPending || JSON.stringify(session.items) === JSON.stringify(editedItems)}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
