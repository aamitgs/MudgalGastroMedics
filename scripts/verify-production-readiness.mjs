const reportOnly = process.argv.includes("--report-only");
const jsonOutput = process.argv.includes("--json");

function hasEnv(name) {
  return Boolean(process.env[name]?.trim());
}

function check(id, label, area, status, detail, action) {
  return { id, label, area, status, detail, action };
}

function createReadiness() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const staffAuthReady = (hasEnv("STAFF_USERS_JSON") || hasEnv("ADMIN_PASSWORD")) && hasEnv("ADMIN_AUTH_SECRET");
  const databaseReady = hasEnv("DATABASE_URL") && process.env.DATA_SOURCE === "database";

  const checks = [
    check(
      "admin-auth",
      "Admin staff authentication",
      "Security",
      staffAuthReady ? "pass" : "fail",
      staffAuthReady ? "Named staff credentials and ADMIN_AUTH_SECRET are configured." : "Production admin login is disabled until named staff credentials and ADMIN_AUTH_SECRET are configured.",
      "Set STAFF_USERS_JSON or ADMIN_PASSWORD plus a strong ADMIN_AUTH_SECRET."
    ),
    check(
      "doctor-auth",
      "Doctor authentication secret",
      "Security",
      hasEnv("DOCTOR_PASSCODE") ? "pass" : "fail",
      hasEnv("DOCTOR_PASSCODE") ? "DOCTOR_PASSCODE is configured." : "Production doctor login is disabled until DOCTOR_PASSCODE is configured.",
      "Set a strong DOCTOR_PASSCODE."
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
      databaseReady ? "pass" : "fail",
      databaseReady ? "DATABASE_URL and DATA_SOURCE=database are configured." : "Runtime data is not configured for managed database storage.",
      "Apply database/schema.sql, run npm run db:check, and set DATA_SOURCE=database."
    ),
    check(
      "backups",
      "Backup policy",
      "Operations",
      hasEnv("BACKUP_POLICY_URL") || hasEnv("BACKUP_POLICY") ? "pass" : "fail",
      hasEnv("BACKUP_POLICY_URL") || hasEnv("BACKUP_POLICY") ? "Backup policy reference is configured." : "No backup policy is configured.",
      "Document automated backups, restore testing, retention, and ownership."
    ),
    check(
      "monitoring",
      "Monitoring",
      "Operations",
      hasEnv("MONITORING_DSN") || hasEnv("SENTRY_DSN") ? "pass" : "warn",
      hasEnv("MONITORING_DSN") || hasEnv("SENTRY_DSN") ? "Monitoring endpoint is configured." : "No monitoring endpoint is configured.",
      "Add error monitoring, uptime checks, alert routing, and incident ownership."
    ),
    check(
      "communications",
      "Email/SMS/WhatsApp delivery",
      "Integrations",
      hasEnv("SMTP_URL") || hasEnv("SMS_PROVIDER_KEY") || hasEnv("WHATSAPP_PROVIDER_KEY") ? "pass" : "warn",
      hasEnv("SMTP_URL") || hasEnv("SMS_PROVIDER_KEY") || hasEnv("WHATSAPP_PROVIDER_KEY") ? "Outbound provider config is present." : "Communication workflows are not connected to production providers.",
      "Connect approved communication provider credentials."
    ),
    check(
      "privacy",
      "Privacy and consent review",
      "Compliance",
      hasEnv("PRIVACY_REVIEWED_AT") ? "pass" : "fail",
      hasEnv("PRIVACY_REVIEWED_AT") ? "Privacy review date is configured." : "Privacy/compliance review has not been recorded.",
      "Complete DPDP-focused review for consent, retention, access logs, and patient data handling."
    ),
    check(
      "environment",
      "Runtime environment",
      "Build",
      nodeEnv === "production" ? "pass" : "warn",
      `Current NODE_ENV is ${nodeEnv}.`,
      "Deploy with NODE_ENV=production."
    )
  ];

  const summary = checks.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      acc.total += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, total: 0 }
  );

  return {
    generatedAt: new Date().toISOString(),
    releaseGate: summary.fail === 0,
    summary,
    checks,
    recommendation: summary.fail
      ? "Do not deploy as a live HMS until failing production checks are resolved."
      : summary.warn
        ? "Deployment can proceed only after accepting documented warnings."
        : "Production readiness checks are passing."
  };
}

const readiness = createReadiness();

if (jsonOutput) {
  console.log(JSON.stringify(readiness, null, 2));
} else {
  console.log(`Production readiness: ${readiness.summary.pass}/${readiness.summary.total} passing, ${readiness.summary.warn} warning, ${readiness.summary.fail} failing.`);
  for (const item of readiness.checks) {
    const marker = item.status.toUpperCase().padEnd(4);
    console.log(`${marker} ${item.area}: ${item.label} - ${item.detail}`);
    if (item.status !== "pass") console.log(`     Action: ${item.action}`);
  }
  console.log(readiness.recommendation);
}

if (!reportOnly && !readiness.releaseGate) {
  process.exitCode = 1;
}
