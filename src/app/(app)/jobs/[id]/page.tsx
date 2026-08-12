import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileDown, MessageSquareText, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TabBar } from "@/components/tab-bar";
import { StatusSelect } from "@/components/status-select";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { updateJobDates, updateJobInfo } from "@/app/(app)/jobs/actions";
import {
  addBriefItem,
  addTimelinePost,
  deleteBriefItem,
  deleteTimelinePost,
} from "@/app/(app)/jobs/[id]/timeline-actions";
import { JOB_DATE_FIELDS } from "@/lib/job-dates";
import { toDateInputValue } from "@/lib/date";
import { Composer } from "@/components/timeline/composer";
import { PostItem } from "@/components/timeline/post-item";
import { groupFeedRows } from "@/lib/feed";
import { StorylineEditor } from "@/components/storyline/editor";
import {
  addStorylineRevision,
  deleteStorylineRevision,
} from "@/app/(app)/jobs/[id]/storyline-actions";
import { parseScenes } from "@/lib/storyline";
import { saveDetailsOfWork } from "@/app/(app)/jobs/[id]/details-of-work-actions";
import { ProductImageGallery } from "@/components/details-of-work/product-image-gallery";
import { Textarea } from "@/components/ui/field";
import {
  DOCUMENT_STATUS_COLOR,
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_TYPE_LABEL,
  computeTotals,
  formatBaht,
  parseLineItems,
} from "@/lib/document";
import { DeleteJobButton } from "@/components/delete-job-button";

const TABS = [
  { key: "timeline", label: "ไทม์ไลน์" },
  { key: "storyline", label: "Storyline" },
  { key: "work", label: "Details of Work" },
  { key: "documents", label: "เอกสาร" },
  { key: "info", label: "ข้อมูลงาน" },
];

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "timeline";

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) notFound();

  const [briefItems, timelinePosts] =
    tab === "timeline"
      ? await Promise.all([
          prisma.briefItem.findMany({
            where: { jobId: id, context: "BRIEF" },
            include: { author: true },
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          }),
          prisma.timelinePost.findMany({
            where: { jobId: id },
            include: { author: true },
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          }),
        ])
      : [[], []];

  const storyline =
    tab === "storyline" || tab === "work"
      ? await prisma.storyline.findUnique({ where: { jobId: id } })
      : null;

  const storylineRevisions =
    tab === "storyline"
      ? await prisma.briefItem.findMany({
          where: { jobId: id, context: "STORYLINE" },
          include: { author: true },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        })
      : [];

  const detailsOfWork =
    tab === "work"
      ? await prisma.detailsOfWork.findUnique({ where: { jobId: id } })
      : null;

  const documents =
    tab === "documents"
      ? await prisma.document.findMany({
          where: { jobId: id },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const briefFeed = groupFeedRows(
    briefItems.map((b) => ({
      id: b.id,
      groupId: b.groupId,
      type: b.type,
      body: b.content,
      attachmentUrl: b.type === "LINK" ? null : b.fileUrl,
      linkUrl: b.type === "LINK" ? b.fileUrl : null,
      createdAt: b.createdAt,
      author: b.author,
    })),
  );

  const timelineFeed = groupFeedRows(
    timelinePosts.map((p) => ({
      id: p.id,
      groupId: p.groupId,
      type: p.type,
      body: p.body,
      attachmentUrl: p.attachmentUrl,
      linkUrl: p.linkUrl,
      createdAt: p.createdAt,
      author: p.author,
    })),
  );

  const storylineRevisionFeed = groupFeedRows(
    storylineRevisions.map((b) => ({
      id: b.id,
      groupId: b.groupId,
      type: b.type,
      body: b.content,
      attachmentUrl: b.type === "LINK" ? null : b.fileUrl,
      linkUrl: b.type === "LINK" ? b.fileUrl : null,
      createdAt: b.createdAt,
      author: b.author,
    })),
  );

  return (
    <div className="flex flex-1 flex-col gap-4 pt-2">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        งานทั้งหมด
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-text-muted">
            {job.brandName}
            {job.productName ? ` · ${job.productName}` : ""}
          </p>
          <h1 className="mt-0.5 truncate text-xl font-semibold">
            {job.title}
          </h1>
        </div>
        <StatusPill status={job.status} className="mt-1 shrink-0" />
      </div>

      <TabBar basePath={`/jobs/${job.id}`} active={tab} tabs={TABS} />

      {tab === "timeline" && (
        <div className="flex flex-col gap-6 pb-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-muted">
              บรีฟจากลูกค้า
            </h2>
            <Composer
              jobId={job.id}
              action={addBriefItem}
              placeholder="แปะบรีฟจากลูกค้า (text / รูป / ลิงก์)"
            />
            {briefFeed.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {briefFeed.map((item) => (
                  <PostItem
                    key={item.id}
                    item={item}
                    jobId={job.id}
                    onDelete={deleteBriefItem}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="border-t border-border" />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-muted">
              ไทม์ไลน์งาน
            </h2>
            <Composer
              jobId={job.id}
              action={addTimelinePost}
              placeholder="อัปเดตความคืบหน้างานนี้..."
            />
            {timelineFeed.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-faint">
                ยังไม่มีความเคลื่อนไหวในงานนี้
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {timelineFeed.map((item) => (
                  <PostItem
                    key={item.id}
                    item={item}
                    jobId={job.id}
                    onDelete={item.isSystem ? undefined : deleteTimelinePost}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "storyline" && (
        <div className="flex flex-col gap-6 pb-6">
          <a
            href="#storyline-revisions"
            className="inline-flex items-center gap-1.5 self-start rounded-pill border border-border bg-card px-3 py-1.5 text-xs text-teal"
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            ไปที่การแก้ไขจากลูกค้า
          </a>

          <StorylineEditor
            jobId={job.id}
            initialScenes={parseScenes(storyline?.scenes ?? [])}
            status={storyline?.status ?? "DRAFT"}
            sentAt={storyline?.sentAt ?? null}
            approvedAt={storyline?.approvedAt ?? null}
          />

          <div className="border-t border-border" />

          <section id="storyline-revisions" className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-medium text-text-muted">
                การแก้ไขจากลูกค้า
              </h2>
              <p className="text-xs text-text-faint">
                แปะสิ่งที่ลูกค้าส่งกลับมา (text / รูป / ไฟล์ / ลิงก์) เพื่อคุยกันว่าจะใช้อันไหน
              </p>
            </div>
            <Composer
              jobId={job.id}
              action={addStorylineRevision}
              placeholder="แปะการแก้ไขจากลูกค้า (text / รูป / ไฟล์ / ลิงก์)"
            />
            {storylineRevisionFeed.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {storylineRevisionFeed.map((item) => (
                  <PostItem
                    key={item.id}
                    item={item}
                    jobId={job.id}
                    onDelete={deleteStorylineRevision}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "work" && (
        <div className="flex flex-col gap-6 pb-6">
          <a
            href={`/api/details-of-work/${job.id}/pdf`}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-teal/40 bg-teal-soft px-4 py-3 text-sm font-medium text-teal"
          >
            <FileDown className="h-4 w-4" />
            ส่งออก PDF
          </a>

          <form
            action={saveDetailsOfWork}
            className="flex flex-col gap-5"
          >
            <input type="hidden" name="jobId" value={job.id} />

            <div>
              <Label htmlFor="sow">Work Details (SOW)</Label>
              <Textarea
                id="sow"
                name="sow"
                rows={2}
                defaultValue={detailsOfWork?.sow ?? ""}
                placeholder="ขอบเขตงาน เช่น 1 VDO on TikTok..."
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={detailsOfWork?.location ?? ""}
              />
            </div>

            <div>
              <Label>Customer Details</Label>
              <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                <p>
                  <span className="text-text-faint">แบรนด์: </span>
                  {job.brandName}
                </p>
                <p className="mt-1">
                  <span className="text-text-faint">สินค้า: </span>
                  {job.productName || "-"}
                </p>
                <Link
                  href={`/jobs/${job.id}?tab=info`}
                  className="mt-2 inline-block text-xs text-teal"
                >
                  แก้ไขในแท็บ &quot;ข้อมูลงาน&quot;
                </Link>
              </div>
            </div>

            <div>
              <Label htmlFor="keyMessage">Key Message / Required (1 บรรทัด = 1 ข้อ)</Label>
              <Textarea
                id="keyMessage"
                name="keyMessage"
                rows={4}
                defaultValue={
                  Array.isArray(detailsOfWork?.keyMessage)
                    ? (detailsOfWork.keyMessage as string[]).join("\n")
                    : ""
                }
              />
            </div>

            <div>
              <Label htmlFor="doList">Do (1 บรรทัด = 1 ข้อ)</Label>
              <Textarea
                id="doList"
                name="doList"
                rows={4}
                defaultValue={
                  Array.isArray(detailsOfWork?.doList)
                    ? (detailsOfWork.doList as string[]).join("\n")
                    : ""
                }
              />
            </div>

            <div>
              <Label htmlFor="dontList">Don&apos;t (1 บรรทัด = 1 ข้อ)</Label>
              <Textarea
                id="dontList"
                name="dontList"
                rows={4}
                defaultValue={
                  Array.isArray(detailsOfWork?.dontList)
                    ? (detailsOfWork.dontList as string[]).join("\n")
                    : ""
                }
              />
            </div>

            <div>
              <Label htmlFor="moodTone">Mood & Tone</Label>
              <Input
                id="moodTone"
                name="moodTone"
                defaultValue={detailsOfWork?.moodTone ?? ""}
              />
            </div>

            <div>
              <Label htmlFor="dressCode">Dress Code</Label>
              <Input
                id="dressCode"
                name="dressCode"
                defaultValue={detailsOfWork?.dressCode ?? ""}
              />
            </div>

            <div>
              <Label htmlFor="hashtags">Captions / Hashtags</Label>
              <Input
                id="hashtags"
                name="hashtags"
                defaultValue={detailsOfWork?.hashtags ?? ""}
              />
            </div>

            <div>
              <Label htmlFor="otherNotes">Other</Label>
              <Textarea
                id="otherNotes"
                name="otherNotes"
                rows={2}
                defaultValue={detailsOfWork?.otherNotes ?? ""}
              />
            </div>

            <Button type="submit" variant="secondary">
              บันทึก Details of Work
            </Button>
          </form>

          <section>
            <Label>Product Details (รูปสินค้า)</Label>
            <ProductImageGallery
              jobId={job.id}
              images={
                Array.isArray(detailsOfWork?.productImages)
                  ? (detailsOfWork.productImages as string[])
                  : []
              }
            />
          </section>

          {storyline?.status === "APPROVED" && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-text-muted">
                Storyline Approved
              </h2>
              <p className="text-xs text-text-faint">
                ดึงจาก Storyline ที่ลูกค้าอนุมัติแล้วอัตโนมัติ จะรวมอยู่ใน PDF
                ที่ export ด้วย
              </p>
            </section>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="flex flex-col gap-3 pb-6">
          <Link href={`/jobs/${job.id}/documents/new`}>
            <Button size="sm" className="w-full">
              <Plus className="h-4 w-4" />
              สร้างเอกสาร
            </Button>
          </Link>

          {documents.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-faint">
              ยังไม่มีเอกสารสำหรับงานนี้
            </p>
          ) : (
            documents.map((doc) => {
              const totals = computeTotals(
                parseLineItems(doc.lineItems),
                doc.withholdingTaxPercent,
              );
              return (
                <Link
                  key={doc.id}
                  href={`/jobs/${job.id}/documents/${doc.id}`}
                  className="rounded-card border border-border bg-card p-4 transition active:scale-[0.99] active:bg-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {DOCUMENT_TYPE_LABEL[doc.type]}
                      </p>
                      <p className="mt-0.5 text-xs text-text-faint">
                        {doc.docNumber} · {doc.buyerName}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${DOCUMENT_STATUS_COLOR[doc.status]}22`,
                        color: DOCUMENT_STATUS_COLOR[doc.status],
                      }}
                    >
                      {DOCUMENT_STATUS_LABEL[doc.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold text-teal">
                    {formatBaht(totals.net)}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      )}

      {tab === "info" && (
        <div className="flex flex-col gap-6 pb-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-text-muted">
              สถานะงาน
            </h2>
            <StatusSelect jobId={job.id} status={job.status} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-text-muted">
              วันที่สำคัญ
            </h2>
            <form
              action={updateJobDates}
              className="flex flex-col gap-3 rounded-card border border-border bg-card p-4"
            >
              <input type="hidden" name="jobId" value={job.id} />
              {JOB_DATE_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    name={key}
                    type="date"
                    defaultValue={toDateInputValue(job[key])}
                  />
                </div>
              ))}
              <Button type="submit" variant="secondary" className="mt-1">
                บันทึกวันที่
              </Button>
            </form>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-text-muted">
              ข้อมูลงาน
            </h2>
            <form
              action={updateJobInfo}
              className="flex flex-col gap-3 rounded-card border border-border bg-card p-4"
            >
              <input type="hidden" name="jobId" value={job.id} />
              <div>
                <Label htmlFor="edit-title">ชื่องาน</Label>
                <Input id="edit-title" name="title" defaultValue={job.title} required />
              </div>
              <div>
                <Label htmlFor="edit-brandName">แบรนด์</Label>
                <Input
                  id="edit-brandName"
                  name="brandName"
                  defaultValue={job.brandName}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-productName">สินค้า</Label>
                <Input
                  id="edit-productName"
                  name="productName"
                  defaultValue={job.productName ?? ""}
                />
              </div>
              <Button type="submit" variant="secondary" className="mt-1">
                บันทึกข้อมูลงาน
              </Button>
            </form>
          </section>

          <section>
            <DeleteJobButton jobId={job.id} jobTitle={job.title} />
          </section>
        </div>
      )}
    </div>
  );
}
