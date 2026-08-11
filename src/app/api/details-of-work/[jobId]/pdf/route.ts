import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { DetailsOfWorkDocument } from "@/lib/pdf/details-of-work-document";
import { parseScenes } from "@/lib/storyline";
import { pdfContentDisposition } from "@/lib/pdf/content-disposition";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/details-of-work/[jobId]/pdf">,
) {
  await requireCurrentUser();
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { detailsOfWork: true, storyline: true },
  });

  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  registerPdfFonts();

  const details = job.detailsOfWork;
  const productImages = Array.isArray(details?.productImages)
    ? (details.productImages as string[])
    : [];

  const buffer = await renderToBuffer(
    DetailsOfWorkDocument({
      job: {
        title: job.title,
        brandName: job.brandName,
        productName: job.productName,
        createdAt: job.createdAt,
      },
      details: {
        sow: details?.sow ?? null,
        location: details?.location ?? null,
        keyMessage: Array.isArray(details?.keyMessage) ? (details.keyMessage as string[]) : [],
        doList: Array.isArray(details?.doList) ? (details.doList as string[]) : [],
        dontList: Array.isArray(details?.dontList) ? (details.dontList as string[]) : [],
        moodTone: details?.moodTone ?? null,
        dressCode: details?.dressCode ?? null,
        hashtags: details?.hashtags ?? null,
        productImages,
        otherNotes: details?.otherNotes ?? null,
      },
      approvedScenes:
        job.storyline?.status === "APPROVED"
          ? parseScenes(job.storyline.scenes)
          : null,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdfContentDisposition(`Details - ${job.brandName}`),
    },
  });
}
