"use client";

import useSWR from "swr";
import {
  fetchSavingsAccountsAction,
  fetchSavingsTransactionsAction,
} from "@/app/dashboard/savings/actions";

export function useSavings(month: number, year: number) {
  const key = ["savings", month, year] as const;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      const [accRes, txRes] = await Promise.all([
        fetchSavingsAccountsAction(),
        fetchSavingsTransactionsAction(month, year),
      ]);
      if (accRes.error) throw new Error(accRes.error);
      if (txRes.error) throw new Error(txRes.error);
      return {
        accounts: accRes.data ?? [],
        transactions: txRes.data ?? [],
      };
    }
  );
  return { data, error, isLoading, isValidating, mutate };
}
