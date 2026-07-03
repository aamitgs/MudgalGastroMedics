const moduleLinks = [
  { id: "module-reports", label: "Reports" },
  { id: "module-access", label: "Access" },
  { id: "module-readiness", label: "Readiness" },
  { id: "module-audit", label: "Audit" },
  { id: "module-analytics", label: "Analytics" },
  { id: "module-cms", label: "CMS" },
  { id: "module-modules", label: "Modules" },
  { id: "module-automation", label: "Automation" },
  { id: "module-ai-reviews", label: "AI Reviews" },
  { id: "module-patients", label: "Patients" },
  { id: "module-appointments", label: "Appointments" },
  { id: "module-opd", label: "OPD" },
  { id: "module-procedures", label: "Procedures" },
  { id: "module-ipd", label: "IPD & Beds" },
  { id: "module-doctor-workflow", label: "Doctor Workflow" },
  { id: "module-lab", label: "Lab" },
  { id: "module-pharmacy", label: "Pharmacy" },
  { id: "module-billing", label: "Billing" },
  { id: "module-finance", label: "Finance" },
  { id: "module-hr", label: "HR" },
  { id: "module-inventory", label: "Inventory" },
  { id: "module-communication", label: "Comms" },
  { id: "module-settings", label: "Settings" }
];

/** Sticky jump-nav for the operations dashboard so 23 modules stay one keystroke away. */
export function AdminModuleNav() {
  return (
    <nav
      aria-label="Operations modules"
      className="sticky top-14 z-30 border-b border-line bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] items-center gap-1 overflow-x-auto py-2 [scrollbar-width:thin]">
        {moduleLinks.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="shrink-0 whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-soft hover:text-brand"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
