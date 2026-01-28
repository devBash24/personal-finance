import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  profiles,
  months,
  income as incomeTable,
  additionalIncome,
  expenseCategories,
  expenses,
  savingsAccounts,
  savingsTransactions,
  goals,
  goalAccounts,
  debts,
  subscriptions,
  aiInsights,
} from "./schema";

const DEFAULT_CATEGORIES: { name: string; type: "utility" | "debt" | "savings" | "misc" }[] = [
  { name: "Utilities", type: "utility" },
  { name: "Transportation", type: "misc" },
  { name: "Food", type: "misc" },
  { name: "Debt payments", type: "debt" },
  { name: "Savings contributions", type: "savings" },
  { name: "Misc", type: "misc" },
];

export async function ensureProfile(userId: string) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(profiles)
    .values({ id: userId })
    .returning();
  return created!;
}

export async function getOrCreateMonth(userId: string, month: number, year: number) {
  const [existing] = await db
    .select()
    .from(months)
    .where(
      and(
        eq(months.userId, userId),
        eq(months.month, month),
        eq(months.year, year)
      )
    )
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(months)
    .values({ userId, month, year })
    .returning();
  return created!;
}

export async function seedDefaultCategories(userId: string) {
  const existing = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.userId, userId));
  if (existing.length > 0) return existing;
  const inserted = await db
    .insert(expenseCategories)
    .values(
      DEFAULT_CATEGORIES.map((c) => ({
        userId,
        name: c.name,
        type: c.type,
      }))
    )
    .returning();
  return inserted;
}

export async function getCategories(userId: string) {
  return db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.userId, userId))
    .orderBy(expenseCategories.name);
}

/* ---------- INCOME ---------- */
export async function getIncomeForMonth(userId: string, monthId: string) {
  const [row] = await db
    .select()
    .from(incomeTable)
    .where(
      and(eq(incomeTable.userId, userId), eq(incomeTable.monthId, monthId))
    )
    .limit(1);
  return row ?? null;
}

export async function upsertIncome(
  userId: string,
  monthId: string,
  data: {
    grossIncome: string;
    taxDeduction: string;
    nisDeduction: string;
    otherDeductions: string;
    netIncome: string;
  }
) {
  const [existing] = await db
    .select()
    .from(incomeTable)
    .where(
      and(eq(incomeTable.userId, userId), eq(incomeTable.monthId, monthId))
    )
    .limit(1);
  if (existing) {
    const [updated] = await db
      .update(incomeTable)
      .set({
        grossIncome: data.grossIncome,
        taxDeduction: data.taxDeduction,
        nisDeduction: data.nisDeduction,
        otherDeductions: data.otherDeductions,
        netIncome: data.netIncome,
      })
      .where(eq(incomeTable.id, existing.id))
      .returning();
    return updated!;
  }
  const [created] = await db
    .insert(incomeTable)
    .values({
      userId,
      monthId,
      ...data,
    })
    .returning();
  return created!;
}

/* ---------- ADDITIONAL INCOME ---------- */
export async function getAdditionalIncomeForMonth(
  userId: string,
  monthId: string
) {
  return db
    .select()
    .from(additionalIncome)
    .where(
      and(
        eq(additionalIncome.userId, userId),
        eq(additionalIncome.monthId, monthId)
      )
    )
    .orderBy(additionalIncome.createdAt);
}

export async function createAdditionalIncome(
  userId: string,
  monthId: string,
  data: { label: string; amount: string }
) {
  const [created] = await db
    .insert(additionalIncome)
    .values({ userId, monthId, ...data })
    .returning();
  return created!;
}

export async function updateAdditionalIncome(
  userId: string,
  id: string,
  data: { label?: string; amount?: string }
) {
  const [updated] = await db
    .update(additionalIncome)
    .set(data)
    .where(
      and(
        eq(additionalIncome.id, id),
        eq(additionalIncome.userId, userId)
      )
    )
    .returning();
  return updated ?? null;
}

export async function deleteAdditionalIncome(userId: string, id: string) {
  await db
    .delete(additionalIncome)
    .where(
      and(
        eq(additionalIncome.id, id),
        eq(additionalIncome.userId, userId)
      )
    );
}

export async function getAdditionalIncomeForMonths(
  userId: string,
  monthIds: string[]
) {
  if (monthIds.length === 0) return [];
  return db
    .select()
    .from(additionalIncome)
    .where(
      and(
        eq(additionalIncome.userId, userId),
        inArray(additionalIncome.monthId, monthIds)
      )
    );
}

export function previousMonth(month: number, year: number): {
  month: number;
  year: number;
} {
  if (month <= 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export async function getPreviousMonth(
  userId: string,
  month: number,
  year: number
) {
  const { month: prevMonth, year: prevYear } = previousMonth(month, year);
  return getOrCreateMonth(userId, prevMonth, prevYear);
}

export async function copyIncomeFromMonth(
  userId: string,
  sourceMonthId: string,
  targetMonthId: string
) {
  const [primary] = await db
    .select()
    .from(incomeTable)
    .where(
      and(
        eq(incomeTable.userId, userId),
        eq(incomeTable.monthId, sourceMonthId)
      )
    )
    .limit(1);
  if (primary) {
    await db.insert(incomeTable).values({
      userId,
      monthId: targetMonthId,
      grossIncome: primary.grossIncome,
      taxDeduction: primary.taxDeduction,
      nisDeduction: primary.nisDeduction,
      otherDeductions: primary.otherDeductions,
      netIncome: primary.netIncome,
    });
  }
  const extras = await getAdditionalIncomeForMonth(userId, sourceMonthId);
  for (const e of extras) {
    await db.insert(additionalIncome).values({
      userId,
      monthId: targetMonthId,
      label: e.label,
      amount: e.amount,
    });
  }
}

export async function hasAnyIncomeForMonth(
  userId: string,
  monthId: string
): Promise<boolean> {
  const [p] = await db
    .select()
    .from(incomeTable)
    .where(
      and(
        eq(incomeTable.userId, userId),
        eq(incomeTable.monthId, monthId)
      )
    )
    .limit(1);
  if (p) return true;
  const extras = await getAdditionalIncomeForMonth(userId, monthId);
  return extras.length > 0;
}

/* ---------- EXPENSES ---------- */
export async function getExpensesForMonth(userId: string, monthId: string) {
  return db
    .select({
      id: expenses.id,
      name: expenses.name,
      amount: expenses.amount,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
    })
    .from(expenses)
    .innerJoin(
      expenseCategories,
      eq(expenses.categoryId, expenseCategories.id)
    )
    .where(
      and(eq(expenses.userId, userId), eq(expenses.monthId, monthId))
    )
    .orderBy(expenses.createdAt);
}

export async function createExpense(
  userId: string,
  monthId: string,
  data: { name: string; amount: string; categoryId: string }
) {
  const [created] = await db
    .insert(expenses)
    .values({ userId, monthId, ...data })
    .returning();
  return created!;
}

export async function updateExpense(
  userId: string,
  id: string,
  data: { name?: string; amount?: string; categoryId?: string }
) {
  const [updated] = await db
    .update(expenses)
    .set(data)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteExpense(userId: string, id: string) {
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

/* ---------- SAVINGS ACCOUNTS ---------- */
export async function getSavingsAccounts(userId: string) {
  return db
    .select()
    .from(savingsAccounts)
    .where(eq(savingsAccounts.userId, userId))
    .orderBy(savingsAccounts.createdAt);
}

export async function createSavingsAccount(
  userId: string,
  data: { name: string; initialBalance?: string }
) {
  const [created] = await db
    .insert(savingsAccounts)
    .values({
      userId,
      name: data.name,
      initialBalance: data.initialBalance ?? "0",
    })
    .returning();
  return created!;
}

export async function updateSavingsAccount(
  userId: string,
  id: string,
  data: { name?: string; initialBalance?: string }
) {
  const [updated] = await db
    .update(savingsAccounts)
    .set(data)
    .where(and(eq(savingsAccounts.id, id), eq(savingsAccounts.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteSavingsAccount(userId: string, id: string) {
  await db
    .delete(savingsAccounts)
    .where(and(eq(savingsAccounts.id, id), eq(savingsAccounts.userId, userId)));
}

/* ---------- SAVINGS TRANSACTIONS ---------- */
export async function getSavingsTransactionsForMonth(
  userId: string,
  monthId: string
) {
  return db
    .select({
      id: savingsTransactions.id,
      accountId: savingsTransactions.accountId,
      accountName: savingsAccounts.name,
      amount: savingsTransactions.amount,
    })
    .from(savingsTransactions)
    .innerJoin(
      savingsAccounts,
      eq(savingsTransactions.accountId, savingsAccounts.id)
    )
    .where(
      and(
        eq(savingsTransactions.userId, userId),
        eq(savingsTransactions.monthId, monthId)
      )
    )
    .orderBy(savingsTransactions.createdAt);
}

export async function createSavingsTransaction(
  userId: string,
  data: { accountId: string; monthId: string; amount: string }
) {
  const [created] = await db
    .insert(savingsTransactions)
    .values({ userId, ...data })
    .returning();
  return created!;
}

export async function deleteSavingsTransaction(userId: string, id: string) {
  await db
    .delete(savingsTransactions)
    .where(
      and(
        eq(savingsTransactions.id, id),
        eq(savingsTransactions.userId, userId)
      )
    );
}

/* ---------- DEBTS ---------- */
export async function getDebts(userId: string) {
  return db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId))
    .orderBy(debts.createdAt);
}

export async function createDebt(
  userId: string,
  data: {
    name: string;
    principal: string;
    interestRate?: string | null;
    monthlyPayment: string;
  }
) {
  const [created] = await db.insert(debts).values({ userId, ...data }).returning();
  return created!;
}

export async function updateDebt(
  userId: string,
  id: string,
  data: {
    name?: string;
    principal?: string;
    interestRate?: string | null;
    monthlyPayment?: string;
  }
) {
  const [updated] = await db
    .update(debts)
    .set(data)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteDebt(userId: string, id: string) {
  await db
    .delete(debts)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)));
}

/* ---------- SUBSCRIPTIONS ---------- */
export async function getSubscriptions(userId: string) {
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.name);
}

export async function createSubscription(
  userId: string,
  data: {
    name: string;
    amount: string;
    billingDay?: number | null;
    isActive?: boolean;
  }
) {
  const [created] = await db
    .insert(subscriptions)
    .values({ userId, isActive: true, ...data })
    .returning();
  return created!;
}

export async function updateSubscription(
  userId: string,
  id: string,
  data: {
    name?: string;
    amount?: string;
    billingDay?: number | null;
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(subscriptions)
    .set(data)
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))
    )
    .returning();
  return updated ?? null;
}

export async function deleteSubscription(userId: string, id: string) {
  await db
    .delete(subscriptions)
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))
    );
}

/* ---------- AI INSIGHTS ---------- */
export async function getAiInsights(userId: string, limit = 20) {
  return db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(limit);
}

export async function createAiInsight(
  userId: string,
  data: { monthId?: string | null; prompt: string; response: string }
) {
  const [created] = await db
    .insert(aiInsights)
    .values({ userId, ...data })
    .returning();
  return created!;
}

/* ---------- GOALS ---------- */
export async function getGoals(userId: string) {
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(goals.createdAt);
}

export async function getGoalAccounts(userId: string, goalId: string) {
  const rows = await db
    .select({ accountId: goalAccounts.accountId })
    .from(goalAccounts)
    .innerJoin(goals, eq(goalAccounts.goalId, goals.id))
    .where(
      and(
        eq(goals.userId, userId),
        eq(goalAccounts.goalId, goalId)
      )
    );
  return rows.map((r: { accountId: string }) => r.accountId);
}

export async function getGoalsWithProgress(userId: string) {
  const allGoals = await getGoals(userId);
  const accounts = await getSavingsAccounts(userId);
  const balanceByAccount = new Map<string, number>();
  for (const a of accounts) {
    const init = parseFloat(String(a.initialBalance) || "0");
    balanceByAccount.set(a.id, init);
  }
  for (const acc of accounts) {
    const tx = await getSavingsTransactionsForAccount(userId, acc.id);
    let sum = balanceByAccount.get(acc.id) ?? 0;
    for (const t of tx) {
      sum += parseFloat(String(t.amount) || "0");
    }
    balanceByAccount.set(acc.id, sum);
  }

  const result: {
    id: string;
    name: string;
    targetAmount: string;
    targetDate: Date | null;
    accountIds: string[];
    progress: number;
  }[] = [];

  for (const g of allGoals) {
    const accountIds = await getGoalAccounts(userId, g.id);
    let progress = 0;
    for (const aid of accountIds) {
      progress += balanceByAccount.get(aid) ?? 0;
    }
    result.push({
      id: g.id,
      name: g.name,
      targetAmount: String(g.targetAmount),
      targetDate: g.targetDate,
      accountIds,
      progress,
    });
  }
  return result;
}

export async function createGoal(
  userId: string,
  data: {
    name: string;
    targetAmount: string;
    targetDate?: string | null;
  }
) {
  const [created] = await db
    .insert(goals)
    .values({
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    })
    .returning();
  return created!;
}

export async function updateGoal(
  userId: string,
  id: string,
  data: {
    name?: string;
    targetAmount?: string;
    targetDate?: string | null;
  }
) {
  const updates: { name?: string; targetAmount?: string; targetDate?: Date | null } = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.targetAmount !== undefined) updates.targetAmount = data.targetAmount;
  if (data.targetDate !== undefined) {
    updates.targetDate = data.targetDate ? new Date(data.targetDate) : null;
  }
  const [updated] = await db
    .update(goals)
    .set(updates)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteGoal(userId: string, id: string) {
  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
}

export async function linkAccountToGoal(
  userId: string,
  goalId: string,
  accountId: string
) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!goal) return;
  const existing = await db
    .select()
    .from(goalAccounts)
    .where(
      and(
        eq(goalAccounts.goalId, goalId),
        eq(goalAccounts.accountId, accountId)
      )
    )
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(goalAccounts).values({ goalId, accountId });
}

export async function unlinkAccountFromGoal(
  userId: string,
  goalId: string,
  accountId: string
) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!goal) return;
  await db
    .delete(goalAccounts)
    .where(
      and(
        eq(goalAccounts.goalId, goalId),
        eq(goalAccounts.accountId, accountId)
      )
    );
}

/* ---------- ANALYTICS ---------- */
export async function getMonthsForUser(userId: string, limit = 12) {
  return db
    .select()
    .from(months)
    .where(eq(months.userId, userId))
    .orderBy(desc(months.year), desc(months.month))
    .limit(limit);
}

export async function getIncomeForMonths(
  userId: string,
  monthIds: string[]
) {
  if (monthIds.length === 0) return [];
  return db
    .select()
    .from(incomeTable)
    .where(
      and(
        eq(incomeTable.userId, userId),
        inArray(incomeTable.monthId, monthIds)
      )
    );
}

export async function getExpensesForMonths(
  userId: string,
  monthIds: string[]
) {
  if (monthIds.length === 0) return [];
  return db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        inArray(expenses.monthId, monthIds)
      )
    );
}

export async function getSavingsTransactionsForAccount(
  userId: string,
  accountId: string
) {
  return db
    .select()
    .from(savingsTransactions)
    .where(
      and(
        eq(savingsTransactions.userId, userId),
        eq(savingsTransactions.accountId, accountId)
      )
    )
    .orderBy(savingsTransactions.createdAt);
}
