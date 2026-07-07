import { describe, expect, it } from "vitest";
import { adminModules, canViewAdminModule, visibleAdminModules } from "@/lib/access/admin-modules";

describe("admin module visibility (Track 2.2)", () => {
  it("registers each module once", () => {
    const ids = adminModules.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("super-admin sees every module", () => {
    expect(visibleAdminModules("super-admin")).toHaveLength(adminModules.length);
  });

  it("reception sees front-desk modules but not lab, HR or settings", () => {
    const visible = visibleAdminModules("reception").map((module) => module.id);
    expect(visible).toEqual(expect.arrayContaining(["module-patients", "module-appointments", "module-opd", "module-billing", "module-ipd"]));
    for (const hidden of ["module-lab", "module-hr", "module-settings", "module-audit", "module-access", "module-pharmacy"]) {
      expect(visible).not.toContain(hidden);
    }
  });

  it("lab technician sees the lab queue and patient context, not billing or CMS", () => {
    const visible = visibleAdminModules("lab-technician").map((module) => module.id);
    expect(visible).toEqual(expect.arrayContaining(["module-lab", "module-patients"]));
    for (const hidden of ["module-billing", "module-cms", "module-hr", "module-settings"]) {
      expect(visible).not.toContain(hidden);
    }
  });

  it("pharmacist sees pharmacy and inventory", () => {
    const visible = visibleAdminModules("pharmacist").map((module) => module.id);
    expect(visible).toEqual(expect.arrayContaining(["module-pharmacy", "module-inventory"]));
    expect(visible).not.toContain("module-patients");
  });

  it("unknown module ids are never visible", () => {
    expect(canViewAdminModule("admin", "module-nonexistent")).toBe(false);
  });
});
