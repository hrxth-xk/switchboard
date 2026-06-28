import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SignupForm } from "@/components/SignupForm";
import { getSession } from "@/lib/auth";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="login-screen">
      <section className="login-box">
        <div className="brand" style={{ marginBottom: 24 }}>
          <span className="brand-mark">S</span>
          <span>Switchboard</span>
        </div>
        <h1>Create your tracker.</h1>
        <p className="subhead" style={{ marginBottom: 22 }}>
          A focused workspace for DSA problems, job applications, and portfolio projects.
        </p>
        <SignupForm />
        <Link className="button secondary" href="/login" style={{ width: "100%", marginTop: 12 }}>
          <ArrowLeft size={18} />
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
