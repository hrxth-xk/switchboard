import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { requireUser } from "@/lib/auth";

export default async function ChangePasswordPage() {
  await requireUser();

  return (
    <div className="goals-page-shell">
      <header className="page-header compact">
        <div>
          <p className="section-eyebrow">Settings</p>
          <h1 className="panel-title">Change password</h1>
        </div>
      </header>
      <div className="detail-panel">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
