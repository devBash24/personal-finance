"use client";

import { useState } from "react";
import { useSubscriptions } from "@/lib/hooks/useSubscriptions";
import {
  createSubscriptionAction,
  updateSubscriptionAction,
  deleteSubscriptionAction,
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

type Subscription = {
  id: string;
  name: string;
  amount: string;
  billingDay: number | null;
  isActive: boolean | null;
};

export default function SubscriptionsPage() {
  const { data: subscriptions, error, isLoading, isValidating, mutate } =
    useSubscriptions();
  const list = Array.isArray(subscriptions) ? subscriptions : [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingDay, setBillingDay] = useState("");
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loading = isLoading && !subscriptions;
  const errorMsg = mutationError ?? error?.message ?? null;

  const active = list.filter((s) => s.isActive !== false);
  const totalMonthly = active.reduce(
    (s, x) => s + parseFloat(String(x.amount) || "0"),
    0
  );

  function openAdd() {
    setEditingId(null);
    setName("");
    setAmount("");
    setBillingDay("");
    setMutationError(null);
    setDialogOpen(true);
  }

  function openEdit(s: Subscription) {
    setEditingId(s.id);
    setName(s.name);
    setAmount(s.amount);
    setBillingDay(s.billingDay != null ? String(s.billingDay) : "");
    setMutationError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMutationError(null);
    const bd = billingDay ? parseInt(billingDay, 10) : null;
    const validBd =
      bd != null && !Number.isNaN(bd) && bd >= 1 && bd <= 31 ? bd : null;
    let err: string | null = null;
    if (editingId) {
      const res = await updateSubscriptionAction(editingId, {
        name,
        amount,
        billingDay: validBd,
      });
      if (res.error) err = res.error;
    } else {
      const res = await createSubscriptionAction({
        name,
        amount,
        billingDay: validBd,
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

  async function toggleActive(s: Subscription) {
    setMutationError(null);
    const res = await updateSubscriptionAction(s.id, {
      isActive: !(s.isActive !== false),
    });
    if (res.error) {
      setMutationError(res.error);
      return;
    }
    await mutate();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subscription?")) return;
    setMutationError(null);
    const res = await deleteSubscriptionAction(id);
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
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Recurring monthly expenses.
          </p>
        </div>
        <Button onClick={openAdd} disabled={loading}>
          Add subscription
        </Button>
      </div>

      {errorMsg && (
        <p className="text-sm text-destructive" role="alert">
          {errorMsg}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active subscriptions</CardTitle>
          <CardDescription>
            Total this month: {totalMonthly.toFixed(2)} · {active.length} active
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
              No subscriptions. Add one to get started.
            </p>
          ) : (
            <>
              {/* Mobile: stacked rows (no horizontal scrolling) */}
              <div className="sm:hidden space-y-2">
                {list.map((s) => {
                  const isActive = s.isActive !== false;
                  return (
                    <div
                      key={s.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium wrap-break-word">{s.name}</p>
                          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                            <p className="wrap-break-word">
                              Amount:{" "}
                              <span className="text-foreground/90">{s.amount}</span>
                            </p>
                            <p className="wrap-break-word">
                              Billing day:{" "}
                              <span className="text-foreground/90">
                                {s.billingDay ?? "—"}
                              </span>
                            </p>
                            <p className="wrap-break-word">
                              Status:{" "}
                              <span
                                className={
                                  isActive ? "text-green-600" : "text-muted-foreground"
                                }
                              >
                                {isActive ? "Active" : "Paused"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(s)}
                        >
                          {isActive ? "Pause" : "Resume"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(s.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Billing day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[140px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.amount}</TableCell>
                        <TableCell>{s.billingDay ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={
                              s.isActive !== false
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {s.isActive !== false ? "Active" : "Paused"}
                          </span>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(s)}
                          >
                            {s.isActive !== false ? "Pause" : "Resume"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(s)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(s.id)}
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
              {editingId ? "Edit subscription" : "Add subscription"}
            </DialogTitle>
            <DialogDescription>
              Name, amount, and optional billing day (1–31).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub-name">Name</Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-amount">Amount</Label>
              <Input
                id="sub-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-day">Billing day (1–31)</Label>
              <Input
                id="sub-day"
                type="number"
                min={1}
                max={31}
                placeholder="Optional"
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value)}
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
