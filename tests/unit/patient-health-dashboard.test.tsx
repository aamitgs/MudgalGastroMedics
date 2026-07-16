import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatientHealthDashboard, type PatientVisitSummary, type PatientLabOrderSummary } from "@/components/patient-portal/PatientHealthDashboard";

const now = new Date();

function daysAgoIso(days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function visit(overrides: Partial<PatientVisitSummary> = {}): PatientVisitSummary {
  return {
    id: "OPD-1",
    token: "T-1",
    patientId: "PAT-1",
    createdAt: now.toISOString(),
    status: "Completed",
    patientName: "Test Patient",
    service: "GI consult",
    symptoms: [],
    billingStatus: "Paid",
    ...overrides
  };
}

function labOrder(overrides: Partial<PatientLabOrderSummary> = {}): PatientLabOrderSummary {
  return {
    id: "LAB-1",
    createdAt: now.toISOString(),
    service: "LFT panel",
    tests: ["LFT"],
    status: "Processing",
    ...overrides
  };
}

const noop = vi.fn(async () => {});

function renderDashboard(props: Partial<Parameters<typeof PatientHealthDashboard>[0]> = {}) {
  render(
    <PatientHealthDashboard
      phone="9990001122"
      appointments={[]}
      visits={[]}
      ipdAdmissions={[]}
      vitals={[]}
      insuranceClaims={[]}
      labOrders={[]}
      familyMembers={[]}
      onAddFamilyMember={noop}
      onRemoveFamilyMember={noop}
      onPrintVisit={() => {}}
      {...props}
    />
  );
}

describe("PatientHealthDashboard reminders", () => {
  it("shows an overdue follow-up reminder when the patient has not returned", () => {
    renderDashboard({
      visits: [visit({ id: "OPD-1", followUpDate: daysAgoIso(10) })]
    });
    expect(screen.getByText(/was due on/i)).toBeInTheDocument();
  });

  it("shows a due-soon follow-up reminder within the lookahead window", () => {
    const dueSoon = new Date(now);
    dueSoon.setDate(dueSoon.getDate() + 3);
    renderDashboard({
      visits: [visit({ id: "OPD-1", followUpDate: dueSoon.toISOString().slice(0, 10) })]
    });
    expect(screen.getByText(/Follow-up visit due on/i)).toBeInTheDocument();
  });

  it("never shows a reminder once the patient has already returned (fulfilled recall)", () => {
    const original = visit({ id: "OPD-1", patientId: "PAT-1", followUpDate: daysAgoIso(10) });
    const returnVisit = visit({ id: "OPD-2", patientId: "PAT-1", createdAt: daysAgoIso(2) });
    renderDashboard({ visits: [original, returnVisit] });
    expect(screen.queryByText(/was due on/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Follow-up visit due on/i)).not.toBeInTheDocument();
  });

  it("never shows a reminder for a follow-up that isn't due for months", () => {
    const farOut = new Date(now);
    farOut.setDate(farOut.getDate() + 90);
    renderDashboard({
      visits: [visit({ id: "OPD-1", followUpDate: farOut.toISOString().slice(0, 10) })]
    });
    expect(screen.queryByText(/due on/i)).not.toBeInTheDocument();
  });

  it("shows a report-ready reminder for a Result Ready lab order", () => {
    renderDashboard({ labOrders: [labOrder({ status: "Result Ready", tests: ["LFT", "KFT"] })] });
    expect(screen.getByText(/LFT, KFT report is ready/i)).toBeInTheDocument();
  });

  it("does not show a report-ready reminder for a lab order still in progress", () => {
    renderDashboard({ labOrders: [labOrder({ status: "Processing" })] });
    expect(screen.queryByText(/report is ready/i)).not.toBeInTheDocument();
  });
});
