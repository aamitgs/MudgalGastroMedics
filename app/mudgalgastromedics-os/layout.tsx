import { OfflineBanner } from "@/components/design-system/OfflineBanner";

export default function HospitalOsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
