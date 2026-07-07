import { ProfileActions } from "@/components/dashboard/ProfileActions";
import { requireUser } from "@/lib/auth";
import { getUserDisplayLabel } from "@/lib/user-display";

export default async function MorePage() {
  const user = await requireUser();

  return (
    <ProfileActions
      displayName={getUserDisplayLabel(user)}
      email={user.email}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
