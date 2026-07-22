"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { TextField } from "@/components/ui/TextField";
import { toastError } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { run, isPending } = usePendingAction<"submit">();

  async function submit(formData: FormData) {
    await run("submit", async () => {
      setError("");

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to create account." }));
        setError(body.error);
        toastError(body.error ?? "Unable to create account.");
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
      <TextField autoComplete="name" label="Name" name="name" required />
      <TextField autoComplete="email" label="Email" name="email" required type="email" />
      <TextField autoComplete="new-password" label="Password" minLength={8} name="password" required type="password" />
      <button className="button" disabled={loading} type="submit">
        <ActionButtonContent pending={loading} pendingLabel="Creating account…">
          <UserPlus size={18} />
          Create account
        </ActionButtonContent>
      </button>
    </form>
  );
}
