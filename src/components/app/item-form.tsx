
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useEffect } from "react";
import { Save } from "lucide-react";

import type { Item } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createItem, updateItem } from "@/lib/actions";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";

interface ItemFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: Item | null;
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
});

export function ItemForm({ isOpen, onOpenChange, item }: ItemFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const isEditing = !!item;
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset(item);
    } else {
      form.reset({ name: "", price: 0 });
    }
  }, [item, form, isOpen]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const action = isEditing ? updateItem(firestore, item.id, values.name, values.price) : createItem(firestore, values.name, values.price);
      const result = await action;

      if (result.success) {
        toast({
          title: isEditing ? "Item Updated" : "Item Created",
          description: `Item "${values.name}" has been saved.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item" : "Create New Item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details for this item." : "Enter the details for the new item."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Espresso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (EGP)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
