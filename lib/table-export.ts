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
