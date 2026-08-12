import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { visitReference, type OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { doctor } from "@/lib/site-data";
import { PdfFooter, PdfHeader, clinicalConfidentialityNote, generatedAtLabel, pdfColors, pdfStyles } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  patientRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 4 },
  patientLabel: { fontSize: 8, color: pdfColors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  patientValue: { fontSize: 10, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink, marginTop: 1 },
  addressee: { fontSize: 10.5, fontFamily: "Geist", fontWeight: "semibold", color: pdfColors.ink, marginTop: 10 },
  letterBody: { fontSize: 10.5, lineHeight: 1.7, color: pdfColors.ink, marginTop: 6 },
  signatureBlock: { marginTop: 40, alignItems: "flex-end" },
  signatureName: { fontFamily: "Geist", fontWeight: "bold", fontSize: 10.5, color: pdfColors.ink },
  signatureMeta: { fontSize: 8, color: pdfColors.muted, marginTop: 2 }
});

// Mirrors MedicalCertificateDocument's structure exactly (Track 4.3). Unlike
// the certificate, there's no boilerplate fallback body — a referral letter
// with no drafted/written content wouldn't mean anything, so renderReferralLetterPdf
// refuses to render until visit.referralLetter is non-empty.
export function ReferralLetterDocument({ visit, patient }: { visit: OpdVisit; patient?: PatientRecord }) {
  const writtenOn = generatedAtLabel();

  return (
    <Document title={`Referral Letter - ${visit.patientName}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader docType="Referral Letter" reference={visitReference(visit)} />

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
            <Text style={styles.patientValue}>{writtenOn}</Text>
          </View>
        </View>

        <Text style={styles.addressee}>To: {visit.referralTo || "Referring Specialist"}</Text>

        <View style={pdfStyles.card}>
          <Text style={pdfStyles.sectionLabel}>Referral Letter</Text>
          <Text style={styles.letterBody}>{visit.referralLetter}</Text>
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureName}>{visit.doctorName || doctor.name}</Text>
          <Text style={styles.signatureMeta}>{doctor.designation}</Text>
          <Text style={styles.signatureMeta}>Reg. No: {doctor.registration}</Text>
        </View>

        <PdfFooter confidentialityNote={`${clinicalConfidentialityNote} Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
