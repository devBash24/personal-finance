"use client";

import { useEffect, useState } from "react";
import {
  fetchGoalsAction,
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
  linkAccountToGoalAction,
  unlinkAccountFromGoalAction,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Goal = {
  id: string;
  name: string;
  targetAmount: string;
  targetDate: Date | null;
  accountIds: string[];
  progress: number;
};

type Account = { id: string; name: string; initialBalance: string | null };

function parseNum(s: string): number {
  const v = parseFloat(String(s).replace(/,/g, ""));
  return Number.isNaN(v) ? 0 : v;
}

function formatNum(n: number): string {
  return n.toFixed(2);
}

function monthlyNeeded(
  target: number,
  progress: number,
  targetDate: Date | null
): number | null {
  if (!targetDate || target <= progress) return null;
  const now = new Date();
  const end = new Date(targetDate);
  if (end <= now) return null;
  const monthsLeft =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth()) +
    (end.getDate() >= now.getDate() ? 0 : -1);
  if (monthsLeft <= 0) return null;
  return (target - progress) / monthsLeft;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkDialogGoalId, setLinkDialogGoalId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetchGoalsAction();
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data) {
      setGoals(res.data.goals);
      setAccounts(res.data.accounts);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingId(null);
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(g: Goal) {
    setEditingId(g.id);
    setName(g.name);
    setTargetAmount(g.targetAmount);
    setTargetDate(
      g.targetDate ? new Date(g.targetDate).toISOString().slice(0, 10) : ""
    );
    setError(null);
    setDialogOpen(true);
  }

  async function handleGoalSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setError(null);
    let err: string | null = null;
    if (editingId) {
      const res = await updateGoalAction(editingId, {
        name,
        targetAmount,
        targetDate: targetDate || null,
      });
      if (res.error) err = res.error;
    } else {
      const res = await createGoalAction({
        name,
        targetAmount,
        targetDate: targetDate || null,
      });
      if (res.error) err = res.error;
    }
    setSaving(false);
    if (err) setError(err);
    else {
      setDialogOpen(false);
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal? Account links will be removed.")) return;
    setError(null);
    const res = await deleteGoalAction(id);
    if (res.error) setError(res.error);
    else load();
  }

  async function toggleAccount(goalId: string, accountId: string, linked: boolean) {
    setError(null);
    const res = linked
      ? await unlinkAccountFromGoalAction(goalId, accountId)
      : await linkAccountToGoalAction(goalId, accountId);
    if (res.error) setError(res.error);
    else load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">
            Savings goals and progress. Link savings accounts to each goal.
          </p>
        </div>
        <Button onClick={openAdd}>Add goal</Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No goals yet. Add one and link savings accounts to track progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const target = parseNum(g.targetAmount);
            const pct = target > 0 ? Math.min(100, (g.progress / target) * 100) : 0;
            const needed = monthlyNeeded(target, g.progress, g.targetDate);
            return (
              <Card key={g.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{g.name}</CardTitle>
                      <CardDescription>
                        {formatNum(g.progress)} / {g.targetAmount} (
                        {formatNum(pct)}%)
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLinkDialogGoalId(g.id)}
                      >
                        Link accounts
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(g)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(g.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    className="h-2 w-full rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {g.targetDate && (
                    <p className="text-sm text-muted-foreground">
                      Target date:{" "}
                      {new Date(g.targetDate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {needed != null && (
                        <> · {formatNum(needed)}/mo needed</>
                      )}
                    </p>
                  )}
                  {g.accountIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Linked: {g.accountIds.length} account(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit goal" : "Add goal"}
            </DialogTitle>
            <DialogDescription>
              Name, target amount, and optional target date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Name</Label>
              <Input
                id="goal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emergency fund"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target amount</Label>
              <Input
                id="goal-target"
                type="text"
                inputMode="decimal"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-date">Target date (optional)</Label>
              <Input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
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

      <Dialog
        open={!!linkDialogGoalId}
        onOpenChange={(open) => !open && setLinkDialogGoalId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link savings accounts</DialogTitle>
            <DialogDescription>
              Select which accounts contribute to this goal. Progress is the sum
              of their balances.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {linkDialogGoalId &&
              accounts.map((a: Account) => {
                const goal = goals.find((x) => x.id === linkDialogGoalId);
                const linked = goal?.accountIds.includes(a.id) ?? false;
                return (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={linked}
                      onChange={() =>
                        toggleAccount(linkDialogGoalId, a.id, linked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{a.name}</span>
                  </label>
                );
              })}
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No savings accounts. Add one in Savings first.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkDialogGoalId(null)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
