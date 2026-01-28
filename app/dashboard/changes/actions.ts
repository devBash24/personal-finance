"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getMonthsForUser,
  getIncomeForMonths,
  getAdditionalIncomeForMonths,
  getExpensesForMonths,
  getSavingsTransactionsForMonth,
  getSubscriptions,
} from "@/db/queries";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function fetchChangesAction(limit: 6 | 12 = 12) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const months = await getMonthsForUser(user.id, limit);
  const monthIds = months.map((m: { id: string }) => m.id);

  const [incomeForMonths, additionalForMonths, expensesForMonths, subscriptions] =
    await Promise.all([
      getIncomeForMonths(user.id, monthIds),
      getAdditionalIncomeForMonths(user.id, monthIds),
      getExpensesForMonths(user.id, monthIds),
      getSubscriptions(user.id),
    ]);

  const incomeByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();
  const savingsByMonth = new Map<string, number>();

  for (const row of incomeForMonths) {
    const prev = incomeByMonth.get(row.monthId) ?? 0;
    incomeByMonth.set(
      row.monthId,
      prev + parseFloat(String(row.netIncome) || "0")
    );
  }
  for (const row of additionalForMonths) {
    const prev = incomeByMonth.get(row.monthId) ?? 0;
    incomeByMonth.set(
      row.monthId,
      prev + parseFloat(String(row.amount) || "0")
    );
  }
  for (const row of expensesForMonths) {
    const prev = expensesByMonth.get(row.monthId) ?? 0;
    expensesByMonth.set(
      row.monthId,
      prev + parseFloat(String(row.amount) || "0")
    );
  }

  for (const mo of months) {
    const tx = await getSavingsTransactionsForMonth(user.id, mo.id);
    let total = 0;
    for (const t of tx) total += parseFloat(String(t.amount) || "0");
    savingsByMonth.set(mo.id, total);
  }

  let subsTotal = 0;
  for (const sub of subscriptions) {
    if (sub.isActive === false) continue;
    subsTotal += parseFloat(String(sub.amount) || "0");
  }

  const reversed = [...months].reverse();
  const rows: {
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
  }[] = [];

  for (let i = 0; i < reversed.length; i++) {
    const mo = reversed[i];
    const income = incomeByMonth.get(mo.id) ?? 0;
    const expenses = expensesByMonth.get(mo.id) ?? 0;
    const savings = savingsByMonth.get(mo.id) ?? 0;
    const prev = reversed[i + 1];
    const prevIncome = prev ? (incomeByMonth.get(prev.id) ?? 0) : null;
    const prevExpenses = prev ? (expensesByMonth.get(prev.id) ?? 0) : null;
    const prevSavings = prev ? (savingsByMonth.get(prev.id) ?? 0) : null;

    rows.push({
      id: mo.id,
      label: `${MONTHS[mo.month - 1]} ${mo.year}`,
      month: mo.month,
      year: mo.year,
      income,
      expenses,
      savings,
      subscriptions: subsTotal,
      deltaIncome: prevIncome != null ? income - prevIncome : null,
      deltaExpenses: prevExpenses != null ? expenses - prevExpenses : null,
      deltaSavings: prevSavings != null ? savings - prevSavings : null,
    });
  }

  return { error: null, data: rows };
}
