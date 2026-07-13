import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PdfFooter, PdfHeader, generatedAtLabel, operationalConfidentialityNote, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  meta: { fontSize: 8.5, color: pdfColors.muted, marginBottom: 10 },
  table: { borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4 },
  tableHeadRow: { flexDirection: "row", backgroundColor: pdfColors.soft, borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  headCell: { flex: 1, padding: 6, overflow: "hidden", fontFamily: "Geist", fontWeight: "semibold", fontSize: 8, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.4 },
  bodyCell: { flex: 1, padding: 6, overflow: "hidden", fontSize: 8.5, color: pdfColors.ink }
});

// Tabs/carriage returns have no glyph in a PDF text run — react-pdf silently
// drops them rather than rendering whitespace, which can fuse two adjacent
// words together with no visible gap. Newlines are left alone: react-pdf
// renders those correctly as real line breaks.
function sanitizeCell(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\t/g, " ");
}

// flex:1 divides a row's width by that row's own cell count, so a row with
// fewer/more cells than the header renders misaligned with every column
// above it. Every DataTableExport.row() returns headers.length entries by
// construction, but padding/truncating here is a cheap guard against any
// module's export config drifting out of sync and silently producing a
// garbled document.
function normalizeRow(row: string[], columnCount: number) {
  const cells = row.slice(0, columnCount);
  while (cells.length < columnCount) cells.push("");
  return cells;
}

/**
 * Generic "PDF of the current table view" document (Track 3.4) — one shared
 * component reused by every DataTable-consuming module instead of a
 * per-module layout, since the export config (headers/row) is already
 * flattened to strings identically to the existing CSV export path.
 * Landscape A4: tables commonly run 6-11 columns (per DataTable's export
 * survey), which portrait would crowd.
 */
export function TableDocument({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <Document title={title}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <PdfHeader docType={title} reference={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
        <Text style={styles.meta}>Generated {generatedAtLabel()}</Text>
        <View style={styles.table}>
          <View style={styles.tableHeadRow}>
            {headers.map((header, index) => (
              <Text key={index} style={styles.headCell}>
                {header}
              </Text>
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow} wrap={false}>
              {normalizeRow(row, headers.length).map((cell, cellIndex) => (
                <Text key={cellIndex} style={styles.bodyCell}>
                  {sanitizeCell(cell) || "—"}
                </Text>
              ))}
            </View>
          ))}
        </View>
        <PdfFooter confidentialityNote={operationalConfidentialityNote} />
      </Page>
    </Document>
  );
}
