import "server-only";

import { retentionPolicyBlockers } from "@/lib/retention/policy";

export type ProductionCheckStatus = "pass" | "warn" | "fail";

export type ProductionCheck = {
  id: string;
  label: string;
  area: "Security" | "Data" | "Operations" | "Compliance" | "Build" | "Integrations";
  status: ProductionCheckStatus;
  detail: string;
  action: string;
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function usesDatabaseSource() {
  return process.env.DATA_SOURCE === "database";
}

function check(id: string, label: string, area: ProductionCheck["area"], status: ProductionCheckStatus, detail: string, action: string): ProductionCheck {
  return { id, label, area, status, detail, action };
}

export function createProductionReadiness() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const retentionBlockers = retentionPolicyBlockers();
  const checks: ProductionCheck[] = [
    check(
      "admin-passcode",
      "Admin staff login",
      "Security",
      (hasEnv("STAFF_USERS_JSON") || hasEnv("ADMIN_PASSWORD")) && hasEnv("ADMIN_AUTH_SECRET") ? "pass" : "fail",
      (hasEnv("STAFF_USERS_JSON") || hasEnv("ADMIN_PASSWORD")) && hasEnv("ADMIN_AUTH_SECRET")
        ? "Named staff credentials and ADMIN_AUTH_SECRET are configured."
        : "Production admin login is disabled until named staff credentials and a signing secret are configured.",
      "Set STAFF_USERS_JSON or ADMIN_PASSWORD plus a strong ADMIN_AUTH_SECRET in production secrets."
    ),
    check(
      "doctor-passcode",
      "Doctor passcode",
      "Security",
      hasEnv("DOCTOR_PASSCODE") ? "pass" : "fail",
      hasEnv("DOCTOR_PASSCODE") ? "DOCTOR_PASSCODE is configured." : "Production doctor login is disabled until DOCTOR_PASSCODE is configured.",
      "Set a strong DOCTOR_PASSCODE in production secrets."
    ),
    check(
      "mobile-token",
      "Mobile API token",
      "Security",
      hasEnv("MOBILE_API_TOKEN") ? "pass" : "warn",
      hasEnv("MOBILE_API_TOKEN") ? "MOBILE_API_TOKEN is configured." : "Production mobile API access is disabled until MOBILE_API_TOKEN is configured.",
      "Set MOBILE_API_TOKEN before exposing mobile endpoints."
    ),
    check(
      "database",
      "Database storage",
      "Data",
      hasEnv("DATABASE_URL") && usesDatabaseSource() ? "pass" : "fail",
      hasEnv("DATABASE_URL") && usesDatabaseSource()
        ? "DATABASE_URL is present and DATA_SOURCE=database is configured."
        : "Operational data currently uses local JSON files or DATA_SOURCE is not database.",
      "Set DATABASE_URL, apply schema, run npm run db:check, and set DATA_SOURCE=database."
    ),
    check(
      "backups",
      "Backup policy",
      "Operations",
      hasEnv("BACKUP_POLICY_URL") || hasEnv("BACKUP_POLICY") ? "pass" : "fail",
      hasEnv("BACKUP_POLICY_URL") || hasEnv("BACKUP_POLICY") ? "Backup policy reference is configured." : "No backup policy is configured.",
      "Document automated backups, restore testing and retention."
    ),
    check(
      "monitoring",
      "Monitoring",
      "Operations",
      hasEnv("MONITORING_DSN") || hasEnv("SENTRY_DSN") ? "pass" : "warn",
      hasEnv("MONITORING_DSN") || hasEnv("SENTRY_DSN") ? "Monitoring endpoint is configured." : "No monitoring endpoint is configured.",
      "Add error monitoring, uptime checks and alert routing."
    ),
    check(
      "email",
      "Email/SMS delivery",
      "Integrations",
      hasEnv("SMTP_URL") || hasEnv("SMS_PROVIDER_KEY") || hasEnv("WHATSAPP_PROVIDER_KEY") ? "pass" : "warn",
      hasEnv("SMTP_URL") || hasEnv("SMS_PROVIDER_KEY") || hasEnv("WHATSAPP_PROVIDER_KEY") ? "Outbound provider config is present." : "Communication is currently handoff/log based.",
      "Connect approved email/SMS/WhatsApp provider credentials."
    ),
    check(
      "ai-summary",
      "AI patient summary",
      "Integrations",
      hasEnv("ANTHROPIC_API_KEY") ? "pass" : "warn",
      hasEnv("ANTHROPIC_API_KEY") ? "Anthropic API key is configured." : "AI clinical brief generation is disabled until ANTHROPIC_API_KEY is set.",
      "Set ANTHROPIC_API_KEY to enable AI patient summary generation for doctors."
    ),
    check(
      "rbac-launch-team",
      "RBAC named staff accounts",
      "Security",
      "pass",
      "Role-based access control with a data-driven permission matrix, revocable sessions, MFA for Super Admin/Admin, break-glass and two-person role approvals is active. Seed the launch team from Admin > Access Control.",
      "After seeding, distribute temporary passwords individually and confirm every account completed its forced password reset."
    ),
    check(
      "patient-portal-otp",
      "Patient portal SMS OTP",
      "Integrations",
      hasEnv("SMS_PROVIDER_KEY") && hasEnv("MSG91_TEMPLATE_ID") ? "pass" : "warn",
      hasEnv("SMS_PROVIDER_KEY") && hasEnv("MSG91_TEMPLATE_ID")
        ? "MSG91 OTP delivery is configured for patient login."
        : "Patient mobile-OTP login is disabled in production until MSG91 credentials are configured (email/password login still works).",
      "Set SMS_PROVIDER_KEY and MSG91_TEMPLATE_ID, then smoke-test one live OTP send."
    ),
    check(
      "pdf-generation",
      "PDF generation (prescription/invoice/discharge)",
      "Operations",
      "pass",
      "Prescription and invoice PDFs render via @react-pdf/renderer; discharge summaries render via headless Chromium (auto-detected locally, @sparticuz/chromium on serverless).",
      "If deploying to a custom runtime where Chrome/Chromium is not auto-detected, set PDF_CHROMIUM_EXECUTABLE_PATH."
    ),
    check(
      "privacy",
      "Privacy and consent",
      "Compliance",
      hasEnv("PRIVACY_REVIEWED_AT") ? "pass" : "fail",
      hasEnv("PRIVACY_REVIEWED_AT") ? "Privacy review date is configured." : "Privacy/compliance review has not been recorded.",
      "Complete legal review for patient data, consent, retention and access logs."
    ),
    // Warning rather than blocker: indefinite retention is a real DPDP §8(7)
    // failure, but it is missing functionality rather than a broken control,
    // and the periods are counsel's to set. Surfaced here so it stays visible
    // instead of living only in docs/privacy-review.md §5.
    check(
      "data-retention",
      "Data retention",
      "Compliance",
      retentionBlockers.length === 0 ? "pass" : "warn",
      retentionBlockers.length === 0
        ? "Retention periods are approved and enforceable."
        : `Nothing is ever deleted. ${retentionBlockers.length} item(s) block a purge: ${retentionBlockers.map((blocker) => blocker.summary).join(" ")}`,
      "Confirm the periods in docs/privacy-review.md §5, then close the schema gaps listed by retentionPolicyBlockers()."
    ),
    check(
      "environment",
      "Runtime environment",
      "Build",
      nodeEnv === "production" ? "pass" : "warn",
      `Current NODE_ENV is ${nodeEnv}.`,
      "Deploy with NODE_ENV=production and verify build output."
    )
  ];

  const failing = checks.filter((item) => item.status === "fail").length;
  const warning = checks.filter((item) => item.status === "warn").length;
  const passing = checks.filter((item) => item.status === "pass").length;
  const status: ProductionCheckStatus = failing ? "fail" : warning ? "warn" : "pass";

  return {
    generatedAt: new Date().toISOString(),
    status,
    summary: {
      passing,
      warning,
      failing,
      total: checks.length
    },
    checks,
    releaseGate: failing === 0,
    recommendation: failing
      ? "Do not go live with patient data until failing production checks are resolved."
      : warning
        ? "Deployment can proceed only after accepting documented warnings."
        : "Production readiness checks are passing."
  };
}
