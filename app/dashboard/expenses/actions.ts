"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateMonth,
  getCategories,
  seedDefaultCategories,
  getExpensesForMonth,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/db/queries";

export async function fetchExpensesAction(month: number, year: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const m = await getOrCreateMonth(user.id, month, year);
  const rows = await getExpensesForMonth(user.id, m.id);
  return { error: null, data: rows };
}

export async function fetchCategoriesAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  let cats = await getCategories(user.id);
  if (cats.length === 0) {
    cats = await seedDefaultCategories(user.id);
  }
  return { error: null, data: cats };
}

export async function createExpenseAction(
  month: number,
  year: number,
  data: { name: string; amount: string; categoryId: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const m = await getOrCreateMonth(user.id, month, year);
  await createExpense(user.id, m.id, data);
  return { error: null };
}

export async function updateExpenseAction(
  id: string,
  data: { name?: string; amount?: string; categoryId?: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateExpense(user.id, id, data);
  return { error: null };
}

export async function deleteExpenseAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await deleteExpense(user.id, id);
  return { error: null };
}
