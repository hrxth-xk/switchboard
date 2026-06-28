type UserIdentity = {
  name: string;
  email: string;
};

export function getUserDisplayLabel(user: UserIdentity) {
  const name = user.name.trim();
  if (name) return name;

  const emailPrefix = user.email.split("@")[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return "User";
}
