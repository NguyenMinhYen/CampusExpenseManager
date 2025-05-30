import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema, type Budget } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const categories = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Other",
];

interface BudgetFormProps {
  defaultValues?: Budget;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BudgetForm({
  defaultValues,
  onSuccess,
  onCancel,
}: BudgetFormProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertBudgetSchema),
    defaultValues: {
      category: "",
      amount: 0,
      period: "monthly",
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        category: defaultValues.category,
        amount: Number(defaultValues.amount),
        period: defaultValues.period,
      });
    }
  }, [defaultValues, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, amount: parseFloat(data.amount) };
      if (defaultValues?.id) {
        return await apiRequest("PUT", `/api/budgets/${defaultValues.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/budgets", payload);
      }
    },
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: defaultValues?.id ? "Budget Updated" : "Budget Created",
        description: `Your budget has been successfully ${
          defaultValues?.id ? "updated" : "created"
        }.`,
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
              onValueChange={field.onChange} 
              value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button 
          type="submit" 
          className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {defaultValues ? "Update Budget" : "Create Budget"}
          </Button>

          {defaultValues && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onCancel();
              }}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

//acs