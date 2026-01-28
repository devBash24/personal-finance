"use client";

import useSWR from "swr";
import {
  fetchExpensesAction,
  fetchCategoriesAction,
} from "@/app/dashboard/expenses/actions";

export function useExpenses(month: number, year: number) {
  const key = ["expenses", month, year] as const;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      const [expRes, catRes] = await Promise.all([
        fetchExpensesAction(month, year),
        fetchCategoriesAction(),
      ]);
      if (expRes.error) throw new Error(expRes.error);
      if (catRes.error) throw new Error(catRes.error);
      return {
        expenses: expRes.data ?? [],
        categories: catRes.data ?? [],
      };
    }
  );
  return { data, error, isLoading, isValidating, mutate };
}
