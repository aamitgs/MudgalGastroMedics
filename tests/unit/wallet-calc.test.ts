import { describe, expect, it } from "vitest";
import { applicableAdvancePaise, deriveWalletBalancePaise, summariseWallet, transactionDeltaPaise } from "@/lib/wallet-calc";
import type { WalletTransaction } from "@/lib/wallet-types";

function entry(overrides: Partial<WalletTransaction> = {}): WalletTransaction {
  return {
    id: "WLT-1",
    createdAt: "2026-07-27T09:00:00.000Z",
    type: "Deposit",
    amountPaise: 5_00_000,
    recordedBy: "Reception",
    balanceAfterPaise: 5_00_000,
    ...overrides
  };
}

describe("transactionDeltaPaise", () => {
  it("adds a deposit and subtracts adjustments and refunds", () => {
    expect(transactionDeltaPaise({ type: "Deposit", amountPaise: 5_00_000 })).toBe(5_00_000);
    expect(transactionDeltaPaise({ type: "Adjustment", amountPaise: 1_00_000 })).toBe(-1_00_000);
    expect(transactionDeltaPaise({ type: "Refund", amountPaise: 2_00_000 })).toBe(-2_00_000);
  });

  it("treats a negative amount as zero rather than flipping the direction of an entry", () => {
    expect(transactionDeltaPaise({ type: "Adjustment", amountPaise: -5_00_000 })).toBe(-0);
  });
});

describe("deriveWalletBalancePaise", () => {
  it("re-derives the balance from the ledger", () => {
    const ledger = [
      entry({ id: "A", type: "Deposit", amountPaise: 5_00_000 }),
      entry({ id: "B", type: "Adjustment", amountPaise: 1_30_000 }),
      entry({ id: "C", type: "Refund", amountPaise: 70_000 })
    ];
    expect(deriveWalletBalancePaise(ledger)).toBe(3_00_000);
  });

  it("is zero for a wallet with no entries", () => {
    expect(deriveWalletBalancePaise([])).toBe(0);
  });

  // The stored balance is a cache; this is the check that it hasn't drifted.
  it("agrees with the running balance stamped on the last entry", () => {
    const ledger = [
      entry({ id: "A", type: "Deposit", amountPaise: 5_00_000, balanceAfterPaise: 5_00_000 }),
      entry({ id: "B", type: "Adjustment", amountPaise: 2_00_000, balanceAfterPaise: 3_00_000 })
    ];
    expect(deriveWalletBalancePaise(ledger)).toBe(3_00_000);
  });
});

describe("applicableAdvancePaise", () => {
  it("uses the whole advance when the bill is larger", () => {
    expect(applicableAdvancePaise(2_00_000, 5_00_000)).toBe(2_00_000);
  });

  // Over-applying would turn an advance into an overpayment on one invoice
  // while the patient's other bills stayed unpaid.
  it("caps at what the bill still owes when the advance is larger", () => {
    expect(applicableAdvancePaise(5_00_000, 2_00_000)).toBe(2_00_000);
  });

  it("is zero when either side is exhausted", () => {
    expect(applicableAdvancePaise(0, 5_00_000)).toBe(0);
    expect(applicableAdvancePaise(5_00_000, 0)).toBe(0);
  });

  it("never returns a negative amount from a settled or over-collected bill", () => {
    expect(applicableAdvancePaise(5_00_000, -10_000)).toBe(0);
  });
});

describe("summariseWallet", () => {
  const ledger = [
    entry({ id: "A", type: "Deposit", amountPaise: 5_00_000 }),
    entry({ id: "B", type: "Deposit", amountPaise: 2_00_000 }),
    entry({ id: "C", type: "Adjustment", amountPaise: 3_00_000 }),
    entry({ id: "D", type: "Refund", amountPaise: 1_00_000 })
  ];

  it("totals each movement separately so a statement reconciles", () => {
    const summary = summariseWallet(ledger);
    expect(summary.depositedPaise).toBe(7_00_000);
    expect(summary.adjustedPaise).toBe(3_00_000);
    expect(summary.refundedPaise).toBe(1_00_000);
    expect(summary.balancePaise).toBe(3_00_000);
    expect(summary.transactionCount).toBe(4);
  });

  it("balance equals deposits less what left the wallet", () => {
    const summary = summariseWallet(ledger);
    expect(summary.balancePaise).toBe(summary.depositedPaise - summary.adjustedPaise - summary.refundedPaise);
  });

  it("handles an empty wallet", () => {
    expect(summariseWallet([])).toEqual({
      balancePaise: 0,
      depositedPaise: 0,
      adjustedPaise: 0,
      refundedPaise: 0,
      transactionCount: 0
    });
  });
});
