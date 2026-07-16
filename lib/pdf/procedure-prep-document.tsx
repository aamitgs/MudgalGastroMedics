import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PrepChecklistItem } from "@/lib/procedure-prep";
import { PdfFooter, PdfHeader, generatedAtLabel, patientEducationNote, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  intro: { fontSize: 10, lineHeight: 1.6, color: pdfColors.muted, marginBottom: 14 },
  item: { flexDirection: "row", gap: 10, marginBottom: 10 },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: pdfColors.brand,
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Geist",
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 3
  },
  timing: { fontFamily: "Geist", fontWeight: "semibold", fontSize: 8.5, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.5 },
  instruction: { fontSize: 10, lineHeight: 1.5, color: pdfColors.ink, marginTop: 2 }
});

// Not tied to a patient record — this is general public pre-visit education
// content, generated the same way for anyone visiting the procedure page, so
// it carries no PII and no patient-specific confidentiality note.
export function ProcedurePrepDocument({ title, checklist }: { title: string; checklist: PrepChecklistItem[] }) {
  return (
    <Document title={`${title} - Pre-Visit Preparation Guide`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType="Pre-Visit Prep Guide" reference={title} />

        <Text style={styles.intro}>
          Preparation checklist for {title.toLowerCase()}. Confirm exact timing with the hospital team before your visit — this is general guidance, not a substitute for your doctor&apos;s specific instructions.
        </Text>

        <View style={pdfStyles.card}>
          {checklist.map((item, index) => (
            <View key={`${item.timing}-${index}`} style={styles.item}>
              <Text style={styles.badge}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timing}>{item.timing}</Text>
                <Text style={styles.instruction}>{item.instruction}</Text>
              </View>
            </View>
          ))}
        </View>

        <PdfFooter confidentialityNote={`${patientEducationNote} Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
