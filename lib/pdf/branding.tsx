import "server-only";
import path from "node:path";
import { Font, Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { fullAddress, site } from "@/lib/site-data";

const geistDir = path.join(process.cwd(), "node_modules", "geist", "dist", "fonts", "geist-sans");

let fontsRegistered = false;

export function registerPdfFonts() {
  if (fontsRegistered) return;
  fontsRegistered = true;
  Font.register({
    family: "Geist",
    fonts: [
      { src: path.join(geistDir, "Geist-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(geistDir, "Geist-Medium.ttf"), fontWeight: "medium" },
      { src: path.join(geistDir, "Geist-SemiBold.ttf"), fontWeight: "semibold" },
      { src: path.join(geistDir, "Geist-Bold.ttf"), fontWeight: "bold" }
    ]
  });
  // react-pdf hyphenates by default, which mangles clinical terms and dosages mid-word.
  Font.registerHyphenationCallback((word) => [word]);
}

export const logoPath = path.join(process.cwd(), "public", "mgm-logo.png");

export const pdfColors = {
  ink: "#0f172a",
  muted: "#475569",
  line: "#dbe3e8",
  brand: "#087d9e",
  soft: "#f0f9fb"
};

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Geist",
    fontSize: 10,
    color: pdfColors.ink,
    paddingTop: 92,
    paddingBottom: 56,
    paddingHorizontal: 36
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: pdfColors.brand,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  logo: { width: 42, height: 42 },
  headerRow: { flexDirection: "row", gap: 12 },
  hospitalName: { fontFamily: "Geist", fontWeight: "bold", fontSize: 13, color: pdfColors.ink },
  hospitalMeta: { fontSize: 8, color: pdfColors.muted, marginTop: 2, maxWidth: 260 },
  docTypeBlock: { alignItems: "flex-end" },
  docType: { fontFamily: "Geist", fontWeight: "bold", fontSize: 12, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 1 },
  docRef: { fontSize: 8, color: pdfColors.muted, marginTop: 3 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: pdfColors.line,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7.5, color: pdfColors.muted },
  sectionLabel: { fontFamily: "Geist", fontWeight: "semibold", fontSize: 9, color: pdfColors.brand, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  card: { borderWidth: 1, borderColor: pdfColors.line, borderRadius: 4, padding: 10, marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bodyText: { fontSize: 9.5, lineHeight: 1.5, color: pdfColors.ink }
});

export function PdfHeader({ docType, reference }: { docType: string; reference: string }) {
  return (
    <View style={pdfStyles.header} fixed>
      <View style={pdfStyles.headerRow}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF node, not an HTML img; it has no alt prop */}
        <Image src={logoPath} style={pdfStyles.logo} />
        <View>
          <Text style={pdfStyles.hospitalName}>{site.name}</Text>
          <Text style={pdfStyles.hospitalMeta}>{fullAddress}</Text>
          <Text style={pdfStyles.hospitalMeta}>Phone: {site.phone} | {site.mobile}</Text>
        </View>
      </View>
      <View style={pdfStyles.docTypeBlock}>
        <Text style={pdfStyles.docType}>{docType}</Text>
        <Text style={pdfStyles.docRef}>Ref: {reference}</Text>
      </View>
    </View>
  );
}

export function PdfFooter({ confidentialityNote }: { confidentialityNote: string }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>{confidentialityNote}</Text>
      <Text style={pdfStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

export function generatedAtLabel(date = new Date()) {
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export const clinicalConfidentialityNote =
  "Confidential clinical document. Generated electronically for the named patient only.";

export const financialConfidentialityNote =
  "Confidential billing document. Generated electronically for the named patient only.";

export const operationalConfidentialityNote =
  "Confidential hospital record. Exported electronically for internal staff use only.";
