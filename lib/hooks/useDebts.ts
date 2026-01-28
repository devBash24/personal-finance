"use client";

import useSWR from "swr";
import { fetchDebtsAction } from "@/app/dashboard/debts/actions";

export function useDebts() {
  const key = ["debts"] as const;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      const res = await fetchDebtsAction();
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    }
  );
  return { data, error, isLoading, isValidating, mutate };
}
