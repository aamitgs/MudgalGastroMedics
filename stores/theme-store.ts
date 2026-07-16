import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeState = {
  dark: boolean;
  setDark: (dark: boolean) => void;
  toggleDark: () => void;
};

/**
 * Shared dark-mode preference across the staff surface. `StaffChrome` (Doctor
 * Portal) and `HospitalOsShell` (Hospital OS modules) are mutually exclusive
 * top-level wrappers for different route families, but a staff member moving
 * between them should see one consistent theme choice — previously each had
 * its own store and localStorage key, so the preference reset when switching
 * surfaces. One localStorage key, one preference, everywhere.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      setDark: (dark) => set({ dark }),
      toggleDark: () => set((state) => ({ dark: !state.dark }))
    }),
    { name: "mgm-staff-theme" }
  )
);
