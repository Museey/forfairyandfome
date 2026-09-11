import { Document, Page, View, StyleSheet } from "@react-pdf/renderer";
import { SafeText as Text } from "@/lib/pdf/safe-text";
import {
  formatBaht,
  formatMonthLabelBuddhist,
  formatThaiBuddhistDate,
  type LineItem,
} from "@/lib/document";
import { payslipTotals } from "@/lib/payroll";

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
    // Thai tone marks sit above the cap height; without room they collide
    // with the line underneath.
    lineHeight: 1.4,
  },
  meta: { fontSize: 9.5, color: MUTED, marginTop: 2 },
  metaRight: { fontSize: 9.5, color: MUTED, textAlign: "right" },
  partiesRow: { flexDirection: "row", marginBottom: 18 },
  partyBlock: { width: "48%" },
  partyBlockSpacer: { width: "4%" },
  partyLabel: { fontSize: 8.5, color: MUTED, marginBottom: 3 },
  partyName: { fontSize: 10.5, fontWeight: "bold", marginBottom: 2 },
  partyLine: { fontSize: 9, color: MUTED, marginBottom: 1 },
  columnsRow: { flexDirection: "row" },
  column: { flex: 1 },
  columnSpacer: { width: 18 },
  columnHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: ACCENT,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rowLabel: { flex: 1, paddingRight: 8 },
  rowAmount: { width: 74, textAlign: "right" },
  columnTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  columnTotalLabel: { color: MUTED },
  netBlock: {
    alignSelf: "flex-end",
    width: 240,
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  netLabel: { fontSize: 12, fontWeight: "bold", color: ACCENT },
  noteTitle: { fontSize: 9.5, fontWeight: "bold", marginTop: 28, marginBottom: 3 },
  note: { fontSize: 9, color: MUTED },
  signatureBlock: { width: 200, alignSelf: "flex-end", marginTop: 48 },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: MUTED,
    marginTop: 24,
    paddingTop: 4,
    fontSize: 8.5,
    color: MUTED,
    textAlign: "center",
  },
  footer: {
    marginTop: 28,
    fontSize: 7.5,
    color: MUTED,
    textAlign: "center",
  },
});

export type PayslipPdfData = {
  docNumber: string;
  periodYear: number;
  periodMonth: number;
  paymentDate: Date;
  employeeName: string;
  position: string | null;
  earnings: LineItem[];
  deductions: LineItem[];
  note: string | null;
  employer: { name: string; address: string; taxId: string } | null;
};

function Column({
  heading,
  items,
  total,
  totalLabel,
}: {
  heading: string;
  items: LineItem[];
  total: number;
  totalLabel: string;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnHeader}>{heading}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.row} wrap={false}>
          <Text style={styles.rowLabel}>{item.description}</Text>
          <Text style={styles.rowAmount}>{formatBaht(item.amount)}</Text>
        </View>
      ))}
      <View style={styles.columnTotal}>
        <Text style={styles.columnTotalLabel}>{totalLabel}</Text>
        <Text style={styles.rowAmount}>{formatBaht(total)}</Text>
      </View>
    </View>
  );
}

export function PayslipPdf({
  docNumber,
  periodYear,
  periodMonth,
  paymentDate,
  employeeName,
  position,
  earnings,
  deductions,
  note,
  employer,
}: PayslipPdfData) {
  const totals = payslipTotals(earnings, deductions);

  return (
    <Document title={`สลิปเงินเดือน ${docNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>สลิปเงินเดือน / Pay Slip</Text>
            <Text style={styles.meta}>เลขที่ {docNumber}</Text>
          </View>
          <View>
            <Text style={styles.metaRight}>
              รอบเงินเดือน {formatMonthLabelBuddhist(periodYear, periodMonth)}
            </Text>
            <Text style={styles.metaRight}>
              วันที่จ่าย {formatThaiBuddhistDate(paymentDate)}
            </Text>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>ข้อมูลบริษัท</Text>
            <Text style={styles.partyName}>{employer?.name ?? "-"}</Text>
            {employer?.address && (
              <Text style={styles.partyLine}>{employer.address}</Text>
            )}
            {employer?.taxId && (
              <Text style={styles.partyLine}>
                เลขประจำตัวผู้เสียภาษี {employer.taxId}
              </Text>
            )}
          </View>

          <View style={styles.partyBlockSpacer} />

          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>ข้อมูลพนักงาน</Text>
            <Text style={styles.partyName}>{employeeName}</Text>
            {position && <Text style={styles.partyLine}>ตำแหน่ง {position}</Text>}
          </View>
        </View>

        <View style={styles.columnsRow}>
          <Column
            heading="เงินได้"
            items={earnings}
            total={totals.totalEarnings}
            totalLabel="รวมเงินได้"
          />
          <View style={styles.columnSpacer} />
          <Column
            heading="รายการหัก"
            items={deductions}
            total={totals.totalDeductions}
            totalLabel="รวมรายการหัก"
          />
        </View>

        <View style={styles.netBlock}>
          <Text style={styles.netLabel}>เงินได้สุทธิ</Text>
          <Text style={styles.netLabel}>{formatBaht(totals.net)}</Text>
        </View>

        {note && (
          <View>
            <Text style={styles.noteTitle}>หมายเหตุ</Text>
            <Text style={styles.note}>{note}</Text>
          </View>
        )}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>ลายเซ็นผู้จ่ายเงิน</Text>
        </View>

        <Text style={styles.footer}>
          ข้อมูลเงินเดือนและค่าจ้างเป็นข้อมูลส่วนบุคคล ห้ามเปิดเผยโดยเด็ดขาด
        </Text>
      </Page>
    </Document>
  );
}
