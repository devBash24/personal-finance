"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateMonth,
  getSavingsAccounts,
  getSavingsTransactionsForMonth,
  createSavingsAccount,
  updateSavingsAccount,
  deleteSavingsAccount,
  createSavingsTransaction,
  deleteSavingsTransaction,
} from "@/db/queries";

export async function fetchSavingsAccountsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const rows = await getSavingsAccounts(user.id);
  return { error: null, data: rows };
}

export async function fetchSavingsTransactionsAction(month: number, year: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const m = await getOrCreateMonth(user.id, month, year);
  const rows = await getSavingsTransactionsForMonth(user.id, m.id);
  return { error: null, data: rows };
}

export async function createSavingsAccountAction(data: {
  name: string;
  initialBalance?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await createSavingsAccount(user.id, data);
  return { error: null };
}

export async function updateSavingsAccountAction(
  id: string,
  data: { name?: string; initialBalance?: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateSavingsAccount(user.id, id, data);
  return { error: null };
}

export async function deleteSavingsAccountAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await deleteSavingsAccount(user.id, id);
  return { error: null };
}

export async function createSavingsTransactionAction(
  month: number,
  year: number,
  data: { accountId: string; amount: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const m = await getOrCreateMonth(user.id, month, year);
  await createSavingsTransaction(user.id, { ...data, monthId: m.id });
  return { error: null };
}

export async function deleteSavingsTransactionAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await deleteSavingsTransaction(user.id, id);
  return { error: null };
}
