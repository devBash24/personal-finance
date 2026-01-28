"use client";

import { useEffect, useState } from "react";
import { useMonthStore } from "@/store/useMonthStore";
import { useIncome } from "@/lib/hooks/useIncome";
import {
  upsertIncomeAction,
  createAdditionalIncomeAction,
  updateAdditionalIncomeAction,
  deleteAdditionalIncomeAction,
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

function parseNum(s: string): number {
  const v = parseFloat(String(s).replace(/,/g, ""));
  return Number.isNaN(v) ? 0 : v;
}

function formatNum(n: number): string {
  return n.toFixed(2);
}

type AdditionalRow = { id: string; label: string; amount: string };

export default function IncomePage() {
  const { month, year } = useMonthStore();
  const { data, error, isLoading, isValidating, mutate } = useIncome(
    month,
    year
  );
  const [gross, setGross] = useState("");
  const [tax, setTax] = useState("");
  const [nis, setNis] = useState("");
  const [other, setOther] = useState("");
  const [additional, setAdditional] = useState<AdditionalRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addLabel, setAddLabel] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setGross("");
      setTax("0");
      setNis("0");
      setOther("0");
      setAdditional([]);
      return;
    }
    const p = data.primary;
    if (p) {
      setGross(p.grossIncome ?? "");
      setTax(p.taxDeduction ?? "0");
      setNis(p.nisDeduction ?? "0");
      setOther(p.otherDeductions ?? "0");
    } else {
      setGross("");
      setTax("0");
      setNis("0");
      setOther("0");
    }
    setAdditional(data.additional ?? []);
  }, [data]);

  const net = formatNum(
    parseNum(gross) - parseNum(tax) - parseNum(nis) - parseNum(other)
  );
  const additionalTotal = additional.reduce(
    (s, a) => s + parseNum(a.amount),
    0
  );
  const totalIncome = parseNum(net) + additionalTotal;

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setMutationError(null);
    const { error: err } = await upsertIncomeAction(month, year, {
      grossIncome: gross,
      taxDeduction: tax,
      nisDeduction: nis,
      otherDeductions: other,
      netIncome: net,
    });
    setSaving(false);
    if (err) {
      setMutationError(err);
      return;
    }
    await mutate();
  }

  function openAddAdditional() {
    setEditingId(null);
    setAddLabel("");
    setAddAmount("");
    setMutationError(null);
    setAddDialogOpen(true);
  }

  function openEditAdditional(row: AdditionalRow) {
    setEditingId(row.id);
    setAddLabel(row.label);
    setAddAmount(row.amount);
    setAddDialogOpen(true);
  }

  async function handleAdditionalSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!addLabel.trim()) return;
    setSaving(true);
    setMutationError(null);
    let err: string | null = null;
    if (editingId) {
      const res = await updateAdditionalIncomeAction(editingId, {
        label: addLabel.trim(),
        amount: addAmount,
      });
      if (res.error) err = res.error;
    } else {
      const res = await createAdditionalIncomeAction(month, year, {
        label: addLabel.trim(),
        amount: addAmount,
      });
      if (res.error) err = res.error;
    }
    setSaving(false);
    if (err) {
      setMutationError(err);
      return;
    }
    setAddDialogOpen(false);
    await mutate();
  }

  async function handleDeleteAdditional(id: string) {
    if (!confirm("Remove this additional income?")) return;
    setMutationError(null);
    const res = await deleteAdditionalIncomeAction(id);
    if (res.error) {
      setMutationError(res.error);
      return;
    }
    await mutate();
  }

  const loading = isLoading && !data;
  const errorMsg = mutationError ?? error?.message ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Income</h1>
        <p className="text-muted-foreground">
          Enter gross income and deductions for the selected month. Add extra
          sources (e.g. side gig) below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Primary income</CardTitle>
          <CardDescription>
            Net = Gross − Tax − NIS − Other deductions
            {isValidating && data && (
              <span className="ml-2 text-muted-foreground">Updating…</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMsg}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gross">Gross income</Label>
                  <Input
                    id="gross"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={gross}
                    onChange={(e) => setGross(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax deduction</Label>
                  <Input
                    id="tax"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nis">NIS deduction</Label>
                  <Input
                    id="nis"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other">Other deductions</Label>
                  <Input
                    id="other"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 border-t pt-4">
                <p className="text-sm font-medium">
                  Net income: <span className="text-primary">{net}</span>
                </p>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional income</CardTitle>
          <CardDescription>
            Extra jobs, bonuses, etc. Total income = primary net +{" "}
            {formatNum(additionalTotal)} ={" "}
            <span className="font-medium">{formatNum(totalIncome)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={openAddAdditional}
              disabled={loading}
            >
              Add additional income
            </Button>
            {additional.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No additional income. Add a side gig or bonus.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {additional.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell className="text-right">
                        {row.amount}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditAdditional(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAdditional(row.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit additional income" : "Add additional income"}
            </DialogTitle>
            <DialogDescription>
              Label (e.g. Side gig) and amount.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdditionalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-label">Label</Label>
              <Input
                id="add-label"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="e.g. Side gig"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-amount">Amount</Label>
              <Input
                id="add-amount"
                type="text"
                inputMode="decimal"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
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
