import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DoctorLogin } from "@/components/DoctorLogin";
import { DoctorPortalWorkspace } from "@/components/DoctorPortalWorkspace";
import { Section } from "@/components/Section";
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

      <Section muted className="pt-10 md:pt-14">
        {isAuthenticated ? <DoctorPortalWorkspace /> : <DoctorLogin />}
      </Section>
    </main>
  );
}
