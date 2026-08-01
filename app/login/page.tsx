import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <AuthShell>
      <div className="auth-page">
        <span aria-hidden="true" className="auth-brand-mark">
          S
        </span>
        <header className="macro-hero auth-hero">
          <h1 className="macro-hero-title">Sign in</h1>
          <p className="macro-hero-tagline">
            Log problems, move applications, and ship portfolio work — one queue for what matters today.
          </p>
        </header>

        <AuthCard>
          <LoginForm />
          <div className="auth-card-actions">
            <Link className="button secondary auth-button" href="/signup">
              <UserPlus size={18} />
              Create account
            </Link>
            {/* "Forgot password?" link intentionally omitted: /forgot-password works,
                but no mail is sent until RESEND_API_KEY is configured. */}
          </div>
          <p className="auth-footnote">Seed demo: user@switchboard.local / user1234</p>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
