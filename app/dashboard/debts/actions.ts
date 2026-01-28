"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
} from "@/db/queries";

export async function fetchDebtsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const rows = await getDebts(user.id);
  return { error: null, data: rows };
}

export async function createDebtAction(data: {
  name: string;
  principal: string;
  interestRate?: string | null;
  monthlyPayment: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await createDebt(user.id, data);
  return { error: null };
}

export async function updateDebtAction(
  id: string,
  data: {
    name?: string;
    principal?: string;
    interestRate?: string | null;
    monthlyPayment?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDebt(user.id, id, data);
  return { error: null };
}

export async function deleteDebtAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await deleteDebt(user.id, id);
  return { error: null };
}
