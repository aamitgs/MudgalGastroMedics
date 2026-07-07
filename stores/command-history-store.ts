import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Shared open state so a visible header trigger and the Ctrl/Cmd+K listener control one palette instance. */
export const useCommandPaletteStore = create<{ open: boolean; setOpen: (open: boolean) => void; toggle: () => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open }))
}));

export type RecentPatient = { phone: string; name: string; openedAt: string };
export type FavouriteCommand = { id: string; label: string; href: string };

const maxRecents = 8;
const maxFavourites = 12;

type CommandHistoryState = {
  recentPatients: RecentPatient[];
  favouriteCommands: FavouriteCommand[];
  recordRecentPatient: (phone: string, name: string) => void;
  toggleFavouriteCommand: (command: FavouriteCommand) => void;
  isFavouriteCommand: (id: string) => boolean;
};

/**
 * Personal productivity state for the global command palette (Track 2.7):
 * recently-viewed patients and favourited commands, persisted per browser so
 * they survive reloads. Deliberately client-local — this is convenience
 * state, not a record any workflow depends on.
 */
export const useCommandHistoryStore = create<CommandHistoryState>()(
  persist(
    (set, get) => ({
      recentPatients: [],
      favouriteCommands: [],
      recordRecentPatient: (phone, name) =>
        set((state) => ({
          recentPatients: [
            { phone, name, openedAt: new Date().toISOString() },
            ...state.recentPatients.filter((entry) => entry.phone !== phone)
          ].slice(0, maxRecents)
        })),
      toggleFavouriteCommand: (command) =>
        set((state) => {
          const exists = state.favouriteCommands.some((entry) => entry.id === command.id);
          return {
            favouriteCommands: exists
              ? state.favouriteCommands.filter((entry) => entry.id !== command.id)
              : [command, ...state.favouriteCommands].slice(0, maxFavourites)
          };
        }),
      isFavouriteCommand: (id) => get().favouriteCommands.some((entry) => entry.id === id)
    }),
    { name: "mgm-command-history" }
  )
);
