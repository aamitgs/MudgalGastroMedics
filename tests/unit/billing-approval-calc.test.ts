import { describe, expect, it } from "vitest";
import {
  approvalProgressLabel,
  canDecide,
  deriveApprovalStatus,
  discountFromPercent,
  isFullyApproved,
  isRejected,
  pendingStage,
  requiredStagesFor
} from "@/lib/billing-approval-calc";
import type { ApprovalDecision, BillingApproval } from "@/lib/billing-approval-types";

function decision(overrides: Partial<ApprovalDecision> = {}): ApprovalDecision {
  return { stage: "Accounts", decision: "Approved", by: "Accounts User", role: "billing-accounts", at: "2026-07-27T10:00:00.000Z", ...overrides };
}

function approval(overrides: Partial<BillingApproval> = {}): BillingApproval {
  return {
    id: "APR-1",
    createdAt: "2026-07-27T09:00:00.000Z",
    updatedAt: "2026-07-27T09:00:00.000Z",
    kind: "Discount",
    status: "Pending",
    invoiceId: "INV-1",
    invoiceNo: "MGM-INV-20260727-001",
    patientName: "Asha Verma",
    phone: "9876543210",
    amountPaise: 50_000,
    reason: "Senior citizen concession",
    requestedBy: "Billing Exec",
    requestedByRole: "billing-accounts",
    requestedAt: "2026-07-27T09:00:00.000Z",
    requiredStages: ["Accounts"],
    decisions: [],
    ...overrides
  };
}

describe("requiredStagesFor", () => {
  it("routes a routine concession through Accounts alone", () => {
    expect(requiredStagesFor("Discount", 50_000, 5_00_000)).toEqual(["Accounts"]);
  });

  it("adds Admin above the absolute threshold", () => {
    expect(requiredStagesFor("Discount", 3_00_000, 50_00_000)).toEqual(["Accounts", "Admin"]);
  });

  // A 90% write-off is a governance question even when the rupees are few.
  it("adds Admin when a discount is a large share of a small bill", () => {
    expect(requiredStagesFor("Discount", 90_000, 1_00_000)).toEqual(["Accounts", "Admin"]);
  });

  it("does not apply the share rule to refunds — a full refund of a small bill is routine", () => {
    expect(requiredStagesFor("Refund", 90_000, 1_00_000)).toEqual(["Accounts"]);
  });

  it("always needs both signatures to void a whole bill, however small", () => {
    expect(requiredStagesFor("Cancellation", 10_000, 10_000)).toEqual(["Accounts", "Admin"]);
  });
});

describe("pendingStage", () => {
  it("waits on Accounts first", () => {
    expect(pendingStage(approval({ requiredStages: ["Accounts", "Admin"] }))).toBe("Accounts");
  });

  it("moves to Admin once Accounts signs", () => {
    const withAccounts = approval({ requiredStages: ["Accounts", "Admin"], decisions: [decision()] });
    expect(pendingStage(withAccounts)).toBe("Admin");
  });

  it("is null once every required stage has signed", () => {
    const complete = approval({
      requiredStages: ["Accounts", "Admin"],
      decisions: [decision(), decision({ stage: "Admin", by: "Admin User", role: "admin" })]
    });
    expect(pendingStage(complete)).toBeNull();
    expect(isFullyApproved(complete)).toBe(true);
  });
});

describe("rejection", () => {
  const rejected = approval({ requiredStages: ["Accounts", "Admin"], decisions: [decision({ decision: "Rejected" })] });

  it("one refusal ends the request", () => {
    expect(isRejected(rejected)).toBe(true);
    expect(deriveApprovalStatus(rejected)).toBe("Rejected");
  });

  it("a rejected request is never considered fully approved, even if later stages sign", () => {
    const contradictory = approval({
      requiredStages: ["Accounts", "Admin"],
      decisions: [decision({ decision: "Rejected" }), decision({ stage: "Admin", role: "admin" })]
    });
    expect(isFullyApproved(contradictory)).toBe(false);
    expect(deriveApprovalStatus(contradictory)).toBe("Rejected");
  });
});

describe("canDecide", () => {
  const twoStage = approval({ requiredStages: ["Accounts", "Admin"] });

  it("lets the awaited stage sign", () => {
    expect(canDecide(twoStage, { name: "Accounts User", stages: ["Accounts"] })).toEqual({ ok: true, stage: "Accounts" });
  });

  it("stops a later stage pre-approving past an earlier one", () => {
    const result = canDecide(twoStage, { name: "Admin User", stages: ["Admin"] });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/waiting on Accounts/);
  });

  it("lets an Admin cover the Accounts stage when Accounts is unavailable", () => {
    expect(canDecide(twoStage, { name: "Admin User", stages: ["Accounts", "Admin"] })).toEqual({ ok: true, stage: "Accounts" });
  });

  // Without this, one admin — who holds both stages' authority — could sign
  // Accounts and then Admin, and a two-signature chain would mean nothing.
  it("never lets one person provide both signatures", () => {
    const halfSigned = approval({
      requiredStages: ["Accounts", "Admin"],
      decisions: [decision({ by: "Admin User", role: "admin" })]
    });
    const result = canDecide(halfSigned, { name: "Admin User", stages: ["Accounts", "Admin"] });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/second signature must come from someone else/);
  });

  it("still lets a different approver provide the second signature", () => {
    const halfSigned = approval({
      requiredStages: ["Accounts", "Admin"],
      decisions: [decision({ by: "Accounts User" })]
    });
    expect(canDecide(halfSigned, { name: "Admin User", stages: ["Accounts", "Admin"] })).toEqual({ ok: true, stage: "Admin" });
  });

  // The rule a permission check alone cannot enforce: an admin holds every
  // permission involved, so only the requester identity stops self-approval.
  it("never lets the requester approve their own request", () => {
    const own = approval({ requestedBy: "Admin User", requiredStages: ["Accounts"] });
    const result = canDecide(own, { name: "Admin User", stages: ["Accounts", "Admin"] });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/can't also approve it/);
  });

  it("refuses to re-decide a settled request", () => {
    const settled = approval({ status: "Approved" });
    expect(canDecide(settled, { name: "Someone", stages: ["Accounts", "Admin"] }).ok).toBe(false);
  });

  it("refuses an actor holding no signing stage at all", () => {
    expect(canDecide(twoStage, { name: "Reception", stages: [] }).ok).toBe(false);
  });
});

describe("discountFromPercent", () => {
  it("computes a percentage of the bill", () => {
    expect(discountFromPercent(10, 5_00_000)).toBe(50_000);
  });

  it("never exceeds the bill, even at 100%+", () => {
    expect(discountFromPercent(150, 5_00_000)).toBe(5_00_000);
  });

  it("is zero for a nonsensical percentage rather than negative", () => {
    expect(discountFromPercent(-5, 5_00_000)).toBe(0);
    expect(discountFromPercent(Number.NaN, 5_00_000)).toBe(0);
  });

  it("rounds to the paisa", () => {
    expect(discountFromPercent(33.33, 1_00_000)).toBe(33_330);
  });
});

describe("approvalProgressLabel", () => {
  it("says who is being waited on and how far along it is", () => {
    expect(approvalProgressLabel(approval({ requiredStages: ["Accounts", "Admin"] }))).toBe("Awaiting Accounts (0/2 signed)");
    expect(approvalProgressLabel(approval({ requiredStages: ["Accounts", "Admin"], decisions: [decision()] }))).toBe("Awaiting Admin (1/2 signed)");
  });

  it("reports a completed or refused chain plainly", () => {
    expect(approvalProgressLabel(approval({ requiredStages: ["Accounts"], decisions: [decision()] }))).toBe("Fully approved");
    expect(approvalProgressLabel(approval({ decisions: [decision({ decision: "Rejected" })] }))).toBe("Rejected by Accounts");
  });
});
