"use server";

import { createClient } from "@/lib/supabase/server";
import { getAiInsights } from "@/db/queries";

export async function fetchInsightsAction(limit = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  const rows = await getAiInsights(user.id, limit);
  return { error: null, data: rows };
}
