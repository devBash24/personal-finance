"use client";

import { useState } from "react";
import { useMonthStore } from "@/store/useMonthStore";
import { useSavings } from "@/lib/hooks/useSavings";
import {
  createSavingsAccountAction,
  updateSavingsAccountAction,
  deleteSavingsAccountAction,
  createSavingsTransactionAction,
  deleteSavingsTransactionAction,
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

type Account = { id: string; name: string; initialBalance: string | null };
type Transaction = {
  id: string;
  accountId: string;
  accountName: string;
  amount: string;
};

export default function SavingsPage() {
  const { month, year } = useMonthStore();
  const { data, error, isLoading, isValidating, mutate } = useSavings(
    month,
    year
  );
  const accounts: Account[] = data?.accounts ?? [];
  const transactions: Transaction[] = data?.transactions ?? [];
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [txAccountId, setTxAccountId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loading = isLoading && !data;
  const errorMsg = mutationError ?? error?.message ?? null;

  const balanceByAccount = new Map<string, number>();
  for (const a of accounts) {
    const init = parseFloat(String(a.initialBalance) || "0");
    balanceByAccount.set(a.id, init);
  }
  for (const t of transactions) {
    const cur = balanceByAccount.get(t.accountId) ?? 0;
    balanceByAccount.set(
      t.accountId,
      cur + parseFloat(String(t.amount) || "0")
    );
  }
  const totalBalance = [...balanceByAccount.values()].reduce(
    (s, b) => s + b,
    0
  );

  function openAddAccount() {
    setEditingAccountId(null);
    setAccountName("");
    setInitialBalance("0");
    setMutationError(null);
    setAccountDialogOpen(true);
  }

  function openEditAccount(a: Account) {
    setEditingAccountId(a.id);
    setAccountName(a.name);
    setInitialBalance(a.initialBalance ?? "0");
    setMutationError(null);
    setAccountDialogOpen(true);
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMutationError(null);
    let err: string | null = null;
    if (editingAccountId) {
      const res = await updateSavingsAccountAction(editingAccountId, {
        name: accountName,
        initialBalance,
      });
      if (res.error) err = res.error;
    } else {
      const res = await createSavingsAccountAction({
        name: accountName,
        initialBalance,
      });
      if (res.error) err = res.error;
    }
    setSaving(false);
    if (err) {
      setMutationError(err);
      return;
    }
    setAccountDialogOpen(false);
    await mutate();
  }

  async function handleDeleteAccount(id: string) {
    if (
      !confirm(
        "Delete this account? All transactions for it will also be removed."
      )
    )
      return;
    setMutationError(null);
    const res = await deleteSavingsAccountAction(id);
    if (res.error) {
      setMutationError(res.error);
      return;
    }
    await mutate();
  }

  function openAddTransaction() {
    setTxAccountId(accounts[0]?.id ?? "");
    setTxAmount("");
    setMutationError(null);
    setTxDialogOpen(true);
  }

  async function handleTxSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!txAccountId) return;
    setSaving(true);
    setMutationError(null);
    const res = await createSavingsTransactionAction(month, year, {
      accountId: txAccountId,
      amount: txAmount,
    });
    setSaving(false);
    if (res.error) {
      setMutationError(res.error);
      return;
    }
    setTxDialogOpen(false);
    await mutate();
  }

  async function handleDeleteTx(id: string) {
    if (!confirm("Delete this transaction?")) return;
    setMutationError(null);
    const res = await deleteSavingsTransactionAction(id);
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
          <h1 className="text-2xl font-bold tracking-tight">Savings</h1>
          <p className="text-muted-foreground">
            Savings accounts and monthly contributions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={openAddAccount}
            disabled={loading}
          >
            Add account
          </Button>
          <Button
            onClick={openAddTransaction}
            disabled={loading || accounts.length === 0}
          >
            Add contribution
          </Button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-sm text-destructive" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Total balance: {totalBalance.toFixed(2)}
              {isValidating && data && (
                <span className="ml-2 text-muted-foreground">
                  Updating…
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : accounts.length === 0 ? (
              <p className="text-muted-foreground">
                No accounts. Add one to get started.
              </p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Balance:{" "}
                        {(balanceByAccount.get(a.id) ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditAccount(a)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAccount(a.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contributions this month</CardTitle>
            <CardDescription>
              {transactions.length} transaction(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground">
                No contributions for this month.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.accountName}</TableCell>
                      <TableCell className="text-right">{t.amount}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTx(t.id)}
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
      </div>

      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccountId ? "Edit account" : "Add account"}
            </DialogTitle>
            <DialogDescription>Name and initial balance.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="acc-name">Name</Label>
              <Input
                id="acc-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-balance">Initial balance</Label>
              <Input
                id="acc-balance"
                type="text"
                inputMode="decimal"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAccountDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editingAccountId
                    ? "Update"
                    : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add contribution</DialogTitle>
            <DialogDescription>
              Account and amount for this month.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTxSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={txAccountId} onValueChange={setTxAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount</Label>
              <Input
                id="tx-amount"
                type="text"
                inputMode="decimal"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTxDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
