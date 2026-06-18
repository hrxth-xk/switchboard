import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "ADMIN" ? "ADMIN" : "USER"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      {
        error:
          "Login could not reach the database. Check DATABASE_URL, run the migrations, and seed the demo users."
      },
      { status: 503 }
    );
  }
}
