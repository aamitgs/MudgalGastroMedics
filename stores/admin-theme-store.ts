import { create } from "zustand";

type AdminThemeState = {
  dark: boolean;
  setDark: (dark: boolean) => void;
  toggleDark: () => void;
};

export const useAdminThemeStore = create<AdminThemeState>((set) => ({
  dark: false,
  setDark: (dark) => set({ dark }),
  toggleDark: () => set((state) => ({ dark: !state.dark }))
}));
