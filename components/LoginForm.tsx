"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Unable to sign in." }));
      setError(body.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form action={submit} className="grid">
      {error ? <div className="error">{error}</div> : null}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" placeholder="8+ characters" required />
      </label>
      <button className="button" type="submit" disabled={loading}>
        <LogIn size={18} />
        {loading ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
