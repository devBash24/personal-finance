"use client";

import useSWR from "swr";
import { fetchIncomeAction } from "@/app/dashboard/income/actions";

export function useIncome(month: number, year: number) {
  const key = ["income", month, year] as const;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      const res = await fetchIncomeAction(month, year);
      if (res.error) throw new Error(res.error);
      return res.data;
    }
  );
  return { data, error, isLoading, isValidating, mutate };
}
