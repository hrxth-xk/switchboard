"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { TextField } from "@/components/ui/TextField";
import { toastError, toastSuccess } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

export function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0);
  const { run, isPending } = usePendingAction<"submit">();

  async function submit(formData: FormData) {
    await run("submit", async () => {
      setError("");

      const currentPassword = String(formData.get("currentPassword") ?? "");
      const newPassword = String(formData.get("newPassword") ?? "");
      const confirm = String(formData.get("confirmPassword") ?? "");

      if (newPassword !== confirm) {
        setError("Both new password fields must match.");
        return;
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to change the password." }));
        setError(body.error);
        toastError(body.error ?? "Unable to change the password.");
        return;
      }

      setFormKey((key) => key + 1);
      toastSuccess("Password changed — other devices have been signed out.");
    });
  }

  const loading = isPending("submit");

  return (
    <form action={submit} className="grid auth-form" key={formKey}>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <TextField
        autoComplete="current-password"
        label="Current password"
        name="currentPassword"
        required
        type="password"
      />
      <TextField
        autoComplete="new-password"
        label="New password"
        minLength={8}
        name="newPassword"
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
