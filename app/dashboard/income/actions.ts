"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateMonth,
  getIncomeForMonth,
  getAdditionalIncomeForMonth,
  upsertIncome,
  hasAnyIncomeForMonth,
  getPreviousMonth,
  copyIncomeFromMonth,
  createAdditionalIncome,
  updateAdditionalIncome,
  deleteAdditionalIncome,
} from "@/db/queries";

export async function fetchIncomeAction(month: number, year: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const m = await getOrCreateMonth(user.id, month, year);
  const hasAny = await hasAnyIncomeForMonth(user.id, m.id);
  if (!hasAny) {
    const prev = await getPreviousMonth(user.id, month, year);
    if (prev) await copyIncomeFromMonth(user.id, prev.id, m.id);
  }
  const [primary, additional] = await Promise.all([
    getIncomeForMonth(user.id, m.id),
    getAdditionalIncomeForMonth(user.id, m.id),
  ]);
  return {
    error: null,
    data: {
      primary,
      additional: additional.map((a: { id: string; label: string; amount: string }) => ({
        id: a.id,
        label: a.label,
        amount: a.amount,
      })),
    },
  };
}

export async function upsertIncomeAction(
  month: number,
  year: number,
  data: {
    grossIncome: string;
    taxDeduction: string;
    nisDeduction: string;
    otherDeductions: string;
    netIncome: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const m = await getOrCreateMonth(user.id, month, year);
  await upsertIncome(user.id, m.id, data);
  return { error: null };
}

export async function createAdditionalIncomeAction(
  month: number,
  year: number,
  data: { label: string; amount: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const m = await getOrCreateMonth(user.id, month, year);
  await createAdditionalIncome(user.id, m.id, data);
  return { error: null };
}

export async function updateAdditionalIncomeAction(
  id: string,
  data: { label?: string; amount?: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateAdditionalIncome(user.id, id, data);
  return { error: null };
}

export async function deleteAdditionalIncomeAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await deleteAdditionalIncome(user.id, id);
  return { error: null };
}
