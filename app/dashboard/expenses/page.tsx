"use client";

import { useState } from "react";
import { useMonthStore } from "@/store/useMonthStore";
import { useExpenses } from "@/lib/hooks/useExpenses";
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ExpenseRow = {
  id: string;
  name: string;
  amount: string;
  categoryId: string;
  categoryName: string;
};
type Category = { id: string; name: string; type: string };

export default function ExpensesPage() {
  const { month, year } = useMonthStore();
  const { data, error, isLoading, isValidating, mutate } = useExpenses(
    month,
    year
  );
  const expenses: ExpenseRow[] = data?.expenses ?? [];
  const categories: Category[] = data?.categories ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loading = isLoading && !data;
  const errorMsg = mutationError ?? error?.message ?? null;

  function openAdd() {
    setEditingId(null);
    setName("");
    setAmount("");
    setCategoryId(categories[0]?.id ?? "");
    setMutationError(null);
    setDialogOpen(true);
  }

  function openEdit(row: ExpenseRow) {
    setEditingId(row.id);
    setName(row.name);
    setAmount(row.amount);
    setCategoryId(row.categoryId);
    setMutationError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return;
    setSaving(true);
    setMutationError(null);
    let err: string | null = null;
    if (editingId) {
      const res = await updateExpenseAction(editingId, {
        name,
        amount,
        categoryId,
      });
      if (res.error) err = res.error;
    } else {
      const res = await createExpenseAction(month, year, {
        name,
        amount,
        categoryId,
      });
      if (res.error) err = res.error;
    }
    setSaving(false);
    if (err) {
      setMutationError(err);
      return;
    }
    setDialogOpen(false);
    await mutate();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setMutationError(null);
    const res = await deleteExpenseAction(id);
    if (res.error) {
      setMutationError(res.error);
      return;
    }
    await mutate();
  }

  const total = expenses.reduce(
    (s: number, e: { amount: string }) => s + parseFloat(String(e.amount) || "0"),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track expenses by category for the selected month.
          </p>
        </div>
        <Button onClick={openAdd} disabled={loading}>
          Add expense
        </Button>
      </div>

      {errorMsg && (
        <p className="text-sm text-destructive" role="alert">
          {errorMsg}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Total: {total.toFixed(2)} · {expenses.length} items
            {isValidating && data && (
              <span className="ml-2 text-muted-foreground">Updating…</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : expenses.length === 0 ? (
            <p className="text-muted-foreground">
              No expenses yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.categoryName}</TableCell>
                    <TableCell className="text-right">{row.amount}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit expense" : "Add expense"}
            </DialogTitle>
            <DialogDescription>
              Enter name, amount, and category.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exp-name">Name</Label>
              <Input
                id="exp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-amount">Amount</Label>
              <Input
                id="exp-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
