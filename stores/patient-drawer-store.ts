import { create } from "zustand";

/**
 * App-wide state for the Global Patient Drawer (Track 2.1): any module opens
 * patient context by phone (the cross-store identity key) without navigation.
 */
type PatientDrawerState = {
  phone: string;
  patientName: string;
  open: boolean;
  openDrawer: (phone: string, patientName: string) => void;
  closeDrawer: () => void;
};

export const usePatientDrawerStore = create<PatientDrawerState>((set) => ({
  phone: "",
  patientName: "",
  open: false,
  openDrawer: (phone, patientName) => set({ phone, patientName, open: true }),
  closeDrawer: () => set({ open: false })
}));
