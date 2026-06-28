import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="login-screen">
      <section className="login-box">
        <div className="brand" style={{ marginBottom: 24 }}>
          <span className="brand-mark">S</span>
          <span>Switchboard</span>
        </div>
        <h1>Job switch progress, without the noise.</h1>
        <p className="subhead" style={{ marginBottom: 22 }}>
          Log problems, move applications, and ship portfolio work — one queue for what matters today.
        </p>
        <LoginForm />
        <Link className="button secondary" href="/signup" style={{ width: "100%", marginTop: 12 }}>
          <UserPlus size={18} />
          Create account
        </Link>
        <p className="panel-kicker" style={{ marginTop: 16 }}>
          Seed demo: user@switchboard.local / user1234
        </p>
      </section>
    </main>
  );
}
