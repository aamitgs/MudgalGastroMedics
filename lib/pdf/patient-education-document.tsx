import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { PdfFooter, PdfHeader, generatedAtLabel, patientEducationNote, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  patientRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 12 },
  patientLabel: { fontSize: 8, color: pdfColors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  patientValue: { fontSize: 10, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink, marginTop: 1 },
  item: { flexDirection: "row", gap: 10, marginBottom: 8 },
  bullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: pdfColors.brand,
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Geist",
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 2.5
  },
  point: { flex: 1, fontSize: 10, lineHeight: 1.5, color: pdfColors.ink }
});

/**
 * Patient-facing education handout (Track: patient education sheets), one
 * per diagnosis/procedure, generated from a specific consultation so it
 * carries the patient's name — distinct from ProcedurePrepDocument (public,
 * patient-agnostic, generated the same way for anyone). Shares that
 * document's patientEducationNote footer since the guidance itself is the
 * same kind of general, non-personalized content either way.
 */
export function PatientEducationDocument({ visit, patient, title, points }: { visit: OpdVisit; patient?: PatientRecord; title: string; points: string[] }) {
  return (
    <Document title={`${title} - ${visit.patientName}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType="Patient Education Sheet" reference={title} />

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
            <Text style={styles.patientLabel}>Age / Gender</Text>
            <Text style={styles.patientValue}>{[patient?.age, patient?.gender].filter(Boolean).join(" / ") || "Not recorded"}</Text>
          </View>
          <View>
            <Text style={styles.patientLabel}>Date</Text>
            <Text style={styles.patientValue}>{generatedAtLabel(new Date(visit.createdAt))}</Text>
          </View>
        </View>

        <View style={pdfStyles.card}>
          {points.map((point, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.bullet}>{index + 1}</Text>
              <Text style={styles.point}>{point}</Text>
            </View>
          ))}
        </View>

        <PdfFooter confidentialityNote={`${patientEducationNote} Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
