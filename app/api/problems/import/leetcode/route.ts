import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";
import { prisma } from "@/lib/db";
import { leetCodeImporter } from "@/lib/leetcode";
import { normalizeProblemName } from "@/lib/problem-utils";

const schema = z.object({
  username: z.string().min(2, "Enter a LeetCode username.")
});

export async function POST(request: Request) {
  const user = await requireUser();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid LeetCode username." }, { status: 400 });
  }

  const result = await leetCodeImporter.importSolvedHistory(parsed.data.username);
  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }

  const now = new Date();
  let imported = 0;
  let skipped = 0;

  for (const problem of result.problems) {
    const name = normalizeProblemName(problem.title);
    const existing = await prisma.problem.findFirst({
      where: {
        userId: user.id,
        OR: [{ name }, ...(problem.slug ? [{ slug: problem.slug }] : [])]
      }
    });

    if (existing) {
      skipped += 1;
      // Fill missing metadata without forcing confidence / review.
      await prisma.problem.update({
        where: { id: existing.id },
        data: {
          url: existing.url || problem.url,
          slug: existing.slug || problem.slug,
          topic: existing.topic || problem.topic,
          pattern: existing.pattern || problem.pattern,
          difficulty: existing.difficulty || problem.difficulty
        }
      });
      continue;
    }

    await prisma.problem.create({
      data: {
        userId: user.id,
        name,
        url: problem.url,
        slug: problem.slug,
        topic: problem.topic,
        pattern: problem.pattern,
        difficulty: problem.difficulty,
        confidence: null,
        notes: null,
        lastPracticed: now,
        nextReview: null,
        revisitCount: 1
      }
    });
    imported += 1;
  }

  if (imported > 0) {
    await logActivity(
      user.id,
      `Imported ${imported} LeetCode problem${imported === 1 ? "" : "s"} from @${result.username}`
    );
    revalidateUserDashboard(user.id);
  }

  return NextResponse.json({
    ok: true,
    username: result.username,
    imported,
    skipped,
    available: result.problems.length,
    truncated: result.truncated
  });
}
