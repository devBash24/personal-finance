"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateMonth,
  getIncomeForMonth,
  getAdditionalIncomeForMonth,
  getExpensesForMonth,
  getSavingsAccounts,
  getSavingsTransactionsForMonth,
  getMonthsForUser,
  getIncomeForMonths,
  getAdditionalIncomeForMonths,
  getExpensesForMonths,
  getSubscriptions,
} from "@/db/queries";

export async function fetchOverviewAction(month: number, year: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const m = await getOrCreateMonth(user.id, month, year);

  const [income, additionalIncome, expenses, accounts, transactions, subscriptions] =
    await Promise.all([
      getIncomeForMonth(user.id, m.id),
      getAdditionalIncomeForMonth(user.id, m.id),
      getExpensesForMonth(user.id, m.id),
      getSavingsAccounts(user.id),
      getSavingsTransactionsForMonth(user.id, m.id),
      getSubscriptions(user.id),
    ]);

  let totalExpenses = 0;
  for (const ex of expenses) {
    totalExpenses += parseFloat(String(ex.amount) || "0");
  }
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    const name = e.categoryName ?? "Other";
    byCategory[name] = (byCategory[name] ?? 0) + parseFloat(String(e.amount) || "0");
  }
  const expenseBreakdown = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const balanceByAccount = new Map<string, number>();
  for (const a of accounts) {
    balanceByAccount.set(a.id, parseFloat(String(a.initialBalance) || "0"));
  }
  for (const t of transactions) {
    const cur = balanceByAccount.get(t.accountId) ?? 0;
    balanceByAccount.set(t.accountId, cur + parseFloat(String(t.amount) || "0"));
  }
  let totalSavings = 0;
  for (const b of balanceByAccount.values()) totalSavings += b;

  let subscriptionsTotal = 0;
  for (const sub of subscriptions) {
    if (sub.isActive === false) continue;
    subscriptionsTotal += parseFloat(String(sub.amount) || "0");
  }

  const months = await getMonthsForUser(user.id, 6);
  const monthIds: string[] = [];
  for (const mo of months) monthIds.push(mo.id);
  const [incomeForMonths, additionalForMonths, expensesForMonths] =
    await Promise.all([
      getIncomeForMonths(user.id, monthIds),
      getAdditionalIncomeForMonths(user.id, monthIds),
      getExpensesForMonths(user.id, monthIds),
    ]);

  const incomeByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();
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
    expensesByMonth.set(row.monthId, prev + parseFloat(String(row.amount) || "0"));
  }

  const savingsByMonth: { monthId: string; total: number }[] = [];
  for (const mo of months) {
    const tx = await getSavingsTransactionsForMonth(user.id, mo.id);
    let total = 0;
    for (const t of tx) total += parseFloat(String(t.amount) || "0");
    savingsByMonth.push({ monthId: mo.id, total });
  }
  const savingsMap = new Map(savingsByMonth.map((x) => [x.monthId, x.total]));

  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const reversed = [...months].reverse();
  const trends = reversed.map((mo) => ({
    label: `${MONTHS[mo.month - 1]} ${mo.year}`,
    month: mo.month,
    year: mo.year,
    income: incomeByMonth.get(mo.id) ?? 0,
    expenses: expensesByMonth.get(mo.id) ?? 0,
    savings: savingsMap.get(mo.id) ?? 0,
  }));

  let netIncome = income
    ? parseFloat(String(income.netIncome) || "0")
    : 0;
  for (const a of additionalIncome) {
    netIncome += parseFloat(String(a.amount) || "0");
  }

  let savingsCumulative = 0;
  const savingsGrowth = reversed.map((mo) => {
    const contrib = savingsMap.get(mo.id) ?? 0;
    savingsCumulative += contrib;
    return {
      label: `${MONTHS[mo.month - 1]} ${mo.year}`,
      balance: savingsCumulative,
      contributions: contrib,
    };
  });

  return {
    error: null,
    data: {
      netIncome,
      totalExpenses,
      totalSavings,
      subscriptionsTotal,
      expenseBreakdown,
      trends,
      savingsGrowth,
      hasIncome: !!income || additionalIncome.length > 0,
    },
  };
}
