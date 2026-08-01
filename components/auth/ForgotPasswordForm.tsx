"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { TextField } from "@/components/ui/TextField";
import { toastError } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const { run, isPending } = usePendingAction<"submit">();

  async function submit(formData: FormData) {
    await run("submit", async () => {
      setError("");
      const email = String(formData.get("email") ?? "");

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to send the reset link." }));
        setError(body.error);
        toastError(body.error ?? "Unable to send the reset link.");
        return;
      }

      setSentTo(email);
    });
  }

  const loading = isPending("submit");

  if (sentTo) {
    return (
      <div className="grid auth-form">
        <p className="auth-footnote">
          If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. The link expires in 60
          minutes.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="grid auth-form">
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <p className="auth-footnote">Enter your email and we&apos;ll send you a link to set a new password.</p>
      <TextField autoComplete="email" label="Email" name="email" required type="email" />
      <button className="button" disabled={loading} type="submit">
        <ActionButtonContent pending={loading} pendingLabel="Sending…">
          <Mail size={18} />
          Send reset link
        </ActionButtonContent>
      </button>
    </form>
  );
}
