import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { AdminStaffNotes } from "@/components/staff-notes/AdminStaffNotes";
import { WorkspaceLauncher } from "@/components/chrome/WorkspaceLauncher";
import { accessContextFromCookieStore, canOpenModule } from "@/lib/access/page-auth";

export const metadata: Metadata = {
  title: { absolute: "Staff Notes • MudgalGastromedics OS" },
  description: "Cross-department notes and shift handover for hospital staff.",
  alternates: { canonical: "/mudgalgastromedics-os/staff-notes" },
  robots: { index: false, follow: false }
};

/**
 * Phase 0 pilot (docs/build-roadmap.md) for the Hospital OS routing
 * migration: this module gets its own dedicated route + server-side RBAC
 * gate instead of living as an anchor-scrolled section on /admin. Deliberately
 * not yet wrapped in the extracted Hospital OS shell (sidebar/TopNav) — that's
 * a separate, higher-risk step against the shared shell component.
 */
export default async function StaffNotesPage() {
  const cookieStore = await cookies();
  const context = await accessContextFromCookieStore(cookieStore);

  if (!context.authenticated) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[linear-gradient(160deg,var(--site-soft),var(--site-surface)_45%,var(--site-mist))] px-4 py-16">
        <WorkspaceLauncher />
      </main>
    );
  }

  if (!canOpenModule(context, "module-staff-notes")) {
    return (
      <main>
        <section className="border-b border-line bg-surface">
          <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Staff Notes</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">Cross-department notes</h1>
            </div>
          </div>
        </section>
        <div className="mx-auto grid w-[min(1560px,calc(100%-32px))] place-items-center py-16">
          <div className="grid max-w-md gap-3 rounded border border-line/80 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-line bg-soft text-brand">
              <ShieldAlert size={22} />
            </span>
            <h2 className="text-lg font-bold text-ink">Your role doesn&apos;t have access to this module</h2>
            <p className="text-sm leading-relaxed text-muted">Ask a Super Admin if you need Staff Notes access.</p>
            <Link href="/mudgalgastromedics-os" className="mx-auto mt-2 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
              <ArrowLeft size={15} /> Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-wrap items-center justify-between gap-3 py-5">
          <div>
            <Link href="/mudgalgastromedics-os" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">
              <ArrowLeft size={13} /> Dashboard
            </Link>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Staff Notes</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">Cross-department notes</h1>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            Post and track handover notes between departments — visible to every role that needs to see it.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1560px,calc(100%-32px))] gap-4 py-8">
        <AdminStaffNotes />
      </section>
    </main>
  );
}
