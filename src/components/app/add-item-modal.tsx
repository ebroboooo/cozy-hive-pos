
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition } from "react";
import { Plus } from "lucide-react";

import type { Session, Item } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { addItemToSession } from "@/lib/actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";

interface AddItemModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  session: Session;
  allItems: Item[];
}

const formSchema = z.object({
  itemId: z.string().min(1, "Please select an item."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

export function AddItemModal({ isOpen, onOpenChange, session, allItems }: AddItemModalProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const itemToAdd = allItems.find(item => item.id === values.itemId);
    if (!itemToAdd) return;

    startTransition(async () => {
      const result = await addItemToSession(firestore, session.id, session.items, itemToAdd, values.quantity);
      if (result.success) {
        toast({
          title: "Item Added",
          description: `${values.quantity}x ${itemToAdd.name} added to ${session.name}'s tab.`,
        });
        form.reset({ itemId: "", quantity: 1 });
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Item for {session.name}</DialogTitle>
          <DialogDescription>
            Select an item and quantity to add to the customer's tab.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item to add" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.price} EGP
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" /> Add to Tab
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
