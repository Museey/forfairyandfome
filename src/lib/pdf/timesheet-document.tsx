import { Document, Page, View, StyleSheet } from "@react-pdf/renderer";
import { SafeText as Text } from "@/lib/pdf/safe-text";
import { formatBaht, formatMonthLabelBuddhist } from "@/lib/document";
import {
  formatHours,
  rowHours,
  timesheetTotals,
  type TimesheetRow,
} from "@/lib/payroll";

const INK = "#16213E";
const MUTED = "#6B7280";
const ACCENT = "#0E7C6B";
const BORDER = "#D9DEE7";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9.5,
    fontFamily: "Sarabun",
    color: INK,
    lineHeight: 1.5,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    color: ACCENT,
    fontWeight: "bold",
    lineHeight: 1.4,
  },
  meta: { fontSize: 9.5, color: MUTED, marginTop: 2 },
  metaRight: { fontSize: 9.5, color: MUTED, textAlign: "right" },
  infoBlock: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginBottom: 16,
  },
  infoLine: { fontSize: 9, color: MUTED },
  infoName: { fontSize: 10.5, fontWeight: "bold", marginBottom: 2 },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerCell: { fontSize: 9, fontWeight: "bold", color: ACCENT },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  colDate: { width: 78 },
  colTask: { flex: 1, paddingRight: 10 },
  colTime: { width: 58, textAlign: "center" },
  colTotal: { width: 58, textAlign: "right" },
  totalsBlock: { alignSelf: "flex-end", width: 220, marginTop: 12 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalsLabel: { color: MUTED },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  netLabel: { fontSize: 12, fontWeight: "bold", color: ACCENT },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 48,
  },
  signatureBlock: { width: 200 },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: MUTED,
    marginTop: 24,
    paddingTop: 4,
    fontSize: 8.5,
    color: MUTED,
    textAlign: "center",
  },
});

export type TimesheetPdfData = {
  docNumber: string;
  periodYear: number;
  periodMonth: number;
  employeeName: string;
  position: string | null;
  rows: TimesheetRow[];
  ratePerHour: number | null;
  employer: { name: string } | null;
};

/** "12/09/2026" — the sample timesheet dates rows numerically, not in Thai. */
function formatRowDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date || "-";
  return `${day}/${month}/${year}`;
}

export function TimesheetPdf({
  docNumber,
  periodYear,
  periodMonth,
  employeeName,
  position,
  rows,
  ratePerHour,
  employer,
}: TimesheetPdfData) {
  const totals = timesheetTotals(rows, ratePerHour);

  return (
    <Document title={`Time sheet ${docNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Time sheet</Text>
            <Text style={styles.meta}>เลขที่ {docNumber}</Text>
          </View>
          <Text style={styles.metaRight}>
            รอบเดือน {formatMonthLabelBuddhist(periodYear, periodMonth)}
          </Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoName}>{employeeName}</Text>
          {position && <Text style={styles.infoLine}>ตำแหน่ง {position}</Text>}
          {employer?.name && <Text style={styles.infoLine}>{employer.name}</Text>}
        </View>

        <View>
          <View style={styles.headerRow} fixed>
            <Text style={[styles.headerCell, styles.colDate]}>วันที่</Text>
            <Text style={[styles.headerCell, styles.colTask]}>งาน</Text>
            <Text style={[styles.headerCell, styles.colTime]}>เข้า</Text>
            <Text style={[styles.headerCell, styles.colTime]}>ออก</Text>
            <Text style={[styles.headerCell, styles.colTotal]}>รวม</Text>
          </View>
          {rows.map((row, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={styles.colDate}>{formatRowDate(row.date)}</Text>
              <Text style={styles.colTask}>{row.task}</Text>
              <Text style={styles.colTime}>{row.start || "-"}</Text>
              <Text style={styles.colTime}>{row.end || "-"}</Text>
              <Text style={styles.colTotal}>{formatHours(rowHours(row))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>ชั่วโมงรวม</Text>
            <Text>{formatHours(totals.totalHours)}</Text>
          </View>
          {ratePerHour !== null && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>ค่าแรงต่อชั่วโมง</Text>
              <Text>{formatBaht(ratePerHour)}</Text>
            </View>
          )}
          {totals.totalPay !== null && (
            <View style={styles.netRow}>
              <Text style={styles.netLabel}>ค่าแรงรวม</Text>
              <Text style={styles.netLabel}>{formatBaht(totals.totalPay)}</Text>
            </View>
          )}
        </View>

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>ผู้จัดทำ</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>ผู้อนุมัติ</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
