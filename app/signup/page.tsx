import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/SignupForm";
import { getSession } from "@/lib/auth";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <AuthShell action={{ href: "/login", label: "Log in" }}>
      <div className="auth-page">
        <span aria-hidden="true" className="auth-brand-mark">
          S
        </span>
        <span className="landing-eyebrow">
          <Sparkles aria-hidden="true" size={13} />
          Two minutes to set up
        </span>
        <header className="macro-hero auth-hero">
          <h1 className="macro-hero-title">Create account</h1>
          <p className="macro-hero-tagline">
            A focused workspace for DSA problems, job applications, and portfolio projects.
          </p>
        </header>

        <AuthCard>
          <SignupForm />
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
