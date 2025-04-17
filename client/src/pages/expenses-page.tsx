import Footer from "@/components/layout/footer";
import ExpenseForm from "@/components/expenses/expense-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Expense } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast, useToast } from "@/hooks/use-toast"; // Add toast import
import { apiRequest } from "@/lib/queryClient"; // Add apiRequest import

export default function ExpensesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] =
    useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const queryClient = useQueryClient();

  const {
    data: expenses,
    isLoading,
    isRefetching,
  } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully deleted.",
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

  const handleEdit = (expense: Expense) => {
    setIsDialogOpen(true);
  };

  const handleFormSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="container max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Add Expense</h1>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseForm
                  key="create"
                  onSuccess={handleFormSuccess}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || isRefetching ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !expenses?.length ? (
                  <p className="text-muted-foreground text-center py-4">
                    No recent expenses found.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{expense.description}</h3>
                          <div className="text-sm text-muted-foreground">
                            {expense.category} • {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">
                            ${Number(expense.amount).toFixed(2)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingExpense(expense);
                              handleEdit(expense);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteExpense.mutate(expense.id)}
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
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              key={`dialog-edit-${editingExpense.id}`}
              defaultValues={editingExpense}
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