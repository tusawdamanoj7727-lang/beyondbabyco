import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/guards";
import UsersPageShell from "./UsersPageShell";

export const metadata: Metadata = { title: "User Management" };

export default async function AdminUsersPage() {
  await requireAdmin();

  return <UsersPageShell />;
}
