import { StaffChrome } from "@/components/chrome/StaffChrome";

export default function DoctorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StaffChrome>{children}</StaffChrome>;
}
