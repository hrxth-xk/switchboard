import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { FALLBACK_MESSAGE, importJobFromUrl } from "@/lib/job-import";

const schema = z.object({
  url: z.string().min(1, "Paste a job URL.")
});

export async function POST(request: Request) {
  await requireUser();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: FALLBACK_MESSAGE }, { status: 400 });
  }

  const result = await importJobFromUrl(parsed.data.url);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
