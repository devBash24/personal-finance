"use client";

import { useEffect, useState } from "react";
import { fetchChangesAction } from "./actions";
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
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  label: string;
  month: number;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  subscriptions: number;
  deltaIncome: number | null;
  deltaExpenses: number | null;
  deltaSavings: number | null;
};

function formatNum(n: number): string {
  return n.toFixed(2);
}

function Delta({ v }: { v: number | null }) {
  if (v === null) return <span className="text-muted-foreground">—</span>;
  const up = v > 0;
  const same = v === 0;
  if (same) return <span className="text-muted-foreground">0</span>;
  return (
    <span className={up ? "text-green-600" : "text-red-600"}>
      {up ? "↑" : "↓"} {formatNum(Math.abs(v))}
    </span>
  );
}

export default function ChangesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<6 | 12>(12);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchChangesAction(limit).then((res) => {
      setLoading(false);
      if (res.error) setError(res.error);
      else if (res.data) setRows(res.data);
    });
  }, [limit]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Changes</h1>
          <p className="text-muted-foreground">
            Month-over-month comparison of income, expenses, and savings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={limit === 6 ? "default" : "outline"}
            size="sm"
            onClick={() => setLimit(6)}
          >
            Last 6 months
          </Button>
          <Button
            variant={limit === 12 ? "default" : "outline"}
            size="sm"
            onClick={() => setLimit(12)}
          >
            Last 12 months
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>By month</CardTitle>
          <CardDescription>
            Totals and change vs previous month (↑ increase, ↓ decrease).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">
              No data yet. Add income and expenses to see changes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Δ Income</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Δ Expenses</TableHead>
                    <TableHead className="text-right">Savings</TableHead>
                    <TableHead className="text-right">Δ Savings</TableHead>
                    <TableHead className="text-right">Subscriptions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-right">
                        {formatNum(r.income)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Delta v={r.deltaIncome} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNum(r.expenses)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Delta v={r.deltaExpenses} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNum(r.savings)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Delta v={r.deltaSavings} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNum(r.subscriptions)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
