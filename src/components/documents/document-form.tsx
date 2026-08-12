"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { VAT_PERCENT, computeTotals, formatBaht, type LineItem } from "@/lib/document";
import { DOCUMENT_TYPE_LABEL, DOCUMENT_TYPE_ORDER } from "@/lib/document";
import { createDocument, updateDocument } from "@/app/(app)/jobs/[id]/document-actions";
import type { DocumentType } from "@/generated/prisma/enums";

function emptyLineItem(): LineItem {
  return { description: "", amount: 0 };
}

export type ExistingDocument = {
  id: string;
  type: DocumentType;
  issueDate: Date;
  buyerName: string;
  buyerAddress: string | null;
  buyerTaxId: string | null;
  buyerContactName: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  withholdingTaxPercent: number;
  lineItems: LineItem[];
};

export function DocumentForm({
  jobId,
  existingDocument,
}: {
  jobId: string;
  existingDocument?: ExistingDocument;
}) {
  const isEdit = !!existingDocument;
  const [type, setType] = useState<string>(existingDocument?.type ?? "QUOTATION");
  const [items, setItems] = useState<LineItem[]>(
    existingDocument && existingDocument.lineItems.length > 0
      ? existingDocument.lineItems
      : [emptyLineItem()],
  );
  const [withholdingTaxPercent, setWithholdingTaxPercent] = useState(
    existingDocument?.withholdingTaxPercent ?? 3,
  );

  const totals = useMemo(
    () => computeTotals(items, withholdingTaxPercent),
    [items, withholdingTaxPercent],
  );

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === "amount" ? Number(value) || 0 : value }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form
      action={isEdit ? updateDocument : createDocument}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="lineItems" value={JSON.stringify(items)} />
      {isEdit && <input type="hidden" name="docId" value={existingDocument.id} />}

      <div>
        <Label htmlFor="type">ประเภทเอกสาร</Label>
        {isEdit ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-muted">
            {DOCUMENT_TYPE_LABEL[type as DocumentType]}
            <span className="ml-2 text-xs text-text-faint">
              (เปลี่ยนประเภทไม่ได้ — ใช้ &quot;สร้างเป็น...&quot; แทน)
            </span>
          </p>
        ) : (
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {DOCUMENT_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div>
        <Label htmlFor="issueDate">วันที่ออกเอกสาร</Label>
        <Input
          id="issueDate"
          name="issueDate"
          type="date"
          defaultValue={
            existingDocument
              ? existingDocument.issueDate.toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10)
          }
        />
      </div>

      <div className="border-t border-border pt-4">
        <h2 className="mb-3 text-sm font-medium text-text-muted">ข้อมูลผู้ซื้อ / ลูกค้า</h2>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="buyerName">ชื่อบริษัท / ชื่อลูกค้า</Label>
            <Input
              id="buyerName"
              name="buyerName"
              defaultValue={existingDocument?.buyerName}
              required
            />
          </div>
          <div>
            <Label htmlFor="buyerAddress">ที่อยู่</Label>
            <Textarea
              id="buyerAddress"
              name="buyerAddress"
              rows={2}
              defaultValue={existingDocument?.buyerAddress ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="buyerTaxId">เลขประจำตัวผู้เสียภาษี</Label>
            <Input
              id="buyerTaxId"
              name="buyerTaxId"
              defaultValue={existingDocument?.buyerTaxId ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="buyerContactName">ผู้ติดต่อ</Label>
            <Input
              id="buyerContactName"
              name="buyerContactName"
              defaultValue={existingDocument?.buyerContactName ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="buyerPhone">เบอร์โทร</Label>
            <Input
              id="buyerPhone"
              name="buyerPhone"
              defaultValue={existingDocument?.buyerPhone ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="buyerEmail">อีเมล</Label>
            <Input
              id="buyerEmail"
              name="buyerEmail"
              type="email"
              defaultValue={existingDocument?.buyerEmail ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h2 className="mb-3 text-sm font-medium text-text-muted">รายการ</h2>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-card border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-text-faint">รายการที่ {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-text-faint transition active:text-danger"
                  aria-label="ลบรายการ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                rows={3}
                placeholder="รายละเอียดงาน เช่น รีวิวสินค้า...&#10;SOW : 1 x VDO on TikTok..."
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                className="mb-2"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="จำนวนเงิน (บาท)"
                value={item.amount || ""}
                onChange={(e) => updateItem(i, "amount", e.target.value)}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-border-strong py-2.5 text-sm text-text-muted transition active:bg-card"
        >
          <Plus className="h-4 w-4" />
          เพิ่มรายการ
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <Label htmlFor="withholdingTaxPercent">หัก ณ ที่จ่าย (%)</Label>
        <Input
          id="withholdingTaxPercent"
          name="withholdingTaxPercent"
          type="number"
          step="0.1"
          value={withholdingTaxPercent}
          onChange={(e) => setWithholdingTaxPercent(Number(e.target.value) || 0)}
        />
      </div>

      <div className="rounded-card border border-border bg-card p-4 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>รวมเป็นเงิน</span>
          <span>{formatBaht(totals.subtotal)}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-text-muted">
          <span>ภาษีมูลค่าเพิ่ม (VAT {VAT_PERCENT}%)</span>
          <span>+{formatBaht(totals.vat)}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-text-muted">
          <span>หัก ณ ที่จ่าย ({withholdingTaxPercent}%)</span>
          <span>-{formatBaht(totals.withholdingTax)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-teal">
          <span>ยอดรวม</span>
          <span>{formatBaht(totals.net)}</span>
        </div>
      </div>

      <Button type="submit" className="mt-1">
        {isEdit ? "บันทึกการแก้ไข" : "สร้างเอกสาร"}
      </Button>
    </form>
  );
}
