import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { doctor } from "@/lib/site-data";
import { PdfFooter, PdfHeader, clinicalConfidentialityNote, generatedAtLabel, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  patientRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 4 },
  patientLabel: { fontSize: 8, color: pdfColors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  patientValue: { fontSize: 10, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink, marginTop: 1 },
  allergyBanner: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    padding: 8,
    marginBottom: 10
  },
  allergyText: { fontSize: 9.5, fontFamily: "Geist", fontWeight: "semibold", color: "#991b1b" },
  signatureBlock: { marginTop: 28, alignItems: "flex-end" },
  signatureName: { fontFamily: "Geist", fontWeight: "bold", fontSize: 10.5, color: pdfColors.ink },
  signatureMeta: { fontSize: 8, color: pdfColors.muted, marginTop: 2 }
});

export function PrescriptionDocument({ visit, patient }: { visit: OpdVisit; patient?: PatientRecord }) {
  return (
    <Document title={`Prescription - ${visit.patientName}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType="Prescription" reference={visit.token} />

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
            <Text style={styles.patientLabel}>Phone</Text>
            <Text style={styles.patientValue}>{visit.phone}</Text>
          </View>
          <View>
            <Text style={styles.patientLabel}>Visit Date</Text>
            <Text style={styles.patientValue}>{generatedAtLabel(new Date(visit.createdAt))}</Text>
          </View>
          <View>
            <Text style={styles.patientLabel}>Service</Text>
            <Text style={styles.patientValue}>{visit.service}</Text>
          </View>
        </View>

        {patient?.allergies ? (
          <View style={styles.allergyBanner}>
            <Text style={styles.allergyText}>Allergies: {patient.allergies}</Text>
          </View>
        ) : null}

        {visit.clinicalNote ? (
          <View style={pdfStyles.card}>
            <Text style={pdfStyles.sectionLabel}>Clinical Note</Text>
            <Text style={pdfStyles.bodyText}>{visit.clinicalNote}</Text>
          </View>
        ) : null}

        <View style={pdfStyles.card}>
          <Text style={pdfStyles.sectionLabel}>Prescription (Rx)</Text>
          <Text style={pdfStyles.bodyText}>{visit.prescription || "No medication prescribed at this visit."}</Text>
        </View>

        {visit.advice ? (
          <View style={pdfStyles.card}>
            <Text style={pdfStyles.sectionLabel}>Advice</Text>
            <Text style={pdfStyles.bodyText}>{visit.advice}</Text>
          </View>
        ) : null}

        {visit.followUpDate ? (
          <View style={pdfStyles.card}>
            <Text style={pdfStyles.sectionLabel}>Follow-up</Text>
            <Text style={pdfStyles.bodyText}>{visit.followUpDate}</Text>
          </View>
        ) : null}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureName}>{doctor.name}</Text>
          <Text style={styles.signatureMeta}>{doctor.designation}</Text>
          <Text style={styles.signatureMeta}>Reg. No: {doctor.registration}</Text>
        </View>

        <PdfFooter confidentialityNote={`${clinicalConfidentialityNote} Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
