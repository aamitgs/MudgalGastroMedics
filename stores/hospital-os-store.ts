import { create } from "zustand";
import type { HospitalRole, PatientFlowRow, RealtimeMessage } from "@/lib/hospital-os-data";

type FlowStatus = {
  patientRegistration: "idle" | "saved";
  appointment: "idle" | "booked";
  billing: "idle" | "posted";
};

type RealtimeStatus = "connecting" | "connected" | "polling" | "closed";

type HospitalOsState = {
  role: HospitalRole;
  sidebarCollapsed: boolean;
  activePatientId: string;
  selectedRows: Record<string, boolean>;
  flowStatus: FlowStatus;
  /** Owned by HospitalOsShell (Track 4.13) — one connection per page load, shared
   * via the store so the dashboard's realtime feed doesn't need its own socket. */
  realtimeStatus: RealtimeStatus;
  realtimeMessages: RealtimeMessage[];
  setRole: (role: HospitalRole) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setActivePatient: (patientId: string) => void;
  setSelectedRows: (rows: Record<string, boolean>) => void;
  markPatientRegistered: (patient: Pick<PatientFlowRow, "uhid" | "patient">) => void;
  markAppointmentBooked: () => void;
  markBillingPosted: () => void;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  addRealtimeMessage: (message: RealtimeMessage) => void;
};

export const useHospitalOsStore = create<HospitalOsState>((set) => ({
  role: "Admin",
  sidebarCollapsed: false,
  activePatientId: "pf-1",
  selectedRows: {},
  flowStatus: {
    patientRegistration: "idle",
    appointment: "idle",
    billing: "idle"
  },
  realtimeStatus: "connecting",
  realtimeMessages: [],
  setRole: (role) => set({ role }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActivePatient: (activePatientId) => set({ activePatientId }),
  setSelectedRows: (selectedRows) => set({ selectedRows }),
  markPatientRegistered: () => set((state) => ({ flowStatus: { ...state.flowStatus, patientRegistration: "saved" } })),
  markAppointmentBooked: () => set((state) => ({ flowStatus: { ...state.flowStatus, appointment: "booked" } })),
  markBillingPosted: () => set((state) => ({ flowStatus: { ...state.flowStatus, billing: "posted" } })),
  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
  addRealtimeMessage: (message) => set((state) => ({ realtimeMessages: [message, ...state.realtimeMessages].slice(0, 5) }))
}));
