
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition } from "react";
import { PlusCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startSession } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { useTranslation } from "@/context/settings-provider";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

export function AddCustomerForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await startSession(firestore, values.name);
      if (result.success) {
        toast({
          title: "Session Started",
          description: `Customer ${values.name} has entered the space.`,
        });
        form.reset();
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-start gap-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder={t('Enter customer name...')} {...field} className="min-w-[250px]" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          <PlusCircle />
          {t('New Session')}
        </Button>
      </form>
    </Form>
  );
}
