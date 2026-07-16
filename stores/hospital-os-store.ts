import { create } from "zustand";
import type { HospitalRole, RealtimeMessage } from "@/lib/hospital-os-data";

type RealtimeStatus = "connecting" | "connected" | "polling" | "closed";

type HospitalOsState = {
  role: HospitalRole;
  sidebarCollapsed: boolean;
  activePatientId: string;
  /** Owned by HospitalOsShell (Track 4.13) — one connection per page load, shared
   * via the store so the dashboard's realtime feed doesn't need its own socket. */
  realtimeStatus: RealtimeStatus;
  realtimeMessages: RealtimeMessage[];
  setRole: (role: HospitalRole) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setActivePatient: (patientId: string) => void;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  addRealtimeMessage: (message: RealtimeMessage) => void;
};

export const useHospitalOsStore = create<HospitalOsState>((set) => ({
  role: "Admin",
  sidebarCollapsed: false,
  activePatientId: "pf-1",
  realtimeStatus: "connecting",
  realtimeMessages: [],
  setRole: (role) => set({ role }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActivePatient: (activePatientId) => set({ activePatientId }),
  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
  addRealtimeMessage: (message) => set((state) => ({ realtimeMessages: [message, ...state.realtimeMessages].slice(0, 5) }))
}));
