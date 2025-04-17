import Footer from "@/components/layout/footer";
import BudgetForm from "@/components/budgets/budget-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Budget } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Pencil, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BudgetPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] =
    useState(false);
  const [editingBudget, setEditingBudget] =
    useState<Budget | null>(null);

  const {
    data: budgets,
    isLoading,
    isRefetching,
  } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Budget Deleted",
        description: "The budget has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (budget: Budget) => {
    setIsDialogOpen(true);
  };

  const handleFormSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    setEditingBudget(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="container max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Budget Management</h1>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Create New Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetForm
                  key="create"
                  onSuccess={handleFormSuccess}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Current Budgets</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || isRefetching ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !budgets?.length ? (
                  <p className="text-muted-foreground text-center py-4">
                    No budgets found. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {budgets.map((budget) => (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{budget.category}</h3>
                          <div className="text-sm text-muted-foreground">
                            ${Number(budget.amount).toFixed(2)} / {budget.period}
                          </div>
                        </div>
                        <div className="flex gap-2">

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingBudget(budget);
                              handleEdit(budget);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteBudget.mutate(budget.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          {editingBudget && (
            <BudgetForm
              key={`dialog-edit-${editingBudget.id}`}
              defaultValues={editingBudget}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}