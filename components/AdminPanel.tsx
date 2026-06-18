"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus } from "lucide-react";

type AdminPanelProps = {
  users: Array<{ id: string; name: string; email: string; role: string }>;
};

export function AdminPanel({ users }: AdminPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createUser(formData: FormData) {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role")
      })
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not create user." }));
      setError(body.error);
      return;
    }

    router.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Admin</h2>
          <p className="panel-kicker">Create users and review access.</p>
        </div>
        <span className="pill">Admin only</span>
      </div>
      <div className="grid admin-grid">
        <form action={createUser} className="grid">
          {error ? <div className="error">{error}</div> : null}
          <label className="field">
            <span>Name</span>
            <input name="name" placeholder="Candidate name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" placeholder="candidate@example.com" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" minLength={8} placeholder="temporary password" required />
          </label>
          <label className="field">
            <span>Role</span>
            <select name="role" defaultValue="USER">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <button className="button" disabled={loading}>
            <ShieldPlus size={18} />
            {loading ? "Creating" : "Create user"}
          </button>
        </form>
        <div className="list">
          {users.map((user) => (
            <div className="item" key={user.id}>
              <div className="item-row">
                <div>
                  <p className="item-title">{user.name}</p>
                  <p className="item-meta">{user.email}</p>
                </div>
                <span className="pill">{user.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
