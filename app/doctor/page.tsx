import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DoctorLogin } from "@/components/chrome/DoctorLogin";
import { DoctorPortalWorkspace } from "@/components/chrome/DoctorPortalWorkspace";
import { accessContextFromCookieStore, canOpenDoctorWorkspace } from "@/lib/access/page-auth";

export const metadata: Metadata = {
  title: { absolute: "Doctor Workspace • MudgalGastromedics OS" },
  description: "Protected doctor workspace for OPD queue, UHID-linked patient context, prescriptions and follow-up planning.",
  alternates: { canonical: "/doctor" },
  robots: { index: false, follow: false }
};

export default async function DoctorPortalPage() {
  const cookieStore = await cookies();
  const isAuthenticated = canOpenDoctorWorkspace(await accessContextFromCookieStore(cookieStore));

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
          {isAuthenticated ? <DoctorPortalWorkspace /> : <DoctorLogin />}
        </div>
      </section>
    </main>
  );
}
