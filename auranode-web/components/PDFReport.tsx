"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import type { Report, XRayAIFinding, LabAIFindings, AILabFinding } from "@/types";
import { Download } from "lucide-react";

interface Props {
  report: Report;
  patientName: string;
  doctorName: string;
}

const BRAND_BLUE = "#2563eb";
const GRAY_TEXT = "#64748b";
const RED = "#dc2626";
const GREEN = "#16a34a";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 40,
    fontSize: 10,
    color: "#1e293b",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: BRAND_BLUE,
  },
  headerRight: { alignItems: "flex-end" },
  reportTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    letterSpacing: 1,
  },
  reportId: { fontSize: 8, color: GRAY_TEXT, marginTop: 2 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 12,
  },
  // Sections
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  twoColumn: { flexDirection: "row", gap: 20 },
  column: { flex: 1 },
  infoRow: { marginBottom: 6 },
  infoLabel: { fontSize: 8, color: GRAY_TEXT, marginBottom: 1 },
  infoValue: { fontSize: 10, color: "#1e293b" },
  // AI Findings
  predictionText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  confidence: { fontSize: 10, color: GRAY_TEXT, marginBottom: 6 },
  summaryText: { fontSize: 9, lineHeight: 1.5, color: "#475569" },
  // Lab table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  tableCell: { flex: 1, fontSize: 9 },
  tableCellBold: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Notes box
  notesBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
    minHeight: 60,
  },
  notesText: { fontSize: 9, lineHeight: 1.6, color: "#475569" },
  // Signature
  sigRow: { marginBottom: 4 },
  sigLabel: { fontSize: 8, color: GRAY_TEXT },
  sigValue: { fontSize: 9 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: GRAY_TEXT,
    textAlign: "center",
    lineHeight: 1.5,
  },
});

function getMarkerColor(status: AILabFinding["status"]): string {
  if (status === "NORMAL") return GREEN;
  if (status === "LOW" || status === "HIGH") return RED;
  return GRAY_TEXT;
}

function ReportDocument({
  report,
  patientName,
  doctorName,
}: Props) {
  const xrayFindings =
    report.upload_type === "xray"
      ? (report.ai_findings as XRayAIFinding | null)
      : null;
  const labFindings =
    report.upload_type === "lab"
      ? (report.ai_findings as LabAIFindings | null)
      : null;

  const dateGenerated = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logoText}>AuraNode</Text>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>MEDICAL REPORT</Text>
            <Text style={styles.reportId}>
              ID: {report.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* REPORT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PATIENT NAME</Text>
                <Text style={styles.infoValue}>{patientName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>REPORT TYPE</Text>
                <Text style={styles.infoValue}>
                  {report.upload_type === "xray" ? "X-Ray / Medical Scan" : "Lab Report"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>DATE GENERATED</Text>
                <Text style={styles.infoValue}>{dateGenerated}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>STATUS</Text>
                <Text style={styles.infoValue}>{report.status.replace("_", " ").toUpperCase()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>DOCTOR</Text>
                <Text style={styles.infoValue}>{doctorName || "—"}</Text>
              </View>
              {report.reviewed_at && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>REVIEW DATE</Text>
                  <Text style={styles.infoValue}>
                    {new Date(report.reviewed_at).toLocaleDateString("en-PK")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {/* AI FINDINGS */}
        {(xrayFindings || labFindings) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Findings</Text>
            {xrayFindings && (
              <View>
                <Text
                  style={[
                    styles.predictionText,
                    {
                      color:
                        xrayFindings.prediction === "Normal"
                          ? GREEN
                          : RED,
                    },
                  ]}
                >
                  {xrayFindings.prediction}
                </Text>
                <Text style={styles.confidence}>
                  Confidence: {(xrayFindings.confidence * 100).toFixed(1)}%
                </Text>
                {xrayFindings.summary && (
                  <Text style={styles.summaryText}>{xrayFindings.summary}</Text>
                )}
              </View>
            )}
            {labFindings && labFindings.findings.length > 0 && (
              <View>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableCellBold}>Marker</Text>
                  <Text style={styles.tableCellBold}>Value</Text>
                  <Text style={styles.tableCellBold}>Unit</Text>
                  <Text style={styles.tableCellBold}>Status</Text>
                </View>
                {labFindings.findings.map((finding, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{finding.marker}</Text>
                    <Text style={styles.tableCell}>
                      {String(finding.value)}
                    </Text>
                    <Text style={styles.tableCell}>{finding.unit || "—"}</Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { color: getMarkerColor(finding.status) },
                      ]}
                    >
                      {finding.status}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {(xrayFindings || labFindings) && <View style={styles.divider} />}

        {/* DOCTOR NOTES */}
        {report.doctor_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physician's Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{report.doctor_notes}</Text>
            </View>
          </View>
        )}

        {/* SIGNATURE */}
        {doctorName && report.reviewed_at && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Digital Signature</Text>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>DIGITALLY REVIEWED BY</Text>
              <Text style={styles.sigValue}>{doctorName}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>REVIEW TIMESTAMP</Text>
              <Text style={styles.sigValue}>
                {new Date(report.reviewed_at).toLocaleString("en-PK")}
              </Text>
            </View>
            {report.doctor && report.doctor.pmdc_number && (
              <View style={styles.sigRow}>
                <Text style={styles.sigLabel}>PMDC NUMBER</Text>
                <Text style={styles.sigValue}>{report.doctor.pmdc_number}</Text>
              </View>
            )}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This report was generated with AI assistance and reviewed by a
            licensed physician. Not a substitute for clinical consultation.
            {"\n"}
            Generated by AuraNode | auranode.app
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function PDFReport({ report, patientName, doctorName }: Props) {
  return (
    <PDFDownloadLink
      document={
        <ReportDocument
          report={report}
          patientName={patientName}
          doctorName={doctorName}
        />
      }
      fileName={`auranode_report_${report.id.slice(0, 8)}.pdf`}
    >
      {({ loading }) => (
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          {loading ? "Preparing PDF..." : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
