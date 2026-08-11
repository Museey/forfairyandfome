import Link from "next/link";
import { headers } from "next/headers";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { saveSellerProfile } from "@/app/(app)/settings/actions";
import { requireCurrentUser } from "@/lib/auth";
import { getOrCreateCalendarToken } from "@/lib/calendar-token";
import { CalendarSubscribeLink } from "@/components/calendar-subscribe-link";
import { NotificationSettings } from "@/components/notification-settings";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const [profile, calendarToken, headerList] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { id: 1 } }),
    getOrCreateCalendarToken(user.id),
    headers(),
  ]);

  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const calendarUrl = `${protocol}://${host}/api/calendar/${calendarToken}/feed.ics`;

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2 pb-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-muted">
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div>
        <h1 className="text-xl font-semibold">ตั้งค่า</h1>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-muted">
          การแจ้งเตือน
        </h2>
        <NotificationSettings
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
        />
      </section>

      <div className="border-t border-border" />

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-muted">
          Sync ปฏิทินกับ iPhone
        </h2>
        <CalendarSubscribeLink url={calendarUrl} />
      </section>

      <div className="border-t border-border" />

      <div>
        <h2 className="text-sm font-medium text-text-muted">ข้อมูลผู้ให้บริการ</h2>
        <p className="mt-1 text-xs text-text-faint">
          ข้อมูลนี้จะแสดงในใบเสนอราคา / ใบแจ้งหนี้ / ใบเสร็จ ทุกใบ
        </p>
      </div>

      <form action={saveSellerProfile} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">ชื่อ-นามสกุล</Label>
          <Input id="name" name="name" defaultValue={profile?.name ?? ""} required />
        </div>
        <div>
          <Label htmlFor="address">ที่อยู่</Label>
          <Input id="address" name="address" defaultValue={profile?.address ?? ""} required />
        </div>
        <div>
          <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
          <Input id="taxId" name="taxId" defaultValue={profile?.taxId ?? ""} required />
        </div>
        <div>
          <Label htmlFor="contactName">ชื่อผู้ติดต่อ</Label>
          <Input id="contactName" name="contactName" defaultValue={profile?.contactName ?? ""} />
        </div>
        <div>
          <Label htmlFor="phone">เบอร์โทร</Label>
          <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">อีเมล</Label>
          <Input id="email" name="email" type="email" defaultValue={profile?.email ?? ""} />
        </div>

        <div className="mt-2 border-t border-border pt-4">
          <h2 className="mb-3 text-sm font-medium text-text-muted">ข้อมูลการชำระเงิน</h2>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="bankName">ธนาคาร</Label>
              <Input id="bankName" name="bankName" defaultValue={profile?.bankName ?? ""} />
            </div>
            <div>
              <Label htmlFor="bankAccountNo">เลขบัญชี</Label>
              <Input id="bankAccountNo" name="bankAccountNo" defaultValue={profile?.bankAccountNo ?? ""} />
            </div>
            <div>
              <Label htmlFor="bankAccountName">ชื่อบัญชี</Label>
              <Input id="bankAccountName" name="bankAccountName" defaultValue={profile?.bankAccountName ?? ""} />
            </div>
            <div>
              <Label htmlFor="branch">สาขา</Label>
              <Input id="branch" name="branch" defaultValue={profile?.branch ?? ""} />
            </div>
          </div>
        </div>

        <Button type="submit" className="mt-2">
          บันทึกข้อมูล
        </Button>
      </form>
    </div>
  );
}
