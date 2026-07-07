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
import { RoleTodayBand } from "@/components/hospital-os/RoleTodayBand";
import { visibleAdminModules } from "@/lib/access/admin-modules";
import { accessContextFromCookieStore, canOpenAdminShell } from "@/lib/access/page-auth";

export const metadata: Metadata = {
  title: { absolute: "Operations • MudgalGastromedics OS" },
  description: "Internal reception dashboard for appointment requests and HMS workflow planning at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false }
};

/** Section renderers keyed by registry id (lib/access/admin-modules.ts). */
const moduleComponents: Record<string, React.ReactNode> = {
  "module-reports": <AdminReports />,
  "module-access": <AdminUserManagement />,
  "module-readiness": <AdminProductionReadiness />,
  "module-audit": <AdminAuditLog />,
  "module-analytics": <AdminAnalytics />,
  "module-cms": <AdminCmsWorkspace />,
  "module-modules": <AdminEnterpriseModules />,
  "module-automation": <AdminAutomation />,
  "module-ai-reviews": <AdminAiReviews />,
  "module-patients": <AdminPatients />,
  "module-appointments": <AdminAppointments />,
  "module-opd": <AdminOpdQueue />,
  "module-procedures": <AdminProcedures />,
  "module-ipd": <AdminIpdBeds />,
  "module-doctor-workflow": <AdminDoctorWorkflow />,
  "module-lab": <AdminLab />,
  "module-pharmacy": <AdminPharmacy />,
  "module-billing": <AdminBillingSummary />,
  "module-finance": <AdminFinance />,
  "module-hr": <AdminHR />,
  "module-inventory": <AdminInventory />,
  "module-communication": <AdminCommunication />,
  "module-settings": <AdminSettings />
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const context = await accessContextFromCookieStore(cookieStore);
  const isAuthenticated = canOpenAdminShell(context);
  // Role-filtered modules (Track 2.2): render only what the active role may
  // view. The server enforces the same matrix on every API call — this
  // removes 403 dead-ends, it is not the security boundary.
  const modules = isAuthenticated ? visibleAdminModules(context.activeRole) : [];

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

        {isAuthenticated ? <AdminModuleNav modules={modules.map(({ id, label }) => ({ id, label }))} /> : null}

        <Section muted className="pb-10 pt-8 md:pb-12 md:pt-10">
          {isAuthenticated ? (
            <div className="grid gap-4">
              <RoleTodayBand role={context.activeRole} />
              {modules.map((module) => (
                <section key={module.id} id={module.id} className="scroll-mt-28">
                  {moduleComponents[module.id]}
                </section>
              ))}
            </div>
          ) : (
            <AdminLogin />
          )}
        </Section>
    </main>
  );
}
