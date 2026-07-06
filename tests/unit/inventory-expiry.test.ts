import { describe, expect, it } from "vitest";
import { inventoryExpirySoonDays, inventoryExpiryStatus } from "@/lib/inventory-types";

const now = new Date("2026-07-06T10:00:00");

function daysFromNow(days: number) {
  const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

describe("inventoryExpiryStatus", () => {
  it("never flags items without an expiry date", () => {
    expect(inventoryExpiryStatus({}, now)).toBeNull();
    expect(inventoryExpiryStatus({ expiryDate: undefined }, now)).toBeNull();
  });

  it("flags stock past its expiry date as expired", () => {
    expect(inventoryExpiryStatus({ expiryDate: daysFromNow(-1) }, now)).toBe("expired");
    expect(inventoryExpiryStatus({ expiryDate: "2020-01-01" }, now)).toBe("expired");
  });

  it("treats the whole expiry day as still usable", () => {
    expect(inventoryExpiryStatus({ expiryDate: daysFromNow(0) }, now)).toBe("expiring-soon");
  });

  it("flags stock inside the alert window as expiring-soon", () => {
    expect(inventoryExpiryStatus({ expiryDate: daysFromNow(1) }, now)).toBe("expiring-soon");
    expect(inventoryExpiryStatus({ expiryDate: daysFromNow(inventoryExpirySoonDays) }, now)).toBe("expiring-soon");
  });

  it("does not flag stock beyond the alert window", () => {
    expect(inventoryExpiryStatus({ expiryDate: daysFromNow(inventoryExpirySoonDays + 2) }, now)).toBeNull();
  });

  it("ignores malformed dates rather than flagging them", () => {
    expect(inventoryExpiryStatus({ expiryDate: "not-a-date" }, now)).toBeNull();
  });
});
