import { notify } from "@/lib/notify";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Plain CSV rather than a real .xlsx — Excel opens CSV natively, and a
// genuine OOXML writer (or a new dependency) wasn't warranted for this pass.
export function downloadCsv(headers: string[], rows: string[][], filename: string) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

/**
 * Server-rendered PDF of the same headers/rows CSV export already uses
 * (Track 3.4) — a real round trip (unlike CSV, which never leaves the
 * browser), so failures get the same offline-retry treatment as any other
 * mutation call site rather than a silent no-op.
 */
export async function downloadPdfExport(title: string, headers: string[], rows: string[][], filename: string) {
  const toastId = notify.loading("Preparing PDF…");
  let response: Response;
  try {
    response = await fetch("/api/pdf/table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, headers, rows })
    });
  } catch {
    notify.retryable(
      "Unable to reach the server. Check your connection and retry.",
      () => void downloadPdfExport(title, headers, rows, filename),
      { id: toastId }
    );
    return;
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    notify.error(data.error || "Unable to generate PDF.", { id: toastId });
    return;
  }
  triggerDownload(await response.blob(), filename);
  notify.success("PDF ready", { id: toastId });
}

/**
 * Email the same PDF to the requesting staff member's own account address
 * (Track 3.4) — self-send only; the server ignores any recipient the client
 * might send and always resolves it from the authenticated session.
 */
export async function emailPdfExport(title: string, headers: string[], rows: string[][]) {
  const toastId = notify.loading("Sending…");
  let response: Response;
  try {
    response = await fetch("/api/pdf/table/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, headers, rows })
    });
  } catch {
    notify.retryable(
      "Unable to reach the server. Check your connection and retry.",
      () => void emailPdfExport(title, headers, rows),
      { id: toastId }
    );
    return;
  }
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; sentTo?: string };
  if (!response.ok || !data.ok) {
    notify.error(data.error || "Unable to send email.", { id: toastId });
    return;
  }
  notify.success(`Sent to ${data.sentTo}`, { id: toastId });
}
