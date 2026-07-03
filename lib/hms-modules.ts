import type { HmsModule } from "@/lib/hms-types";

export const hmsModules: HmsModule[] = [
  {
    id: "project-setup",
    order: 1,
    name: "Project Setup",
    group: "Core",
    status: "Live MVP",
    summary: "Next.js app, routing, environment, local data storage and build pipeline.",
    capabilities: ["Next.js 16 app", "Local JSON stores", "Static + dynamic routes"],
    nextStep: "Move operational data to PostgreSQL before production."
  },
  {
    id: "auth-rbac",
    order: 2,
    name: "Authentication & RBAC",
    group: "Core",
    status: "Foundation",
    summary: "Admin login now supports named staff credentials, signed sessions and role-derived permissions; doctor passcode remains a local MVP.",
    capabilities: ["Named staff login", "Signed admin sessions", "Doctor session cookie", "Staff permissions", "CMS publish RBAC"],
    nextStep: "Replace passcodes with per-user passwords or OTP, password reset and session revocation."
  },
  {
    id: "design-system",
    order: 3,
    name: "Design System",
    group: "Core",
    status: "Foundation",
    summary: "Premium visual language, reusable sections and consistent buttons/cards.",
    capabilities: ["Clinical color palette", "Responsive sections", "Premium button styling"],
    nextStep: "Extract formal component tokens and Storybook-style documentation."
  },
  {
    id: "public-website",
    order: 4,
    name: "Public Website",
    group: "Digital",
    status: "Live MVP",
    summary: "Patient-facing website remains the public frontend; published CMS records can override procedure, gallery, SEO and mobile catalog content with RBAC, preview and revision history.",
    capabilities: ["Public pages", "Appointment capture", "CMS publish overrides", "CMS revision history", "CMS publish permissions"],
    nextStep: "Add content diff review, scheduled publishing and media approval workflow."
  },
  {
    id: "master-data",
    order: 5,
    name: "Master Data",
    group: "Core",
    status: "Foundation",
    summary: "Central registry for departments, services, staff, rooms, beds and tariffs.",
    capabilities: ["Module records", "Service/procedure data", "Inventory categories"],
    nextStep: "Add dedicated master tables and import/export."
  },
  {
    id: "patients",
    order: 6,
    name: "Patients",
    group: "Clinical",
    status: "Foundation",
    summary: "Patient details are captured through appointments and OPD visits.",
    capabilities: ["Patient lookup", "Phone based portal access", "Visit summaries"],
    nextStep: "Create permanent UHID and patient profile records."
  },
  {
    id: "doctors",
    order: 7,
    name: "Doctors",
    group: "Clinical",
    status: "Foundation",
    summary: "Doctor profile pages and admin consultation workflow are available.",
    capabilities: ["Doctor profile", "Clinical notes", "Advice and follow-up"],
    nextStep: "Add doctor login, schedules and signature templates."
  },
  {
    id: "appointments",
    order: 8,
    name: "Appointments",
    group: "Clinical",
    status: "Live MVP",
    summary: "Website appointment requests flow into the admin dashboard.",
    capabilities: ["Public appointment form", "Admin status updates", "AI planning note"],
    nextStep: "Add slot calendar, reminders and conflict detection."
  },
  {
    id: "opd",
    order: 9,
    name: "OPD",
    group: "Clinical",
    status: "Live MVP",
    summary: "Reception can create OPD tokens and track consultation status.",
    capabilities: ["OPD queue", "Token creation", "Visit status"],
    nextStep: "Add department queues and vitals capture."
  },
  {
    id: "prescriptions",
    order: 10,
    name: "Prescriptions",
    group: "Clinical",
    status: "Foundation",
    summary: "Doctor workflow supports prescription text and patient print summaries.",
    capabilities: ["Prescription notes", "Patient-visible summary", "Printable visit record"],
    nextStep: "Add structured medicines, dose, duration and digital signature."
  },
  {
    id: "pharmacy",
    order: 11,
    name: "Pharmacy",
    group: "Operations",
    status: "Foundation",
    summary: "Inventory foundation supports medicines and consumables.",
    capabilities: ["Medicine stock", "Low-stock alerts", "Vendor field"],
    nextStep: "Add dispensing, batches, expiry and GST billing."
  },
  {
    id: "laboratory",
    order: 12,
    name: "Laboratory",
    group: "Clinical",
    status: "Planned",
    summary: "Lab module shell for test orders, samples and results.",
    capabilities: ["Lab order tracking", "Sample status", "Result notes"],
    nextStep: "Build lab order entry and report upload."
  },
  {
    id: "procedures",
    order: 13,
    name: "Procedures",
    group: "Clinical",
    status: "Foundation",
    summary: "Public procedure pages exist; operational procedure scheduling is next.",
    capabilities: ["Procedure pages", "Preparation content", "Service selection"],
    nextStep: "Add OT/endoscopy room scheduling, consent and checklist."
  },
  {
    id: "ipd",
    order: 14,
    name: "IPD",
    group: "Clinical",
    status: "Planned",
    summary: "IPD shell for admissions, rounds, nursing notes and discharge.",
    capabilities: ["Admission record", "Care plan", "Discharge planning"],
    nextStep: "Add admission workflow and discharge summary."
  },
  {
    id: "bed-management",
    order: 15,
    name: "Bed Management",
    group: "Operations",
    status: "Planned",
    summary: "Bed module shell for occupancy, transfers and housekeeping.",
    capabilities: ["Bed status", "Ward tracking", "Transfer notes"],
    nextStep: "Add live bed board and occupancy reports."
  },
  {
    id: "billing",
    order: 16,
    name: "Billing",
    group: "Finance",
    status: "Foundation",
    summary: "OPD billing status, payment method and receipt IDs are available.",
    capabilities: ["OPD estimate", "Paid status", "Receipt ID"],
    nextStep: "Add invoices, line items, taxes, refunds and payment reconciliation."
  },
  {
    id: "insurance",
    order: 17,
    name: "Insurance",
    group: "Finance",
    status: "Planned",
    summary: "Insurance shell for TPA, pre-auth, claim and settlement tracking.",
    capabilities: ["TPA record", "Claim stage", "Approval notes"],
    nextStep: "Add insurer masters and claim documents."
  },
  {
    id: "accounts",
    order: 18,
    name: "Accounts",
    group: "Finance",
    status: "Planned",
    summary: "Accounts shell for expenses, deposits, collections and ledgers.",
    capabilities: ["Daily cash", "Expense notes", "Ledger records"],
    nextStep: "Add chart of accounts and accounting exports."
  },
  {
    id: "hr",
    order: 19,
    name: "HR",
    group: "People",
    status: "Planned",
    summary: "HR shell for staff directory, attendance and leave.",
    capabilities: ["Staff records", "Leave notes", "Shift ownership"],
    nextStep: "Add attendance, payroll inputs and role permissions."
  },
  {
    id: "inventory",
    order: 20,
    name: "Inventory",
    group: "Operations",
    status: "Live MVP",
    summary: "Stock control module exists with low-stock reporting.",
    capabilities: ["Stock item CRUD", "Quantity adjustment", "Low stock reports"],
    nextStep: "Add purchase orders, GRN, expiry and vendor invoices."
  },
  {
    id: "reports",
    order: 21,
    name: "Reports",
    group: "Digital",
    status: "Foundation",
    summary: "Admin reporting summarizes appointments, OPD, billing and inventory.",
    capabilities: ["Daily KPI", "Revenue split", "Low-stock alerts"],
    nextStep: "Add date filters, export and management dashboards."
  },
  {
    id: "communication",
    order: 22,
    name: "Communication",
    group: "Digital",
    status: "Live MVP",
    summary: "Reception can prepare patient messages, open WhatsApp handoffs and track follow-up status.",
    capabilities: ["Message templates", "WhatsApp handoff", "Call buttons", "Delivery log"],
    nextStep: "Connect an approved SMS/WhatsApp provider for automated delivery."
  },
  {
    id: "patient-portal",
    order: 23,
    name: "Patient Portal",
    group: "Digital",
    status: "Live MVP",
    summary: "Patients can check requests and print visit summaries by phone lookup.",
    capabilities: ["Appointment lookup", "Visit summary", "Print summary"],
    nextStep: "Add OTP login, report downloads and online payments."
  },
  {
    id: "doctor-portal",
    order: 24,
    name: "Doctor Portal",
    group: "Clinical",
    status: "Live MVP",
    summary: "Doctor portal has separate clinical access for OPD queue, patient context and consultation updates.",
    capabilities: ["Doctor login", "Doctor queue", "Clinical workspace", "Prescription notes", "Follow-up list"],
    nextStep: "Add doctor schedules, signatures and department-specific permissions."
  },
  {
    id: "mobile-apis",
    order: 25,
    name: "Mobile APIs",
    group: "Digital",
    status: "Live MVP",
    summary: "Versioned, token-gated mobile endpoints are available for hospital profile, procedures and patient summaries.",
    capabilities: ["Bearer token auth", "Versioned v1 routes", "Patient summary API", "Procedure catalog API", "OpenAPI schema"],
    nextStep: "Add refresh tokens, rate limits, staff mobile endpoints and production API gateway rules."
  },
  {
    id: "ai",
    order: 26,
    name: "AI",
    group: "Digital",
    status: "Live MVP",
    summary: "AI planning reviews are stored, linked to appointments/OPD records and routed for human review.",
    capabilities: ["Priority hints", "Preparation checklist", "Reception script", "Review queue", "Safety note"],
    nextStep: "Connect a clinical-approved AI provider and add audit/version tracking for generated outputs."
  },
  {
    id: "analytics",
    order: 27,
    name: "Analytics",
    group: "Digital",
    status: "Live MVP",
    summary: "Operational analytics now derive conversion, trends, revenue, workload and risk metrics from live HMS stores.",
    capabilities: ["14-day trend", "Conversion rates", "Revenue analytics", "Service mix", "Risk watchlist"],
    nextStep: "Add date filters, exports, department benchmarking and wait-time analytics."
  },
  {
    id: "automation",
    order: 28,
    name: "Automation",
    group: "Digital",
    status: "Live MVP",
    summary: "Automation task queue generates reminders and operational worklists from HMS events.",
    capabilities: ["Generated task queue", "Follow-up reminders", "Payment reminders", "Low-stock tasks", "AI review tasks"],
    nextStep: "Add scheduled workers, outbound message queues and staff notifications."
  },
  {
    id: "testing",
    order: 29,
    name: "Testing",
    group: "Production",
    status: "Live MVP",
    summary: "Lint, production build and smoke regression tests are available for core HMS route and dashboard coverage.",
    capabilities: ["ESLint", "Smoke tests", "Route coverage checks", "Portal access checks", "Next production build"],
    nextStep: "Add unit tests for stores, API integration tests and Playwright browser workflows."
  },
  {
    id: "production",
    order: 30,
    name: "Production",
    group: "Production",
    status: "Production Pending",
    summary: "Production readiness checks now flag release blockers for security, data storage, backups, monitoring and compliance.",
    capabilities: ["Buildable app", "Health endpoint", "Readiness API", "Admin readiness panel", "Release gate"],
    nextStep: "Resolve failing checks: production secrets, managed database, backups, monitoring and privacy/compliance review."
  }
];

export function getHmsModule(moduleId: string) {
  return hmsModules.find((module) => module.id === moduleId);
}
