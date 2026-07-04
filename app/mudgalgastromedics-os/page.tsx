import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLogin } from "@/components/AdminLogin";
import { HospitalOsDynamic } from "@/components/HospitalOsDynamic";
import { accessContextFromCookieStore, canOpenAdminShell } from "@/lib/access/page-auth";

export const metadata: Metadata = {
  title: { absolute: "Dashboard • MudgalGastromedics OS" },
  description: "Premium Hospital Operating System interface for Mudgal Gastromedics Hospital operations, clinical workflows, patient records and live command center.",
  alternates: { canonical: "/mudgalgastromedics-os" },
  robots: { index: false, follow: false }
};

export default async function HospitalOsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = canOpenAdminShell(await accessContextFromCookieStore(cookieStore));

  if (!isAuthenticated) {
    return (
      <main className="hospital-os-theme grid min-h-screen place-items-center bg-[var(--hos-bg)] p-6">
        <div className="w-full max-w-xl">
          <AdminLogin />
        </div>
      </main>
    );
  }

  return <HospitalOsDynamic />;
}
