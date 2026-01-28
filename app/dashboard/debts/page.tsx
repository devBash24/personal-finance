"use client";

import { useState } from "react";
import { useDebts } from "@/lib/hooks/useDebts";
import {
  createDebtAction,
  updateDebtAction,
  deleteDebtAction,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Debt = {
  id: string;
  name: string;
  principal: string;
  interestRate: string | null;
  monthlyPayment: string;
};

export default function DebtsPage() {
  const { data: debts, error, isLoading, isValidating, mutate } = useDebts();
  const list = Array.isArray(debts) ? debts : [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loading = isLoading && debts === undefined;
  const errorMsg = mutationError ?? error?.message ?? null;

  const totalPrincipal = list.reduce(
    (s, d) => s + parseFloat(String(d.principal) || "0"),
    0
  );
  const totalMonthly = list.reduce(
    (s, d) => s + parseFloat(String(d.monthlyPayment) || "0"),
    0
  );

  function openAdd() {
    setEditingId(null);
    setName("");
    setPrincipal("");
    setInterestRate("");
    setMonthlyPayment("");
    setMutationError(null);
    setDialogOpen(true);
  }

  function openEdit(d: Debt) {
    setEditingId(d.id);
    setName(d.name);
    setPrincipal(d.principal);
    setInterestRate(d.interestRate ?? "");
    setMonthlyPayment(d.monthlyPayment);
    setMutationError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMutationError(null);
    const ir = interestRate.trim() ? interestRate : null;
    let err: string | null = null;
    if (editingId) {
      const res = await updateDebtAction(editingId, {
        name,
        principal,
        interestRate: ir,
        monthlyPayment,
      });
      if (res.error) err = res.error;
    } else {
      const res = await createDebtAction({
        name,
        principal,
        interestRate: ir ?? undefined,
        monthlyPayment,
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
    if (!confirm("Delete this debt?")) return;
    setMutationError(null);
    const res = await deleteDebtAction(id);
    if (res.error) {
      setMutationError(res.error);
      return;
    }
    await mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debts</h1>
          <p className="text-muted-foreground">
            Track loans, credit cards, and other debts.
          </p>
        </div>
        <Button onClick={openAdd} disabled={loading}>
          Add debt
        </Button>
      </div>

      {errorMsg && (
        <p className="text-sm text-destructive" role="alert">
          {errorMsg}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Debts</CardTitle>
          <CardDescription>
            Total principal: {totalPrincipal.toFixed(2)} · Monthly payments:{" "}
            {totalMonthly.toFixed(2)}
            {isValidating && list.length > 0 && (
              <span className="ml-2 text-muted-foreground">Updating…</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground">
              No debts. Add one to get started.
            </p>
          ) : (
            <>
              {/* Mobile: stacked rows (no horizontal scrolling) */}
              <div className="sm:hidden space-y-2">
                {list.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium wrap-break-word">{d.name}</p>
                        <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                          <p className="wrap-break-word">
                            Principal: <span className="text-foreground/90">{d.principal}</span>
                          </p>
                          <p className="wrap-break-word">
                            Interest: <span className="text-foreground/90">{d.interestRate ?? "—"}</span>
                          </p>
                          <p className="wrap-break-word">
                            Monthly: <span className="text-foreground/90">{d.monthlyPayment}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(d)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(d.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest %</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.name}</TableCell>
                        <TableCell className="text-right">{d.principal}</TableCell>
                        <TableCell className="text-right">
                          {d.interestRate ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {d.monthlyPayment}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(d)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(d.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit debt" : "Add debt"}
            </DialogTitle>
            <DialogDescription>
              Name, principal, optional interest rate, and monthly payment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debt-name">Name</Label>
              <Input
                id="debt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="debt-principal">Principal</Label>
                <Input
                  id="debt-principal"
                  type="text"
                  inputMode="decimal"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-ir">Interest rate %</Label>
                <Input
                  id="debt-ir"
                  type="text"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-monthly">Monthly payment</Label>
              <Input
                id="debt-monthly"
                type="text"
                inputMode="decimal"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                required
              />
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
