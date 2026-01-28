import { create } from "zustand";

interface UserState {
  id: string | null;
  email: string | null;
  setUser: (id: string | null, email: string | null) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  id: null,
  email: null,
  setUser: (id, email) => set({ id, email }),
  clear: () => set({ id: null, email: null }),
}));
