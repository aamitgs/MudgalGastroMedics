import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PurchaseOrderRecord } from "@/lib/purchase-order-types";
import { PdfFooter, PdfHeader, generatedAtLabel, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 12 },
  metaLabel: { fontSize: 8, color: pdfColors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  metaValue: { fontSize: 10, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink, marginTop: 1 },
  table: { borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4, overflow: "hidden" },
  tableHeadRow: { flexDirection: "row", backgroundColor: pdfColors.soft, borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  cellItem: { flex: 3, padding: 8 },
  cellQty: { flex: 1, padding: 8, textAlign: "right" },
  cellCost: { flex: 1.4, padding: 8, textAlign: "right" },
  headCell: { fontFamily: "Geist", fontWeight: "semibold", fontSize: 8.5, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.5 },
  totalRow: { flexDirection: "row", backgroundColor: pdfColors.soft },
  totalLabel: { flex: 4, padding: 8, fontFamily: "Geist", fontWeight: "bold", fontSize: 10 },
  totalAmount: { flex: 1.4, padding: 8, textAlign: "right", fontFamily: "Geist", fontWeight: "bold", fontSize: 10, color: pdfColors.brand },
  statusBadge: { alignSelf: "flex-start", borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 },
  statusText: { fontSize: 8.5, fontFamily: "Geist", fontWeight: "semibold" }
});

function formatRupees(amount: number) {
  if (!amount) return "-";
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

const statusBackground: Record<PurchaseOrderRecord["status"], string> = {
  Draft: "#f0f9fb",
  Ordered: "#dbeafe",
  Received: "#dcfce7",
  Cancelled: "#fee2e2"
};

const statusColor: Record<PurchaseOrderRecord["status"], string> = {
  Draft: pdfColors.muted,
  Ordered: "#1d4ed8",
  Received: "#166534",
  Cancelled: "#991b1b"
};

export function PurchaseOrderDocument({ order }: { order: PurchaseOrderRecord }) {
  const grandTotal = order.items.reduce((sum, item) => sum + item.quantityOrdered * (item.unitCost || 0), 0);

  return (
    <Document title={`Purchase Order - ${order.vendor}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType="Purchase Order" reference={order.id} />

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Vendor</Text>
            <Text style={styles.metaValue}>{order.vendor}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>{generatedAtLabel(new Date(order.createdAt))}</Text>
          </View>
          {order.expectedDeliveryDate ? (
            <View>
              <Text style={styles.metaLabel}>Expected Delivery</Text>
              <Text style={styles.metaValue}>{order.expectedDeliveryDate}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeadRow}>
            <Text style={[styles.cellItem, styles.headCell]}>Item</Text>
            <Text style={[styles.cellQty, styles.headCell]}>Qty</Text>
            <Text style={[styles.cellCost, styles.headCell]}>Unit Cost</Text>
            <Text style={[styles.cellCost, styles.headCell]}>Line Total</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.inventoryItemId} style={styles.tableRow}>
              <Text style={[styles.cellItem, pdfStyles.bodyText]}>
                {item.name} ({item.unit})
              </Text>
              <Text style={[styles.cellQty, pdfStyles.bodyText]}>{item.quantityOrdered}</Text>
              <Text style={[styles.cellCost, pdfStyles.bodyText]}>{item.unitCost ? formatRupees(item.unitCost) : "-"}</Text>
              <Text style={[styles.cellCost, pdfStyles.bodyText]}>{formatRupees(item.quantityOrdered * (item.unitCost || 0))}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatRupees(grandTotal)}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBackground[order.status] }]}>
          <Text style={[styles.statusText, { color: statusColor[order.status] }]}>Status: {order.status}</Text>
        </View>

        {order.notes ? (
          <View style={{ marginTop: 10 }}>
            <Text style={pdfStyles.sectionLabel}>Notes</Text>
            <Text style={pdfStyles.bodyText}>{order.notes}</Text>
          </View>
        ) : null}

        <PdfFooter confidentialityNote={`Internal procurement document. Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
