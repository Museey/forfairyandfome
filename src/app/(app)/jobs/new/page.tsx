import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createJob } from "@/app/(app)/jobs/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { JobKindPicker } from "@/components/job-kind-picker";
import { formatJobMonth, nextJobMonthlySeq } from "@/lib/job-number";

export default async function NewJobPage() {
  const now = new Date();
  const monthlySeq = await nextJobMonthlySeq(now);

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div>
        <h1 className="text-xl font-semibold">งานใหม่</h1>
        <p className="mt-1 text-sm text-text-muted">
          งานที่ {monthlySeq} ของเดือน {formatJobMonth(now)}
        </p>
      </div>

      <form action={createJob} className="flex flex-col gap-4">
        <div>
          <Label>ประเภทงาน</Label>
          <JobKindPicker />
        </div>
        <div>
          <Label htmlFor="title">ชื่องาน</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="เช่น Harvest Snaps - Supreme Cheese"
          />
        </div>
        <div>
          <Label htmlFor="brandName">แบรนด์</Label>
          <Input id="brandName" name="brandName" required placeholder="เช่น Harvest Snaps" />
        </div>
        <div>
          <Label htmlFor="productName">สินค้า (ถ้ามี)</Label>
          <Input
            id="productName"
            name="productName"
            placeholder="เช่น Supreme Cheese Flavour"
          />
        </div>

        <Button type="submit" className="mt-2 w-full">
          สร้างงาน
        </Button>
      </form>
    </div>
  );
}
