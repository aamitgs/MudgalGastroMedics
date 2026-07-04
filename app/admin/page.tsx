import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminAiReviews } from "@/components/AdminAiReviews";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { AdminAppointments } from "@/components/AdminAppointments";
import { AdminAuditLog } from "@/components/AdminAuditLog";
import { AdminAutomation } from "@/components/AdminAutomation";
import { AdminBillingSummary } from "@/components/AdminBillingSummary";
import { AdminCmsWorkspace } from "@/components/AdminCmsWorkspace";
import { AdminCommunication } from "@/components/AdminCommunication";
import { AdminDoctorWorkflow } from "@/components/AdminDoctorWorkflow";
import { AdminEnterpriseModules } from "@/components/AdminEnterpriseModules";
import { AdminFinance } from "@/components/AdminFinance";
import { AdminHR } from "@/components/AdminHR";
import { AdminInventory } from "@/components/AdminInventory";
import { AdminIpdBeds } from "@/components/AdminIpdBeds";
import { AdminLab } from "@/components/AdminLab";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminModuleNav } from "@/components/AdminModuleNav";
import { AdminOpdQueue } from "@/components/AdminOpdQueue";
import { AdminPatients } from "@/components/AdminPatients";
import { AdminPharmacy } from "@/components/AdminPharmacy";
import { AdminProductionReadiness } from "@/components/AdminProductionReadiness";
import { AdminProcedures } from "@/components/AdminProcedures";
import { AdminReports } from "@/components/AdminReports";
import { AdminSettings } from "@/components/AdminSettings";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { Section } from "@/components/Section";
import { accessContextFromCookieStore, canOpenAdminShell } from "@/lib/access/page-auth";

export const metadata: Metadata = {
  title: { absolute: "Operations • MudgalGastromedics OS" },
  description: "Internal reception dashboard for appointment requests and HMS workflow planning at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false }
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = canOpenAdminShell(await accessContextFromCookieStore(cookieStore));

  return (
    <main>
        <section className="border-b border-line bg-surface">
          <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Operations</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">Reception &amp; operations dashboard</h1>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted">
              Appointment requests, patient records, OPD/IPD, billing, lab, pharmacy and access control for staff follow-up and queue planning.
            </p>
          </div>
        </section>

        {isAuthenticated ? <AdminModuleNav /> : null}

        <Section muted className="pb-10 pt-8 md:pb-12 md:pt-10">
          {isAuthenticated ? (
            <div className="grid gap-4">
              <section id="module-reports" className="scroll-mt-28"><AdminReports /></section>
              <section id="module-access" className="scroll-mt-28"><AdminUserManagement /></section>
              <section id="module-readiness" className="scroll-mt-28"><AdminProductionReadiness /></section>
              <section id="module-audit" className="scroll-mt-28"><AdminAuditLog /></section>
              <section id="module-analytics" className="scroll-mt-28"><AdminAnalytics /></section>
              <section id="module-cms" className="scroll-mt-28"><AdminCmsWorkspace /></section>
              <section id="module-modules" className="scroll-mt-28"><AdminEnterpriseModules /></section>
              <section id="module-automation" className="scroll-mt-28"><AdminAutomation /></section>
              <section id="module-ai-reviews" className="scroll-mt-28"><AdminAiReviews /></section>
              <section id="module-patients" className="scroll-mt-28"><AdminPatients /></section>
              <section id="module-appointments" className="scroll-mt-28"><AdminAppointments /></section>
              <section id="module-opd" className="scroll-mt-28"><AdminOpdQueue /></section>
              <section id="module-procedures" className="scroll-mt-28"><AdminProcedures /></section>
              <section id="module-ipd" className="scroll-mt-28"><AdminIpdBeds /></section>
              <section id="module-doctor-workflow" className="scroll-mt-28"><AdminDoctorWorkflow /></section>
              <section id="module-lab" className="scroll-mt-28"><AdminLab /></section>
              <section id="module-pharmacy" className="scroll-mt-28"><AdminPharmacy /></section>
              <section id="module-billing" className="scroll-mt-28"><AdminBillingSummary /></section>
              <section id="module-finance" className="scroll-mt-28"><AdminFinance /></section>
              <section id="module-hr" className="scroll-mt-28"><AdminHR /></section>
              <section id="module-inventory" className="scroll-mt-28"><AdminInventory /></section>
              <section id="module-communication" className="scroll-mt-28"><AdminCommunication /></section>
              <section id="module-settings" className="scroll-mt-28"><AdminSettings /></section>
            </div>
          ) : (
            <AdminLogin />
          )}
        </Section>
    </main>
  );
}
