import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentType } from "@/generated/prisma/enums";
import { DOCUMENT_TYPE_LABEL, VAT_PERCENT, computeTotals, formatBaht, formatThaiBuddhistDate, type LineItem } from "@/lib/document";

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
  },
  date: {
    fontSize: 9.5,
    color: MUTED,
    marginTop: 4,
  },
  partiesRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  partyBlock: {
    width: "48%",
  },
  partyBlockSpacer: {
    width: "4%",
  },
  partyLabel: {
    fontSize: 8.5,
    color: MUTED,
    marginBottom: 3,
  },
  partyName: {
    fontSize: 10.5,
    fontWeight: "bold",
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 1,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableHeaderCell: {
    fontSize: 9,
    color: ACCENT,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  colDesc: {
    flex: 1,
    paddingRight: 12,
  },
  colAmount: {
    width: 90,
    textAlign: "right",
  },
  totalsBlock: {
    alignSelf: "flex-end",
    width: 220,
    marginTop: 10,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalsLabel: {
    color: MUTED,
  },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  netLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: ACCENT,
  },
  netValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: ACCENT,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 36,
  },
  paymentBlock: {
    width: 240,
  },
  paymentTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    marginBottom: 4,
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 48,
  },
  signatureBlock: {
    width: 200,
  },
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

export type DocumentPdfData = {
  type: DocumentType;
  docNumber: string;
  issueDate: Date;
  seller: {
    name: string;
    address: string;
    taxId: string;
    contactName: string;
    phone: string;
    email: string;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    branch: string;
  } | null;
  buyer: {
    name: string;
    address: string | null;
    taxId: string | null;
    contactName: string | null;
    phone: string | null;
    email: string | null;
  };
  lineItems: LineItem[];
  withholdingTaxPercent: number;
};

export function DocumentPdf({
  type,
  issueDate,
  seller,
  buyer,
  lineItems,
  withholdingTaxPercent,
}: DocumentPdfData) {
  const totals = computeTotals(lineItems, withholdingTaxPercent);

  return (
    <Document title={DOCUMENT_TYPE_LABEL[type]}>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{DOCUMENT_TYPE_LABEL[type]}</Text>
          <Text style={styles.date}>{formatThaiBuddhistDate(issueDate)}</Text>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>ผู้ขาย</Text>
            <Text style={styles.partyName}>{seller?.name ?? "-"}</Text>
            {seller?.address && <Text style={styles.partyLine}>{seller.address}</Text>}
            {seller?.taxId && (
              <Text style={styles.partyLine}>เลขประจำตัวผู้เสียภาษี {seller.taxId}</Text>
            )}
            {seller?.phone && <Text style={styles.partyLine}>โทร {seller.phone}</Text>}
            {seller?.email && <Text style={styles.partyLine}>{seller.email}</Text>}
          </View>

          <View style={styles.partyBlockSpacer} />

          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>ผู้ซื้อ</Text>
            <Text style={styles.partyName}>{buyer.name}</Text>
            {buyer.address && <Text style={styles.partyLine}>{buyer.address}</Text>}
            {buyer.taxId && <Text style={styles.partyLine}>Tax ID {buyer.taxId}</Text>}
            {buyer.contactName && (
              <Text style={styles.partyLine}>ผู้ติดต่อ {buyer.contactName}</Text>
            )}
            {buyer.phone && <Text style={styles.partyLine}>โทร {buyer.phone}</Text>}
            {buyer.email && <Text style={styles.partyLine}>{buyer.email}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>รายการ</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>รวมเป็นเงิน</Text>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow} wrap={false}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colAmount}>{formatBaht(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>รวมเป็นเงิน</Text>
            <Text>{formatBaht(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>ภาษีมูลค่าเพิ่ม (VAT {VAT_PERCENT}%)</Text>
            <Text>+{formatBaht(totals.vat)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>หัก ณ ที่จ่าย ({withholdingTaxPercent}%)</Text>
            <Text>-{formatBaht(totals.withholdingTax)}</Text>
          </View>
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>ยอดรวม</Text>
            <Text style={styles.netValue}>{formatBaht(totals.net)}</Text>
          </View>
        </View>

        {seller?.bankName && (
          <View style={styles.bottomRow}>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentTitle}>ข้อมูลการชำระเงิน</Text>
              <Text style={styles.partyLine}>ธนาคาร{seller.bankName}</Text>
              <Text style={styles.partyLine}>เลขบัญชี {seller.bankAccountNo}</Text>
              <Text style={styles.partyLine}>ชื่อบัญชี {seller.bankAccountName}</Text>
              {seller.branch && <Text style={styles.partyLine}>สาขา{seller.branch}</Text>}
            </View>
          </View>
        )}

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>ผู้รับเงิน</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>ผู้จ่ายเงิน</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
