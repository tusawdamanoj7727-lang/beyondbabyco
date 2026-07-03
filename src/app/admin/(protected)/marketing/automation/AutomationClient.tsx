"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import Card from "@/components/ui/Card";
import {
  WORKFLOW_TYPE_LABELS,
  formatDateTime,
  type AutomationListItem,
  type WorkflowType,
} from "@/lib/admin/marketing-types";
import { toggleAutomation } from "@/lib/admin/marketing-actions";

export default function AutomationClient(props: {
  rows: AutomationListItem[];
  segments: { id: string; name: string }[];
  templates: { id: string; name: string; channel: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  const columns: Column<AutomationListItem>[] = [
    { key: "name", header: "Workflow", render: (r) => r.name },
    { key: "type", header: "Type", render: (r) => WORKFLOW_TYPE_LABELS[r.workflowType as WorkflowType] ?? r.workflowType },
    { key: "trigger", header: "Trigger", render: (r) => r.triggerEvent },
    { key: "delay", header: "Delay", render: (r) => (r.delayMinutes >= 1440 ? `${Math.round(r.delayMinutes / 1440)}d` : r.delayMinutes >= 60 ? `${Math.round(r.delayMinutes / 60)}h` : `${r.delayMinutes}m`) },
    { key: "audience", header: "Audience", render: (r) => r.segmentName ?? "Default" },
    { key: "action", header: "Action", render: (r) => r.actionType },
    { key: "runs", header: "Runs", render: (r) => String(r.runCount) },
    { key: "last", header: "Last Run", render: (r) => formatDateTime(r.lastRunAt) },
    {
      key: "enabled",
      header: "Status",
      render: (r) => <Badge variant={r.isEnabled ? "success" : "default"} size="sm">{r.isEnabled ? "Enabled" : "Disabled"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => toggleAutomation(r.id, !r.isEnabled))}>
          {r.isEnabled ? "Disable" : "Enable"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold text-green-900">Automation Workflows</h2>
      <p className="text-sm text-green-700/60">Pre-configured workflows. Toggle enable/disable — visual list (no drag-drop).</p>

      <DataTable columns={columns} rows={props.rows} getRowId={(r) => r.id} empty="No automation workflows found." />

      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">Workflow examples</h3>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-sm text-green-800">
          {Object.values(WORKFLOW_TYPE_LABELS).map((label) => (
            <li key={label} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-terra-500" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-green-700/50">Each workflow supports: Enable/Disable, Trigger, Delay, Audience, Action.</p>
      </Card>
    </div>
  );
}
