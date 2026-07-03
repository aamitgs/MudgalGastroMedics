import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OpdVisit } from "@/lib/opd-types";
import { PdfFooter, PdfHeader, financialConfidentialityNote, generatedAtLabel, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  patientRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 12 },
  patientLabel: { fontSize: 8, color: pdfColors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  patientValue: { fontSize: 10, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink, marginTop: 1 },
  table: { borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4, overflow: "hidden" },
  tableHeadRow: { flexDirection: "row", backgroundColor: pdfColors.soft, borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  tableRow: { flexDirection: "row" },
  cellService: { flex: 3, padding: 8 },
  cellAmount: { flex: 1, padding: 8, textAlign: "right" },
  headCell: { fontFamily: "Geist", fontWeight: "semibold", fontSize: 8.5, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.5 },
  totalRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: pdfColors.line, backgroundColor: pdfColors.soft },
  totalLabel: { flex: 3, padding: 8, fontFamily: "Geist", fontWeight: "bold", fontSize: 10 },
  totalAmount: { flex: 1, padding: 8, textAlign: "right", fontFamily: "Geist", fontWeight: "bold", fontSize: 10, color: pdfColors.brand },
  statusBadge: { alignSelf: "flex-start", borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 },
  statusText: { fontSize: 8.5, fontFamily: "Geist", fontWeight: "semibold" }
});

function formatRupees(amount?: string) {
  const value = Number((amount || "0").replace(/[^0-9.]/g, ""));
  if (!value) return "-";
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function InvoiceDocument({ visit }: { visit: OpdVisit }) {
  const isPaid = visit.billingStatus === "Paid";
  return (
    <Document title={`Invoice - ${visit.patientName}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType={isPaid ? "Receipt" : "Invoice"} reference={visit.receiptId || visit.token} />

        <View style={styles.patientRow}>
          <View>
            <Text style={styles.patientLabel}>Patient</Text>
            <Text style={styles.patientValue}>{visit.patientName}</Text>
          </View>
          {visit.uhid ? (
            <View>
              <Text style={styles.patientLabel}>UHID</Text>
              <Text style={styles.patientValue}>{visit.uhid}</Text>
            </View>
          ) : null}
          <View>
            <Text style={styles.patientLabel}>Phone</Text>
            <Text style={styles.patientValue}>{visit.phone}</Text>
          </View>
          <View>
            <Text style={styles.patientLabel}>Date</Text>
            <Text style={styles.patientValue}>{generatedAtLabel(new Date(visit.paidAt || visit.createdAt))}</Text>
          </View>
          <View>
            <Text style={styles.patientLabel}>Payment Method</Text>
            <Text style={styles.patientValue}>{visit.paymentMethod || "Not recorded"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeadRow}>
            <Text style={[styles.cellService, styles.headCell]}>Service</Text>
            <Text style={[styles.cellAmount, styles.headCell]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cellService, pdfStyles.bodyText]}>{visit.service}</Text>
            <Text style={[styles.cellAmount, pdfStyles.bodyText]}>{formatRupees(visit.estimatedAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatRupees(visit.estimatedAmount)}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: isPaid ? "#dcfce7" : "#fef3c7" }]}>
          <Text style={[styles.statusText, { color: isPaid ? "#166534" : "#92400e" }]}>
            {isPaid ? `Paid${visit.receiptId ? ` - Receipt ${visit.receiptId}` : ""}` : `Status: ${visit.billingStatus}`}
          </Text>
        </View>

        <PdfFooter confidentialityNote={`${financialConfidentialityNote} Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
