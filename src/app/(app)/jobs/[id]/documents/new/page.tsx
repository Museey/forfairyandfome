import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DocumentForm } from "@/components/documents/document-form";

export default async function NewDocumentPage({
  params,
}: PageProps<"/jobs/[id]/documents/new">) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2 pb-6">
      <Link
        href={`/jobs/${id}?tab=documents`}
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>

      <h1 className="text-xl font-semibold">สร้างเอกสาร</h1>

      <DocumentForm jobId={id} />
    </div>
  );
}
