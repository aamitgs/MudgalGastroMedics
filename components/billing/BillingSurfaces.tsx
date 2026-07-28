"use client";

import { AdminBillingSummary } from "@/components/billing/AdminBillingSummary";
import { BillingApprovalsQueue } from "@/components/billing/BillingApprovalsQueue";
import { CashClosingPanel } from "@/components/billing/CashClosingPanel";
import { FinancialAnalyticsPanel } from "@/components/billing/FinancialAnalyticsPanel";
import { PriceMasterPanel } from "@/components/billing/PriceMasterPanel";
import { BillingCollectionDesk } from "@/components/billing/BillingCollectionDesk";
import { BillingWorkspace } from "@/components/billing/BillingWorkspace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The three billing surfaces, tabbed rather than stacked (Track 5.4).
 *
 * They answer genuinely different questions and are used by different people
 * at different moments, so they stay separate rather than being merged into
 * one long scroll:
 *
 * - **Workspace** — "what does this patient owe?" Patient-first; the default,
 *   because it is the question a counter faces most.
 * - **Collection** — "which bills are unpaid?" Queue-first, for working
 *   through outstanding invoices.
 * - **Approvals** — "what needs signing off?" The Accounts/Admin queue for
 *   discounts, refunds and cancellations (Track 5.6).
 * - **Day close** — "does the drawer match the ledger?" (Track 5.10, §24).
 * - **Analytics** — where the money came from and where it is going (§25/§30).
 * - **Price list** — configuration rather than counter work, so it sits last:
 *   what the hospital charges, the consultation fee rules and the packages
 *   every other surface prices from (Tracks 5.1 / 5.7).
 * - **Revenue summary** — the original OPD-visit-level view. Retained because
 *   it still shows visits that predate the invoice entity; retiring it needs a
 *   backfill of historical visits into invoices, which is its own change-set,
 *   not a side effect of this one.
 */
export function BillingSurfaces() {
  return (
    <Tabs defaultValue="workspace" className="gap-4">
      <TabsList>
        <TabsTrigger value="workspace">Patient workspace</TabsTrigger>
        <TabsTrigger value="collection">Collection</TabsTrigger>
        <TabsTrigger value="approvals">Approvals</TabsTrigger>
        <TabsTrigger value="closing">Day close</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="pricing">Price list</TabsTrigger>
        <TabsTrigger value="summary">Revenue summary</TabsTrigger>
      </TabsList>

      <TabsContent value="workspace">
        <BillingWorkspace />
      </TabsContent>
      <TabsContent value="collection">
        <BillingCollectionDesk />
      </TabsContent>
      <TabsContent value="approvals">
        <BillingApprovalsQueue />
      </TabsContent>
      <TabsContent value="closing">
        <CashClosingPanel />
      </TabsContent>
      <TabsContent value="analytics">
        <FinancialAnalyticsPanel />
      </TabsContent>
      <TabsContent value="pricing">
        <PriceMasterPanel />
      </TabsContent>
      <TabsContent value="summary">
        <AdminBillingSummary />
      </TabsContent>
    </Tabs>
  );
}
