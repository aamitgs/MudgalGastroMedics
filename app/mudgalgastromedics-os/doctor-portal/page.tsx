import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DoctorPortalWorkspace } from "@/components/chrome/DoctorPortalWorkspace";
import { accessContextFromCookieStore, canOpenDoctorWorkspace } from "@/lib/access/page-auth";
import { listOpdVisits } from "@/lib/opd-store";
import { listPatients } from "@/lib/patient-store";

export const metadata: Metadata = {
  title: { absolute: "Doctor Workspace • MudgalGastromedics OS" },
  description: "Protected doctor workspace for OPD queue, UHID-linked patient context, prescriptions and follow-up planning.",
  alternates: { canonical: "/mudgalgastromedics-os/doctor-portal" },
  robots: { index: false, follow: false }
};

export default async function DoctorPortalPage() {
  const cookieStore = await cookies();
  const isAuthenticated = canOpenDoctorWorkspace(await accessContextFromCookieStore(cookieStore));

  // Doctor login now lives on the Doctor Portal tile in WorkspaceLauncher
  // (Track 4.13) instead of a standalone form here — anyone who can't open
  // this workspace (never signed in, or signed in with a non-doctor role)
  // goes to the one real entry point instead.
  if (!isAuthenticated) redirect("/mudgalgastromedics-os");

  // Fetched here instead of client-side on mount (Track 3.4 audit) — the
  // doctor/duty-doctor/super-admin roles that can reach this gate already
  // have "view" on both "appointments" and "patients" in the RBAC matrix
  // (lib/access/matrix.ts), so calling the stores directly is exactly as
  // authorized as the client fetch it replaces, without the extra HTTP
  // round-trip through /api/opd and /api/patients.
  const [visits, patients] = await Promise.all([listOpdVisits(), listPatients()]);

  return (
    <main>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-wrap items-center justify-between gap-3 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Doctor Workspace</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">Clinical workspace</h1>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            UHID-linked OPD queue, patient context, clinical notes, prescriptions and follow-up planning in one focused view.
          </p>
        </div>
      </section>

      {/* Deliberately not components/site/Section — that's the public-website
          marketing wrapper (caps content at 1180px), a chrome-split violation
          on an authenticated OS surface. This matches the 1560px width already
          used by this page's own hero and StaffChrome's top bar. */}
      <section className="clinical-grid bg-soft/75 pb-16 pt-10 md:pb-24 md:pt-14">
        <div className="mx-auto w-[min(1560px,calc(100%-32px))]">
          <DoctorPortalWorkspace initialVisits={visits} initialPatients={patients} />
        </div>
      </section>
    </main>
  );
}
