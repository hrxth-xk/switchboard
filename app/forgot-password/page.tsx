import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getSession } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <AuthShell action={{ href: "/login", label: "Log in" }}>
      <div className="auth-page">
        <span aria-hidden="true" className="auth-brand-mark">
          S
        </span>
        <header className="macro-hero auth-hero">
          <h1 className="macro-hero-title">Reset password</h1>
          <p className="macro-hero-tagline">We&apos;ll email you a one-time link to set a new password.</p>
        </header>

        <AuthCard>
          <ForgotPasswordForm />
          <div className="auth-card-actions">
            <Link className="button secondary auth-button" href="/login">
              <ArrowLeft size={18} />
              Back to sign in
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
