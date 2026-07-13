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
              {row.map((cell, cellIndex) => (
                <Text key={cellIndex} style={styles.bodyCell}>
                  {cell || "—"}
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
