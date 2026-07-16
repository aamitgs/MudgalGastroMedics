import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge, getStatusToneClass } from "@/components/design-system/StatusBadge";

describe("getStatusToneClass", () => {
  it("resolves a distinct class set for each of the 5 semantic tones", () => {
    const tones = ["success", "warning", "critical", "info", "inactive"] as const;
    const classes = tones.map((tone) => getStatusToneClass(tone));
    expect(new Set(classes).size).toBe(tones.length);
  });
});

describe("StatusBadge", () => {
  it("renders its label with the tone's class applied", () => {
    render(<StatusBadge tone="success">Active</StatusBadge>);
    const badge = screen.getByText("Active");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("emerald");
  });

  it("merges caller-provided shape classes alongside the tone classes", () => {
    render(
      <StatusBadge tone="critical" className="rounded-full px-2.5 py-1 uppercase">
        Flagged
      </StatusBadge>
    );
    const badge = screen.getByText("Flagged");
    expect(badge.className).toContain("rounded-full");
    expect(badge.className).toContain("red");
  });
});
