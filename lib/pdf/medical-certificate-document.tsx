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
  certificateBody: { fontSize: 10.5, lineHeight: 1.7, color: pdfColors.ink, marginTop: 6 },
  signatureBlock: { marginTop: 40, alignItems: "flex-end" },
  signatureName: { fontFamily: "Geist", fontWeight: "bold", fontSize: 10.5, color: pdfColors.ink },
  signatureMeta: { fontSize: 8, color: pdfColors.muted, marginTop: 2 }
});

// Built from the same OPD visit fields the prescription PDF already uses
// (clinicalNote, advice, service) rather than a new certificate-specific data
// model — there's no dedicated "fitness/rest" input anywhere in the product
// yet, and inventing one was out of scope for this pass.
export function MedicalCertificateDocument({ visit, patient }: { visit: OpdVisit; patient?: PatientRecord }) {
  const examinedOn = generatedAtLabel(new Date(visit.createdAt));

  return (
    <Document title={`Medical Certificate - ${visit.patientName}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType="Medical Certificate" reference={visit.token} />

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
            <Text style={styles.patientLabel}>Examined On</Text>
            <Text style={styles.patientValue}>{examinedOn}</Text>
          </View>
        </View>

        <View style={pdfStyles.card}>
          <Text style={pdfStyles.sectionLabel}>Certificate</Text>
          <Text style={styles.certificateBody}>
            {`This is to certify that I examined ${visit.patientName}${patient?.age ? `, aged ${patient.age}` : ""} on ${examinedOn} for ${visit.service}.`}
            {"\n\n"}
            {visit.clinicalNote ? `Clinical findings: ${visit.clinicalNote}` : "No specific clinical findings recorded at this visit."}
            {"\n\n"}
            {visit.advice || "The patient is advised rest and follow-up as clinically indicated."}
          </Text>
        </View>

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
