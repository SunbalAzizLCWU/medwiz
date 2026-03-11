"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import type { Report, AILabFinding } from "@/types";
import { formatDate } from "@/lib/utils";

interface Props {
  report: Report;
  patientName: string;
  doctorName: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  reportLabel: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "right",
  },
  reportId: {
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "right",
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 20,
  },
  colHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#94a3b8",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 10,
    color: "#1e293b",
    marginBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  findingBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  predictionText: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: "#2563eb",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: "6 8",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: "#1e293b",
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statusNormal: { color: "#16a34a" },
  statusHigh: { color: "#dc2626" },
  statusLow: { color: "#dc2626" },
  statusNA: { color: "#94a3b8" },
  notesBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    minHeight: 60,
  },
  notesText: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  signatureText: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    color: "#94a3b8",
    lineHeight: 1.5,
    textAlign: "center",
  },
});

function getLabStatusStyle(status: AILabFinding["status"]) {
  switch (status) {
    case "NORMAL":
      return styles.statusNormal;
    case "HIGH":
      return styles.statusHigh;
    case "LOW":
      return styles.statusLow;
    default:
      return styles.statusNA;
  }
}

function ReportDocument({ report, patientName, doctorName }: Props) {
  const isXRay = report.upload_type === "xray";
  const xrayFindings =
    isXRay && report.ai_findings?.type === "xray" ? report.ai_findings : null;
  const labFindings =
    !isXRay && report.ai_findings?.type === "lab" ? report.ai_findings : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logoText}>AuraNode</Text>
          <View>
            <Text style={styles.reportLabel}>MEDICAL REPORT</Text>
            <Text style={styles.reportId}>ID: {report.id.slice(0, 8)}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* REPORT INFO */}
        <View style={styles.twoCol}>
          <View style={styles.colHalf}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <Text style={styles.fieldLabel}>Patient Name</Text>
            <Text style={styles.fieldValue}>{patientName}</Text>
            <Text style={styles.fieldLabel}>Report Type</Text>
            <Text style={styles.fieldValue}>
              {report.upload_type === "xray" ? "X-Ray / Medical Scan" : "Lab Report"}
            </Text>
            <Text style={styles.fieldLabel}>Date Generated</Text>
            <Text style={styles.fieldValue}>{formatDate(report.created_at)}</Text>
          </View>
          <View style={styles.colHalf}>
            <Text style={styles.sectionTitle}>Report Details</Text>
            <Text style={styles.fieldLabel}>Status</Text>
            <Text style={styles.fieldValue}>{report.status}</Text>
            <Text style={styles.fieldLabel}>Doctor</Text>
            <Text style={styles.fieldValue}>{doctorName}</Text>
            {report.reviewed_at && (
              <>
                <Text style={styles.fieldLabel}>Review Date</Text>
                <Text style={styles.fieldValue}>
                  {formatDate(report.reviewed_at)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* AI FINDINGS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Findings</Text>
          <View style={styles.findingBox}>
            {xrayFindings ? (
              <>
                <Text style={styles.predictionText}>
                  {xrayFindings.prediction}
                </Text>
                <Text style={styles.confidenceText}>
                  Confidence: {(xrayFindings.confidence * 100).toFixed(1)}%
                </Text>
                <Text style={styles.summaryText}>{xrayFindings.summary}</Text>
              </>
            ) : labFindings ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableCellHeader}>Marker</Text>
                  <Text style={styles.tableCellHeader}>Value</Text>
                  <Text style={styles.tableCellHeader}>Unit</Text>
                  <Text style={styles.tableCellHeader}>Status</Text>
                </View>
                {labFindings.findings.map((f, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{f.marker}</Text>
                    <Text style={styles.tableCell}>{String(f.value)}</Text>
                    <Text style={styles.tableCell}>{f.unit}</Text>
                    <Text
                      style={[styles.tableCell, getLabStatusStyle(f.status)]}
                    >
                      {f.status}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.summaryText}>No AI findings available.</Text>
            )}
          </View>
        </View>

        {/* DOCTOR NOTES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"Physician's Notes"}</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>
              {report.doctor_notes ?? "No notes provided."}
            </Text>
          </View>
        </View>

        {/* SIGNATURE */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureText}>
            Digitally reviewed by: {doctorName}
          </Text>
          {report.reviewed_at && (
            <Text style={styles.signatureText}>
              Review timestamp: {formatDate(report.reviewed_at)}
            </Text>
          )}
          {report.doctor?.pmdc_number && (
            <Text style={styles.signatureText}>
              PMDC Number: {report.doctor.pmdc_number}
            </Text>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This report was generated with AI assistance and reviewed by a
            licensed physician. Not a substitute for clinical consultation.
          </Text>
          <Text style={styles.footerText}>
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
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
