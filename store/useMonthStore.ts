import { create } from "zustand";

const now = new Date();

interface MonthState {
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
  setMonthYear: (m: number, y: number) => void;
}

export const useMonthStore = create<MonthState>((set) => ({
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),
  setMonthYear: (month, year) => set({ month, year }),
}));
