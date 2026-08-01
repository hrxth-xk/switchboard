import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { findValidAuthToken } from "@/lib/auth-tokens";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  // Deliberately no session redirect — someone may be resetting in a browser
  // that still holds an old session.
  const { token = "" } = await searchParams;
  const valid = token ? await findValidAuthToken(token, "PASSWORD_RESET") : null;

  return (
    <AuthShell>
      <div className="auth-page">
        <span aria-hidden="true" className="auth-brand-mark">
          S
        </span>
        <header className="macro-hero auth-hero">
          <h1 className="macro-hero-title">{valid ? "Choose a new password" : "Link expired"}</h1>
          <p className="macro-hero-tagline">
            {valid
              ? "Pick something at least 8 characters long. This signs you out everywhere else."
              : "This reset link is invalid, already used, or older than 60 minutes."}
          </p>
        </header>

        <AuthCard>
          {valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="auth-card-actions">
              <Link className="button auth-button" href="/forgot-password">
                Request a new link
              </Link>
            </div>
          )}
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
