import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { leetCodeImporter } from "@/lib/leetcode";

const schema = z.object({
  url: z.string().min(1, "Paste a LeetCode problem URL.")
});

export async function POST(request: Request) {
  await requireUser();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Paste a valid LeetCode problem URL." },
      { status: 400 }
    );
  }

  const result = await leetCodeImporter.importFromUrl(parsed.data.url);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
