"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getGoalsWithProgress,
  getSavingsAccounts,
  createGoal,
  updateGoal,
  deleteGoal,
  linkAccountToGoal,
  unlinkAccountFromGoal,
  getGoalAccounts,
} from "@/db/queries";

export async function fetchGoalsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const goals = await getGoalsWithProgress(user.id);
  const accounts = await getSavingsAccounts(user.id);
  return {
    error: null,
    data: {
      goals,
      accounts: accounts.map((a: { id: string; name: string; initialBalance: string | null }) => ({
        id: a.id,
        name: a.name,
        initialBalance: a.initialBalance,
      })),
    },
  };
}

export async function createGoalAction(data: {
  name: string;
  targetAmount: string;
  targetDate?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await createGoal(user.id, data);
  return { error: null };
}

export async function updateGoalAction(
  id: string,
  data: { name?: string; targetAmount?: string; targetDate?: string | null }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateGoal(user.id, id, data);
  return { error: null };
}

export async function deleteGoalAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await deleteGoal(user.id, id);
  return { error: null };
}

export async function linkAccountToGoalAction(goalId: string, accountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await linkAccountToGoal(user.id, goalId, accountId);
  return { error: null };
}

export async function unlinkAccountFromGoalAction(
  goalId: string,
  accountId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await unlinkAccountFromGoal(user.id, goalId, accountId);
  return { error: null };
}

export async function getGoalAccountsAction(goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null as string[] | null };

  const ids = await getGoalAccounts(user.id, goalId);
  return { error: null, data: ids };
}
