import "server-only";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OpdVisit, PrescriptionItem } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { resolveInstructionText } from "@/lib/prescription-instructions";
import { doctor, fullAddress, site } from "@/lib/site-data";
import { PdfFooter, clinicalConfidentialityNote, generatedAtLabel, pdfColors, pdfStyles, stomachIconPath } from "@/lib/pdf/branding";

const styles = StyleSheet.create({
  page: { ...pdfStyles.page, paddingTop: 148 },
  rxHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rxHeaderCol: { flex: 1, gap: 1.5 },
  rxHeaderColRight: { alignItems: "flex-end" },
  rxIcon: { width: 56, height: 56, marginHorizontal: 12 },
  rxDoctorName: { fontFamily: "Geist", fontWeight: "bold", fontSize: 15, color: "#c0392b" },
  rxDoctorCredentials: { fontFamily: "Geist", fontWeight: "bold", fontSize: 8.5, color: pdfColors.ink, marginTop: 1 },
  rxDoctorMeta: { fontSize: 8, color: pdfColors.ink },
  rxHospitalName: { fontFamily: "Geist", fontWeight: "bold", fontSize: 17, color: "#c0392b", textAlign: "right" },
  rxHospitalMeta: { fontSize: 8.5, fontFamily: "Geist", fontWeight: "bold", color: pdfColors.ink, textAlign: "right" },
  rxHospitalContact: { fontSize: 8, color: pdfColors.ink, textAlign: "right" },
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
  rxTable: { borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4 },
  rxTableHeadRow: { flexDirection: "row", backgroundColor: pdfColors.soft, borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  rxTableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: pdfColors.line },
  rxHeadCell: { padding: 6, fontFamily: "Geist", fontWeight: "semibold", fontSize: 8, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.4 },
  rxBodyCell: { padding: 6, fontSize: 9, color: pdfColors.ink },
  rxBodyCellHindi: { fontSize: 8, color: pdfColors.muted, marginTop: 1 },
  rxColMedicine: { flex: 2 },
  rxColStrength: { flex: 1 },
  rxColInstruction: { flex: 2.4 },
  rxColDays: { flex: 0.6 },
  signatureBlock: { marginTop: 28, alignItems: "flex-end" },
  signatureBox: { width: 190, alignItems: "center", borderTopWidth: 1, borderTopStyle: "dashed", borderTopColor: pdfColors.muted, paddingTop: 6 },
  signatureLabel: { fontFamily: "Geist", fontStyle: "italic", fontSize: 9, color: pdfColors.muted },
  signatureName: { fontFamily: "Geist", fontWeight: "bold", fontSize: 10.5, color: pdfColors.ink, marginTop: 4, textAlign: "center" },
  signatureRole: { fontFamily: "Geist", fontWeight: "bold", fontSize: 9, color: pdfColors.ink, marginTop: 2, textAlign: "center" }
});

function PrescriptionHeader() {
  return (
    <View style={styles.rxHeader} fixed>
      <View style={styles.rxHeaderCol}>
        <Text style={styles.rxDoctorName}>{doctor.name.toUpperCase()}</Text>
        <Text style={styles.rxDoctorCredentials}>{doctor.credentials}</Text>
        <Text style={styles.rxDoctorMeta}>{doctor.prescriptionRole}</Text>
        <Text style={styles.rxDoctorMeta}>{doctor.priorConsultancy}</Text>
        <Text style={styles.rxDoctorMeta}>Regd. No. {doctor.registration}</Text>
      </View>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF node, not an HTML img; it has no alt prop */}
      <Image src={stomachIconPath} style={styles.rxIcon} />
      <View style={[styles.rxHeaderCol, styles.rxHeaderColRight]}>
        <Text style={styles.rxHospitalName}>{site.shortName.toUpperCase()}</Text>
        <Text style={styles.rxHospitalMeta}>A Gastro &amp; Liver Superspeciality Hospital</Text>
        <Text style={styles.rxHospitalContact}>{site.phone}, {site.mobile}</Text>
        <Text style={styles.rxHospitalContact}>ADD:- {fullAddress.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function RxTable({ items }: { items: PrescriptionItem[] }) {
  return (
    <View style={styles.rxTable}>
      <View style={styles.rxTableHeadRow}>
        <Text style={[styles.rxHeadCell, styles.rxColMedicine]}>Medicine Name</Text>
        <Text style={[styles.rxHeadCell, styles.rxColStrength]}>Strength</Text>
        <Text style={[styles.rxHeadCell, styles.rxColInstruction]}>Instruction</Text>
        <Text style={[styles.rxHeadCell, styles.rxColDays]}>Days</Text>
      </View>
      {items.map((item) => {
        const instruction = resolveInstructionText(item.instruction);
        return (
          <View key={item.id} style={styles.rxTableRow} wrap={false}>
            <Text style={[styles.rxBodyCell, styles.rxColMedicine]}>{item.medicine}</Text>
            <Text style={[styles.rxBodyCell, styles.rxColStrength]}>{item.strength || "—"}</Text>
            <View style={[styles.rxBodyCell, styles.rxColInstruction]}>
              <Text>{instruction.label}</Text>
              {instruction.hindi ? <Text style={styles.rxBodyCellHindi}>{instruction.hindi}</Text> : null}
            </View>
            <Text style={[styles.rxBodyCell, styles.rxColDays]}>{item.days || "—"}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function PrescriptionDocument({ visit, patient }: { visit: OpdVisit; patient?: PatientRecord }) {
  const hasItems = Boolean(visit.prescriptionItems?.length);
  return (
    <Document title={`Prescription - ${visit.patientName}`}>
      <Page size="A4" style={styles.page}>
        <PrescriptionHeader />

        <View style={styles.patientRow}>
          <View>
            <Text style={styles.patientLabel}>Token</Text>
            <Text style={styles.patientValue}>{visit.token}</Text>
          </View>
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

        {visit.diagnosis ? (
          <View style={pdfStyles.card}>
            <Text style={pdfStyles.sectionLabel}>Diagnosis</Text>
            <Text style={pdfStyles.bodyText}>{visit.diagnosis}</Text>
          </View>
        ) : null}

        {visit.clinicalNote ? (
          <View style={pdfStyles.card}>
            <Text style={pdfStyles.sectionLabel}>Clinical Note</Text>
            <Text style={pdfStyles.bodyText}>{visit.clinicalNote}</Text>
          </View>
        ) : null}

        <View style={pdfStyles.card}>
          <Text style={pdfStyles.sectionLabel}>Treatment Advice (Rx)</Text>
          {hasItems ? (
            <RxTable items={visit.prescriptionItems!} />
          ) : (
            <Text style={pdfStyles.bodyText}>{visit.prescription || "No medication prescribed at this visit."}</Text>
          )}
        </View>

        {hasItems && visit.prescription ? (
          <View style={pdfStyles.card}>
            <Text style={pdfStyles.sectionLabel}>Additional Notes</Text>
            <Text style={pdfStyles.bodyText}>{visit.prescription}</Text>
          </View>
        ) : null}

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
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature</Text>
            <Text style={styles.signatureName}>{doctor.name.toUpperCase()}</Text>
            <Text style={styles.signatureRole}>{doctor.signatureRole}</Text>
          </View>
        </View>

        <PdfFooter confidentialityNote={`${clinicalConfidentialityNote} Not valid for medicolegal purposes. Generated ${generatedAtLabel()}.`} />
      </Page>
    </Document>
  );
}
