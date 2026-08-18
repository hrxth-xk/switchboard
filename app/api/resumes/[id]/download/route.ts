import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readResumeFile, resumeContentType } from "@/lib/resume-storage";

function safeContentDisposition(fileName: string, inline: boolean) {
  // ASCII fallback for old clients, plus an RFC 5987 filename* so accented or
  // non-Latin resume names survive instead of arriving as "_".
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName);
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const resume = await prisma.resumeVersion.findFirst({ where: { id, userId: user.id } });
  if (!resume || resume.storagePath === "pending") {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const nativeType = resumeContentType(resume.originalFileName);
  // Only PDFs have a native browser viewer — Word files download whatever we ask for.
  const inline =
    new URL(request.url).searchParams.get("inline") === "1" && nativeType === "application/pdf";

  // WebKit on iOS picks preview-vs-download by MIME type, not by Content-Disposition:
  // served as application/pdf it always hands the file to the built-in viewer, which has
  // no save affordance. An opaque type leaves it no renderer to choose, so it downloads.
  const contentType = inline ? nativeType : "application/octet-stream";

  try {
    const buffer = await readResumeFile(resume.storagePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": safeContentDisposition(resume.originalFileName, inline),
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "Resume file not found." }, { status: 404 });
  }
}
