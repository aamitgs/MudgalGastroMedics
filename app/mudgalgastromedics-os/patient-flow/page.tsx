import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { PatientFlowPage as PatientFlowPageContent } from "@/components/hospital-os/PatientFlowPage";
import { WorkspaceLauncher } from "@/components/chrome/WorkspaceLauncher";
import { HospitalOsPageShell } from "@/components/hospital-os/HospitalOsPageShell";
import { accessContextFromCookieStore, canOpenModule } from "@/lib/access/page-auth";

export const metadata: Metadata = {
  title: { absolute: "Patient Flow • MudgalGastromedics OS" },
  description: "Today's live patient queue across the hospital.",
  alternates: { canonical: "/mudgalgastromedics-os/patient-flow" },
  robots: { index: false, follow: false }
};

/** Sidebar's "Patients" entry (Dashboard/Notifications/Patients routing fix) — same page.tsx pattern as staff-notes/page.tsx. Distinct from "Patient List" (module-patients), the full-CRUD record store. */
export default async function PatientFlowPage() {
  const cookieStore = await cookies();
  const context = await accessContextFromCookieStore(cookieStore);

  if (!context.authenticated) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[linear-gradient(160deg,var(--site-soft),var(--site-surface)_45%,var(--site-mist))] px-4 py-16">
        <WorkspaceLauncher />
      </main>
    );
  }

  if (!canOpenModule(context, "module-patient-flow")) {
    return (
      <main>
        <section className="border-b border-line bg-surface">
          <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Patients</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">Today&apos;s patient flow</h1>
            </div>
          </div>
        </section>
        <div className="mx-auto grid w-[min(1560px,calc(100%-32px))] place-items-center py-16">
          <div className="grid max-w-md gap-3 rounded border border-line/80 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-line bg-soft text-brand">
              <ShieldAlert size={22} />
            </span>
            <h2 className="text-lg font-bold text-ink">Your role doesn&apos;t have access to this module</h2>
            <p className="text-sm leading-relaxed text-muted">Ask a Super Admin if you need Patient Flow access.</p>
            <Link href="/mudgalgastromedics-os" className="mx-auto mt-2 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
              <ArrowLeft size={15} /> Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <HospitalOsPageShell>
      <div className="mx-auto grid w-full max-w-[1560px] gap-5 px-4 py-5 lg:px-6">
        <div className="rounded border border-line bg-surface p-5">
          <Link href="/mudgalgastromedics-os" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Patients</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">Today&apos;s patient flow</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Live queue across the hospital — status, billing, wait time and quick actions for every patient in flow right now.
          </p>
        </div>
        <PatientFlowPageContent />
      </div>
    </HospitalOsPageShell>
  );
}
