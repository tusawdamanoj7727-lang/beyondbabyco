"use client";

import { useState } from "react";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import Button from "@/components/ui/Button";
import UsersClient from "./UsersClient";

export default function UsersPageShell() {
  const [addOpenSignal, setAddOpenSignal] = useState(0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="System"
        title="User Management"
        description="Manage admin and staff accounts, roles, and access"
        actions={
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="inline-flex h-12 items-center gap-2 rounded-3xl px-6"
            onClick={() => setAddOpenSignal((n) => n + 1)}
          >
            <Icon name="plus" size={18} />
            Add New User
          </Button>
        }
      />

      <UsersClient addOpenSignal={addOpenSignal} />
    </div>
  );
}
