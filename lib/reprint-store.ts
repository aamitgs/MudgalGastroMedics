import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";

/**
 * Reprint tracking for financial documents (Track 5.8, §30).
 *
 * A second copy of a receipt is how a bill gets paid twice, or gets used to
 * claim twice. So every issuance after the first is recorded and the document
 * itself is stamped DUPLICATE — the mark has to be on the paper, because that
 * is what leaves the building.
 *
 * Held in its own store rather than on the invoice: printing is a read, and a
 * read should not bump an invoice's `updatedAt` or land in its change history.
 */

export type DocumentReprint = {
  id: string;
  at: string;
  by: string;
  role: string;
  /** Recorded from the 2nd copy onward — why another copy was needed. */
  reason?: string;
};

type ReprintStore = {
  /** Keyed by `<kind>:<entityId>`, newest first. */
  issues: Record<string, DocumentReprint[]>;
};

const docStore = createDocumentStore<ReprintStore>("document-reprints", (parsed) => {
  const doc = parsed as Partial<ReprintStore> | undefined;
  return { issues: doc?.issues && typeof doc.issues === "object" ? (doc.issues as ReprintStore["issues"]) : {} };
});

function key(kind: string, entityId: string) {
  return `${kind}:${entityId}`;
}

export async function listReprints(kind: string, entityId: string): Promise<DocumentReprint[]> {
  return (await docStore.load()).issues[key(kind, entityId)] ?? [];
}

export type IssueResult = {
  /** 1 for the original; 2+ for a duplicate. */
  copyNumber: number;
  isDuplicate: boolean;
  previous: DocumentReprint[];
};

/**
 * Records that a copy was issued and reports which copy it is.
 *
 * Returns the count *including* this issue, so copy 1 is the original and
 * anything above it is a duplicate — the caller stamps the document from this.
 */
export async function recordIssue(input: {
  kind: string;
  entityId: string;
  by: string;
  role: string;
  reason?: string;
}): Promise<IssueResult> {
  const doc = await docStore.load();
  const storeKey = key(input.kind, input.entityId);
  const previous = doc.issues[storeKey] ?? [];

  const entry: DocumentReprint = {
    id: generateId("RPT"),
    at: new Date().toISOString(),
    by: input.by,
    role: input.role,
    reason: input.reason?.trim() || undefined
  };

  doc.issues[storeKey] = [entry, ...previous];
  await docStore.save(doc);

  const copyNumber = previous.length + 1;
  return { copyNumber, isDuplicate: copyNumber > 1, previous };
}
