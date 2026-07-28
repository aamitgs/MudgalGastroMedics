import "server-only";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPaise } from "@/lib/billing-calc";
import type { Invoice } from "@/lib/billing-types";
import { PdfFooter, PdfHeader, financialConfidentialityNote, generatedAtLabel, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 12 },
  metaLabel: { fontSize: 8, color: pdfColors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  metaValue: { fontSize: 10, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink, marginTop: 1 },
  table: { borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4, overflow: "hidden" },
  headRow: { flexDirection: "row", backgroundColor: pdfColors.soft, borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: pdfColors.line },
  cellDesc: { flex: 4, padding: 6 },
  cellQty: { flex: 0.8, padding: 6, textAlign: "right" },
  cellRate: { flex: 1.4, padding: 6, textAlign: "right" },
  cellTax: { flex: 1, padding: 6, textAlign: "right" },
  cellAmount: { flex: 1.5, padding: 6, textAlign: "right" },
  headCell: { fontFamily: "Geist", fontWeight: "semibold", fontSize: 8, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.4 },
  bodyCell: { fontSize: 9, color: pdfColors.ink },
  lineMeta: { fontSize: 7, color: pdfColors.muted, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.3 },
  summaryWrap: { flexDirection: "row", justifyContent: "space-between", gap: 16, marginTop: 12 },
  summaryBox: { flex: 1, borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4, padding: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  summaryLabel: { fontSize: 9, color: pdfColors.muted },
  summaryValue: { fontSize: 9, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: pdfColors.line, paddingTop: 4, marginTop: 4 },
  totalLabel: { fontSize: 10, fontFamily: "Geist", fontWeight: "bold", color: pdfColors.ink },
  totalValue: { fontSize: 10, fontFamily: "Geist", fontWeight: "bold", color: pdfColors.brand },
  qrBox: { width: 150, alignItems: "center", borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4, padding: 8 },
  qrImage: { width: 96, height: 96 },
  qrCaption: { fontSize: 7.5, color: pdfColors.muted, marginTop: 4, textAlign: "center" },
  sectionTitle: { fontSize: 8.5, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  entryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  entryText: { fontSize: 8.5, color: pdfColors.ink },
  entryMuted: { fontSize: 8, color: pdfColors.muted },
  duplicateBanner: {
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
    alignSelf: "flex-start"
  },
  duplicateText: { fontSize: 9, fontFamily: "Geist", fontWeight: "bold", color: "#b91c1c", letterSpacing: 1 },
  statusBadge: { alignSelf: "flex-start", borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 },
  statusText: { fontSize: 8.5, fontFamily: "Geist", fontWeight: "semibold" }
});

function dateLabel(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export type ItemisedInvoiceProps = {
  invoice: Invoice;
  /** Data-URI PNG of the `upi://pay` link; omitted when UPI isn't configured or nothing is owed. */
  upiQrDataUri?: string;
  /** Data-URI PNG encoding the invoice number, so a counter can scan the bill back up. */
  invoiceQrDataUri?: string;
  /** 1 for the original; anything higher stamps the document DUPLICATE. */
  copyNumber?: number;
};

/**
 * The itemised invoice (Track 5.8).
 *
 * Replaces a document that printed one hardcoded line and one total — which
 * was fine when a bill *was* one amount, and became actively misleading once
 * invoices carried real line items, tax, split payments and refunds. A patient
 * is entitled to see what they are being charged for.
 */
export function ItemisedInvoiceDocument({ invoice, upiQrDataUri, invoiceQrDataUri, copyNumber = 1 }: ItemisedInvoiceProps) {
  const settled = invoice.balancePaise <= 0;
  const refunds = invoice.refunds ?? [];

  return (
    <Document title={`Invoice ${invoice.invoiceNo}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType={settled ? "Receipt" : "Invoice"} reference={invoice.invoiceNo} />

        {copyNumber > 1 ? (
          <View style={styles.duplicateBanner}>
            <Text style={styles.duplicateText}>DUPLICATE — COPY {copyNumber}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Patient</Text>
            <Text style={styles.metaValue}>{invoice.patientName}</Text>
          </View>
          {invoice.uhid ? (
            <View>
              <Text style={styles.metaLabel}>UHID</Text>
              <Text style={styles.metaValue}>{invoice.uhid}</Text>
            </View>
          ) : null}
          <View>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{dateLabel(invoice.issuedAt || invoice.createdAt)}</Text>
          </View>
          {invoice.department ? (
            <View>
              <Text style={styles.metaLabel}>Department</Text>
              <Text style={styles.metaValue}>{invoice.department}</Text>
            </View>
          ) : null}
          {invoice.doctorName ? (
            <View>
              <Text style={styles.metaLabel}>Doctor</Text>
              <Text style={styles.metaValue}>{invoice.doctorName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={[styles.cellDesc, styles.headCell]}>Charge</Text>
            <Text style={[styles.cellQty, styles.headCell]}>Qty</Text>
            <Text style={[styles.cellRate, styles.headCell]}>Rate</Text>
            <Text style={[styles.cellTax, styles.headCell]}>Tax</Text>
            <Text style={[styles.cellAmount, styles.headCell]}>Amount</Text>
          </View>
          {invoice.lineItems.map((line) => (
            <View key={line.id} style={styles.row} wrap={false}>
              <View style={styles.cellDesc}>
                <Text style={styles.bodyCell}>{line.description}</Text>
                <Text style={styles.lineMeta}>{line.category}</Text>
              </View>
              <Text style={[styles.cellQty, styles.bodyCell]}>{line.quantity}</Text>
              <Text style={[styles.cellRate, styles.bodyCell]}>{formatPaise(line.unitPricePaise)}</Text>
              <Text style={[styles.cellTax, styles.bodyCell]}>{line.taxPaise ? formatPaise(line.taxPaise) : "-"}</Text>
              <Text style={[styles.cellAmount, styles.bodyCell]}>{formatPaise(line.totalPaise)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryWrap}>
          {upiQrDataUri || invoiceQrDataUri ? (
            <View style={styles.qrBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop */}
              <Image style={styles.qrImage} src={upiQrDataUri || invoiceQrDataUri || ""} />
              <Text style={styles.qrCaption}>
                {upiQrDataUri
                  ? `Scan to pay ${formatPaise(invoice.balancePaise)} by UPI`
                  : `Scan to look up ${invoice.invoiceNo}`}
              </Text>
            </View>
          ) : null}

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPaise(invoice.subtotalPaise)}</Text>
            </View>
            {invoice.discountPaise > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount{invoice.discountReason ? ` (${invoice.discountReason})` : ""}</Text>
                <Text style={styles.summaryValue}>-{formatPaise(invoice.discountPaise)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPaise(invoice.totalPaise)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 4 }]}>
              <Text style={styles.summaryLabel}>Collected</Text>
              <Text style={styles.summaryValue}>{formatPaise(invoice.paidPaise + invoice.refundedPaise)}</Text>
            </View>
            {invoice.refundedPaise > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Refunded</Text>
                <Text style={styles.summaryValue}>-{formatPaise(invoice.refundedPaise)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance due</Text>
              <Text style={styles.totalValue}>{formatPaise(invoice.balancePaise)}</Text>
            </View>
          </View>
        </View>

        {invoice.payments.length ? (
          <View>
            <Text style={styles.sectionTitle}>Payments received</Text>
            {invoice.payments.map((payment) => (
              <View key={payment.id} style={styles.entryRow}>
                <Text style={styles.entryText}>
                  {payment.method}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </Text>
                <Text style={styles.entryMuted}>{dateLabel(payment.receivedAt)}</Text>
                <Text style={styles.entryText}>{formatPaise(payment.amountPaise)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {refunds.length ? (
          <View>
            <Text style={styles.sectionTitle}>Refunds</Text>
            {refunds.map((refund) => (
              <View key={refund.id} style={styles.entryRow}>
                <Text style={styles.entryText}>
                  {refund.method} · {refund.reason}
                </Text>
                <Text style={styles.entryMuted}>{dateLabel(refund.refundedAt)}</Text>
                <Text style={styles.entryText}>-{formatPaise(refund.amountPaise)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.statusBadge, { backgroundColor: settled ? "#dcfce7" : "#fef3c7" }]}>
          <Text style={[styles.statusText, { color: settled ? "#166534" : "#92400e" }]}>
            {invoice.status === "Cancelled"
              ? `Cancelled — ${invoice.cancelReason ?? "no reason recorded"}`
              : settled
                ? "Paid in full"
                : `${formatPaise(invoice.balancePaise)} outstanding`}
          </Text>
        </View>

        <PdfFooter confidentialityNote={`${financialConfidentialityNote} Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
