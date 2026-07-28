import "server-only";
import { outstandingPaise } from "@/lib/billing-calc";
import { listPatientInvoices } from "@/lib/billing-store";
import type { Invoice } from "@/lib/billing-types";
import { listFamilyMembers } from "@/lib/family-store";
import { applyAdvanceToInvoice, getWallet } from "@/lib/wallet-store";

/**
 * Family billing (Track 5.11, §20).
 *
 * Deliberately a **family statement**, not a combined invoice. An invoice is a
 * document naming one patient — it is what gets submitted to an insurer, filed
 * against a UHID and produced if a bill is ever disputed. Merging two patients
 * onto one is convenient at the counter and wrong everywhere afterwards. So a
 * family gets one *view* of what it collectively owes, and pays through the
 * individual bills that view links to.
 *
 * The shared wallet works the other way round and is genuinely useful: one
 * member's advance settling another's bill is exactly what families expect,
 * and it is safe because a wallet holds money rather than clinical facts.
 */

export type FamilyMemberBalance = {
  name: string;
  phone: string;
  relation?: string;
  /** Whether this is the account holder the family is grouped under. */
  isAccountHolder: boolean;
  outstandingPaise: number;
  walletBalancePaise: number;
  invoices: Invoice[];
};

export type FamilyStatement = {
  ownerPhone: string;
  members: FamilyMemberBalance[];
  totalOutstandingPaise: number;
  totalWalletPaise: number;
};

/** Everything the family collectively owes and holds, per member. */
export async function familyStatement(ownerPhone: string, ownerName: string): Promise<FamilyStatement> {
  const relatives = await listFamilyMembers(ownerPhone);

  // A relative without their own phone has no patient record to bill against,
  // so they cannot appear on a financial statement — recorded, but not owing.
  const contacts = [
    { name: ownerName, phone: ownerPhone, relation: undefined as string | undefined, isAccountHolder: true },
    ...relatives
      .filter((member) => member.phone?.trim())
      .map((member) => ({ name: member.name, phone: member.phone as string, relation: member.relation, isAccountHolder: false }))
  ];

  const members = await Promise.all(
    contacts.map(async (contact): Promise<FamilyMemberBalance> => {
      const [invoices, wallet] = await Promise.all([listPatientInvoices(contact.phone), getWallet(contact.phone)]);
      return {
        ...contact,
        outstandingPaise: outstandingPaise(invoices),
        walletBalancePaise: wallet?.balancePaise ?? 0,
        invoices: invoices.filter((invoice) => invoice.status !== "Cancelled" && invoice.status !== "Draft" && invoice.balancePaise > 0)
      };
    })
  );

  return {
    ownerPhone,
    members,
    totalOutstandingPaise: members.reduce((sum, member) => sum + member.outstandingPaise, 0),
    totalWalletPaise: members.reduce((sum, member) => sum + member.walletBalancePaise, 0)
  };
}

/**
 * Settles one family member's bill from another member's advance (§20 shared
 * wallet).
 *
 * The two must be in the same family, checked server-side — otherwise this
 * would be a way to spend any patient's advance on any other patient's bill.
 */
export async function payFromFamilyWallet(input: {
  ownerPhone: string;
  ownerName: string;
  /** Whose wallet the money comes from. */
  fromPhone: string;
  /** The bill being settled, which must belong to a member of the same family. */
  invoiceId: string;
  amountPaise?: number;
  actingStaffName: string;
}) {
  const statement = await familyStatement(input.ownerPhone, input.ownerName);
  const payer = statement.members.find((member) => member.phone.replace(/\D/g, "") === input.fromPhone.replace(/\D/g, ""));
  if (!payer) return { error: "That wallet doesn't belong to this family." };

  const target = statement.members.find((member) => member.invoices.some((invoice) => invoice.id === input.invoiceId));
  if (!target) return { error: "That bill doesn't belong to this family, or is already settled." };

  const applied = await applyAdvanceToInvoice({
    invoiceId: input.invoiceId,
    amountPaise: input.amountPaise,
    // The whole point: the money leaves the payer's wallet, not the patient's.
    fromPhone: payer.phone,
    actingStaffName: input.actingStaffName
  });
  if ("error" in applied) return applied;

  return { ...applied, paidFor: target.name, paidBy: payer.name };
}
