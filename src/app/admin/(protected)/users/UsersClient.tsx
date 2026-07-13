"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import DataTable, { type Column } from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import FormField, { Input, Select, fieldControlClasses } from "@/components/admin/FormField";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { Spinner } from "@/components/admin/LoadingState";
import {
  USER_PANEL_ROLES,
  USER_PANEL_ROLE_LABELS,
  type AdminUserRow,
  type UserPanelRole,
} from "@/lib/admin/user-management";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readJson<T>(res: Response): Promise<T & { ok?: boolean; error?: string }> {
  return res.json() as Promise<T & { ok?: boolean; error?: string }>;
}

export default function UsersClient({ addOpenSignal = 0 }: { addOpenSignal?: number }) {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as UserPanelRole,
  });

  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);

  const loadUsers = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?page=${nextPage}&perPage=50`);
      const data = await readJson<{
        ok: boolean;
        data?: { users: AdminUserRow[]; total: number };
        error?: string;
      }>(res);
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to load users");
      }
      setUsers(data.data?.users ?? []);
      setTotal(data.data?.total ?? 0);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (addOpenSignal > 0) setAddOpen(true);
  }, [addOpenSignal]);

  function updateRow(id: string, patch: Partial<AdminUserRow>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function handleRoleChange(userId: string, role: UserPanelRole) {
    startTransition(async () => {
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await readJson<{ ok: boolean; error?: string }>(res);
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to update role");
        void loadUsers(page);
        return;
      }
      updateRow(userId, { role, isActive: true });
    });
  }

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readJson<{ ok: boolean; error?: string }>(res);
      if (!res.ok || !data.ok) {
        setAddError(data.error ?? "Failed to create user");
        return;
      }
      setAddOpen(false);
      setForm({ name: "", email: "", password: "", role: "viewer" });
      void loadUsers(1);
    });
  }

  function handleDeactivate() {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    startTransition(async () => {
      const res = await fetch("/api/admin/users/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id }),
      });
      const data = await readJson<{ ok: boolean; error?: string }>(res);
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to deactivate user");
        return;
      }
      setDeactivateTarget(null);
      updateRow(target.id, { isActive: false });
    });
  }

  function handleResetPassword() {
    if (!resetTarget) return;
    const target = resetTarget;
    startTransition(async () => {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id }),
      });
      const data = await readJson<{ ok: boolean; data?: { emailSent?: boolean }; error?: string }>(res);

      if (res.status === 503) {
        toast.error("Password reset email could not be sent. Check SMTP configuration.");
        return;
      }

      if (!res.ok || !data.ok || !data.data?.emailSent) {
        setError(data.error ?? "Failed to reset password");
        return;
      }

      setResetTarget(null);
      toast.success("Password reset email sent successfully.");
    });
  }

  const columns: Column<AdminUserRow>[] = [
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <div>
          <p className="font-medium text-green-900">{row.email || "—"}</p>
          {!row.isActive && (
            <Badge variant="warning" size="sm" className="mt-1">
              Deactivated
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="text-green-800">{row.name ?? "—"}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <select
          value={row.role}
          disabled={isPending || !row.isActive}
          onChange={(e) => handleRoleChange(row.id, e.target.value as UserPanelRole)}
          className={cn(fieldControlClasses, "h-10 min-w-[9rem] py-2 text-sm")}
          aria-label={`Role for ${row.email}`}
        >
          {USER_PANEL_ROLES.map((role) => (
            <option key={role} value={role}>
              {USER_PANEL_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-green-700/80">{formatDate(row.joinedAt)}</span>
      ),
    },
    {
      key: "lastLoginAt",
      header: "Last login",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-green-700/80">{formatDate(row.lastLoginAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending || !row.isActive}
            onClick={() => setResetTarget(row)}
          >
            Reset password
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending || !row.isActive}
            className="text-terra-600 hover:text-terra-700"
            onClick={() => setDeactivateTarget(row)}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm text-terra-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={users}
        getRowId={(row) => row.id}
        loading={loading}
        empty={
          <EmptyState
            title="No users yet"
            description="Create the first admin or staff account to get started."
            action={
              <Button type="button" variant="primary" onClick={() => setAddOpen(true)}>
                Add New User
              </Button>
            }
          />
        }
      />

      {total > users.length && (
        <p className="text-center text-xs text-green-700/60">
          Showing {users.length} of {total} users
        </p>
      )}

      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-4xl border border-cream-300 bg-white p-6 shadow-clay">
            <Dialog.Title className="font-heading text-xl font-bold text-green-900">
              Add New User
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-green-700/70">
              Creates a Supabase auth account with the selected admin role.
            </Dialog.Description>

            <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
              {addError && (
                <div role="alert" className="rounded-2xl border border-terra-200 bg-terra-50 px-3 py-2 text-sm text-terra-700">
                  {addError}
                </div>
              )}

              <FormField label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Full name"
                />
              </FormField>

              <FormField label="Email" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="user@beyondbabyco.com"
                />
              </FormField>

              <FormField label="Password" required>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
              </FormField>

              <FormField label="Role" required>
                <Select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserPanelRole }))}
                >
                  {USER_PANEL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {USER_PANEL_ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" disabled={isPending}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isPending}
                  leftIcon={isPending ? <Spinner size={16} /> : undefined}
                >
                  Create user
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate user?"
        description={
          deactivateTarget
            ? `This will ban ${deactivateTarget.email} and mark their profile inactive. They will not be able to sign in.`
            : undefined
        }
        confirmLabel="Deactivate"
        tone="danger"
        loading={isPending}
        onConfirm={handleDeactivate}
      />

      <Dialog.Root
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-4xl border border-cream-300 bg-white p-6 shadow-clay">
            <Dialog.Title className="font-heading text-lg font-bold text-green-900">
              Reset password
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-green-700/70">
              {resetTarget
                ? `Send a one-time password reset link to ${resetTarget.email}.`
                : ""}
            </Dialog.Description>

            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                variant="primary"
                loading={isPending}
                onClick={handleResetPassword}
              >
                Send reset email
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
