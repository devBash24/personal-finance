"use client";

import useSWR from "swr";
import { fetchSubscriptionsAction } from "@/app/dashboard/subscriptions/actions";

export function useSubscriptions() {
  const key = ["subscriptions"] as const;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      const res = await fetchSubscriptionsAction();
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    }
  );
  return { data, error, isLoading, isValidating, mutate };
}
