"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { TextField } from "@/components/ui/TextField";
import { toastError } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { run, isPending } = usePendingAction<"submit">();

  async function submit(formData: FormData) {
    await run("submit", async () => {
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to sign in." }));
        setError(body.error);
        toastError(body.error ?? "Unable to sign in.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  const loading = isPending("submit");

  return (
    <form action={submit} className="grid auth-form">
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <TextField autoComplete="email" label="Email" name="email" required type="email" />
      <TextField autoComplete="current-password" label="Password" minLength={8} name="password" required type="password" />
      <button className="button" disabled={loading} type="submit">
        <ActionButtonContent pending={loading} pendingLabel="Signing in…">
          <LogIn size={18} />
          Sign in
        </ActionButtonContent>
      </button>
    </form>
  );
}
