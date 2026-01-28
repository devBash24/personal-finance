import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* =========================
   PROFILES
   ========================= */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   MONTHS (CORE TIME UNIT)
   ========================= */
export const months = pgTable(
  "months",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueMonth: uniqueIndex("uq_user_month_year").on(
      t.userId,
      t.month,
      t.year
    ),
  })
);

/* =========================
   INCOME
   ========================= */
export const income = pgTable("income", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  monthId: uuid("month_id")
    .notNull()
    .references(() => months.id, { onDelete: "cascade" }),
  grossIncome: numeric("gross_income", { precision: 12, scale: 2 }).notNull(),
  taxDeduction: numeric("tax_deduction", {
    precision: 12,
    scale: 2,
  }).default("0"),
  nisDeduction: numeric("nis_deduction", {
    precision: 12,
    scale: 2,
  }).default("0"),
  otherDeductions: numeric("other_deductions", {
    precision: 12,
    scale: 2,
  }).default("0"),
  netIncome: numeric("net_income", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   EXPENSE CATEGORIES
   ========================= */
export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
});

/* =========================
   EXPENSES
   ========================= */
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    monthId: uuid("month_id")
      .notNull()
      .references(() => months.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => expenseCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    monthIdx: index("idx_expenses_month").on(t.monthId),
    categoryIdx: index("idx_expenses_category").on(t.categoryId),
  })
);

/* =========================
   SAVINGS ACCOUNTS
   ========================= */
export const savingsAccounts = pgTable("savings_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  initialBalance: numeric("initial_balance", {
    precision: 12,
    scale: 2,
  }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   SAVINGS TRANSACTIONS
   ========================= */
export const savingsTransactions = pgTable(
  "savings_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => savingsAccounts.id, { onDelete: "cascade" }),
    monthId: uuid("month_id")
      .notNull()
      .references(() => months.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    accountIdx: index("idx_savings_account").on(t.accountId),
  })
);

/* =========================
   DEBTS
   ========================= */
export const debts = pgTable("debts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  principal: numeric("principal", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }),
  monthlyPayment: numeric("monthly_payment", {
    precision: 12,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   SUBSCRIPTIONS
   ========================= */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  billingDay: integer("billing_day"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   ADDITIONAL INCOME
   ========================= */
export const additionalIncome = pgTable(
  "additional_income",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    monthId: uuid("month_id")
      .notNull()
      .references(() => months.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ monthIdx: index("idx_additional_income_month").on(t.monthId) })
);

/* =========================
   GOALS
   ========================= */
export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  targetDate: timestamp("target_date", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   GOAL ACCOUNTS (goal ↔ savings accounts)
   ========================= */
export const goalAccounts = pgTable(
  "goal_accounts",
  {
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => savingsAccounts.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uniq: uniqueIndex("uq_goal_account").on(t.goalId, t.accountId),
  })
);

/* =========================
   AI INSIGHTS
   ========================= */
export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  monthId: uuid("month_id").references(() => months.id, { onDelete: "set null" }),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   RELATIONS
   ========================= */
export const profilesRelations = relations(profiles, ({ many }) => ({
  months: many(months),
  income: many(income),
  additionalIncome: many(additionalIncome),
  expenses: many(expenses),
  expenseCategories: many(expenseCategories),
  savingsAccounts: many(savingsAccounts),
  goals: many(goals),
  debts: many(debts),
  subscriptions: many(subscriptions),
  aiInsights: many(aiInsights),
}));

export const monthsRelations = relations(months, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [months.userId],
    references: [profiles.id],
  }),
  income: one(income),
  additionalIncome: many(additionalIncome),
  expenses: many(expenses),
  savingsTransactions: many(savingsTransactions),
  aiInsights: many(aiInsights),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  month: one(months, {
    fields: [income.monthId],
    references: [months.id],
  }),
  profile: one(profiles, {
    fields: [income.userId],
    references: [profiles.id],
  }),
}));

export const expenseCategoriesRelations = relations(
  expenseCategories,
  ({ one, many }) => ({
    profile: one(profiles, {
      fields: [expenseCategories.userId],
      references: [profiles.id],
    }),
    expenses: many(expenses),
  })
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  profile: one(profiles, {
    fields: [expenses.userId],
    references: [profiles.id],
  }),
  month: one(months, {
    fields: [expenses.monthId],
    references: [months.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
}));

export const savingsAccountsRelations = relations(
  savingsAccounts,
  ({ one, many }) => ({
    profile: one(profiles, {
      fields: [savingsAccounts.userId],
      references: [profiles.id],
    }),
    transactions: many(savingsTransactions),
  })
);

export const savingsTransactionsRelations = relations(
  savingsTransactions,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [savingsTransactions.userId],
      references: [profiles.id],
    }),
    account: one(savingsAccounts, {
      fields: [savingsTransactions.accountId],
      references: [savingsAccounts.id],
    }),
    month: one(months, {
      fields: [savingsTransactions.monthId],
      references: [months.id],
    }),
  })
);

export const debtsRelations = relations(debts, ({ one }) => ({
  profile: one(profiles, {
    fields: [debts.userId],
    references: [profiles.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  profile: one(profiles, {
    fields: [subscriptions.userId],
    references: [profiles.id],
  }),
}));

export const additionalIncomeRelations = relations(additionalIncome, ({ one }) => ({
  profile: one(profiles, {
    fields: [additionalIncome.userId],
    references: [profiles.id],
  }),
  month: one(months, {
    fields: [additionalIncome.monthId],
    references: [months.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [goals.userId],
    references: [profiles.id],
  }),
  goalAccounts: many(goalAccounts),
}));

export const goalAccountsRelations = relations(goalAccounts, ({ one }) => ({
  goal: one(goals, {
    fields: [goalAccounts.goalId],
    references: [goals.id],
  }),
  account: one(savingsAccounts, {
    fields: [goalAccounts.accountId],
    references: [savingsAccounts.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  profile: one(profiles, {
    fields: [aiInsights.userId],
    references: [profiles.id],
  }),
  month: one(months, {
    fields: [aiInsights.monthId],
    references: [months.id],
  }),
}));
