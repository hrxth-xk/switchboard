"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { TextField } from "@/components/ui/TextField";
import { toastError, toastSuccess } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const { run, isPending } = usePendingAction<"submit">();

  async function submit(formData: FormData) {
    await run("submit", async () => {
      setError("");

      const password = String(formData.get("password") ?? "");
      const confirm = String(formData.get("confirmPassword") ?? "");

      if (password !== confirm) {
        setError("Both passwords must match.");
        return;
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to reset the password." }));
        setError(body.error);
        toastError(body.error ?? "Unable to reset the password.");
        return;
      }

      toastSuccess("Password updated — sign in with your new password.");
      router.push("/login");
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
      <TextField
        autoComplete="new-password"
        label="New password"
        minLength={8}
        name="password"
        required
        type="password"
      />
      <TextField
        autoComplete="new-password"
        label="Confirm new password"
        minLength={8}
        name="confirmPassword"
        required
        type="password"
      />
      <button className="button" disabled={loading} type="submit">
        <ActionButtonContent pending={loading} pendingLabel="Updating…">
          <KeyRound size={18} />
          Update password
        </ActionButtonContent>
      </button>
    </form>
  );
}
