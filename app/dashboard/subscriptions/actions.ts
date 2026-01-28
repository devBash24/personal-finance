"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/db/queries";

export async function fetchSubscriptionsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const rows = await getSubscriptions(user.id);
  return { error: null, data: rows };
}

export async function createSubscriptionAction(data: {
  name: string;
  amount: string;
  billingDay?: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await createSubscription(user.id, data);
  return { error: null };
}

export async function updateSubscriptionAction(
  id: string,
  data: {
    name?: string;
    amount?: string;
    billingDay?: number | null;
    isActive?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateSubscription(user.id, id, data);
  return { error: null };
}

export async function deleteSubscriptionAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await deleteSubscription(user.id, id);
  return { error: null };
}
