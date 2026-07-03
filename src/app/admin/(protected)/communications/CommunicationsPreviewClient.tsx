"use client";

import { useMemo, useState } from "react";
import { Monitor, Moon, Smartphone, Sun } from "lucide-react";

import {
  ALL_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_COUNTS,
  NOTIFICATION_TEMPLATES,
  getEmailTemplate,
  renderEmailTemplate,
  renderNotificationChannel,
  type EmailTemplateCategory,
  type NotificationChannel,
} from "@/lib/communications";

const CATEGORIES: { id: EmailTemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "account", label: "Account" },
  { id: "order", label: "Orders" },
  { id: "delivery", label: "Delivery" },
  { id: "marketing", label: "Marketing" },
];

const CHANNELS: NotificationChannel[] = ["email", "push", "sms", "whatsapp", "in_app"];

export default function CommunicationsPreviewClient() {
  const [selectedId, setSelectedId] = useState(ALL_EMAIL_TEMPLATES[0]?.id ?? "welcome");
  const [category, setCategory] = useState<EmailTemplateCategory | "all">("all");
  const [channel, setChannel] = useState<NotificationChannel>("email");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  const filtered = useMemo(
    () => (category === "all" ? ALL_EMAIL_TEMPLATES : ALL_EMAIL_TEMPLATES.filter((t) => t.category === category)),
    [category],
  );

  const template = getEmailTemplate(selectedId);
  const rendered = template ? renderEmailTemplate(template, template.sampleData, { darkMode }) : null;

  const linkedNotification = NOTIFICATION_TEMPLATES.find((n) => n.emailTemplateId === selectedId);
  const channelPreview =
    linkedNotification && channel !== "email"
      ? renderNotificationChannel(linkedNotification.id, channel)
      : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Email Templates" value={EMAIL_TEMPLATE_COUNTS.total} />
        <StatCard label="Account" value={EMAIL_TEMPLATE_COUNTS.account} />
        <StatCard label="Orders + Delivery" value={EMAIL_TEMPLATE_COUNTS.order + EMAIL_TEMPLATE_COUNTS.delivery} />
        <StatCard label="Notification Templates" value={NOTIFICATION_TEMPLATES.length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 ${
              category === c.id ? "bg-green-800 text-cream-50" : "border border-green-200 bg-white text-green-800"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="max-h-[600px] overflow-y-auto rounded-2xl border border-green-100 bg-white">
          <ul role="listbox" aria-label="Email templates">
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedId === t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full border-b border-green-50 px-4 py-3 text-left text-sm transition hover:bg-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terra-500 ${
                    selectedId === t.id ? "bg-green-50 font-semibold text-green-900" : "text-green-700"
                  }`}
                >
                  <span className="block capitalize">{t.name}</span>
                  <span className="text-xs text-green-600/70">{t.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 ${
                  channel === ch ? "bg-terra-500 text-white" : "border border-green-200 bg-white text-green-800"
                }`}
              >
                {ch.replace("_", " ")}
              </button>
            ))}
            <span className="mx-2 h-5 w-px bg-green-200" aria-hidden="true" />
            <button
              type="button"
              aria-label={mobileView ? "Desktop view" : "Mobile view"}
              aria-pressed={mobileView}
              onClick={() => setMobileView(!mobileView)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
            >
              {mobileView ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
            </button>
            <button
              type="button"
              aria-label={darkMode ? "Light mode preview" : "Dark mode preview"}
              aria-pressed={darkMode}
              onClick={() => setDarkMode(!darkMode)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {channel === "email" && rendered ? (
            <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                Subject: {rendered.subject}
              </p>
              <p className="mb-4 text-xs text-green-600/70">Preheader: {rendered.preheader}</p>
              <div
                className={`mx-auto overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm transition-all ${
                  mobileView ? "max-w-[375px]" : "max-w-[640px]"
                } ${darkMode ? "dark-preview" : ""}`}
              >
                <iframe
                  title={`Email preview: ${template?.name}`}
                  srcDoc={rendered.html}
                  className="w-full border-0"
                  style={{ height: mobileView ? 520 : 640 }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : channelPreview ? (
            <ChannelMockup channel={channel} preview={channelPreview} mobile={mobileView} dark={darkMode} />
          ) : (
            <div className="rounded-2xl border border-green-100 bg-white p-8 text-center text-sm text-green-700/70">
              No {channel} template linked to this email. Select a template with multi-channel support.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4">
      <p className="text-2xl font-bold text-green-900">{value}</p>
      <p className="text-xs text-green-700/70">{label}</p>
    </div>
  );
}

function ChannelMockup({
  channel,
  preview,
  mobile,
  dark,
}: {
  channel: NotificationChannel;
  preview: { title: string; body: string; cta?: { label: string; href: string }; priority?: string };
  mobile: boolean;
  dark: boolean;
}) {
  const bg = dark ? "bg-green-950 text-cream-50" : "bg-cream-50 text-green-900";
  const card = dark ? "bg-green-900 border-green-700" : "bg-white border-green-100";

  if (channel === "sms") {
    return (
      <div className={`mx-auto rounded-3xl border p-4 ${mobile ? "max-w-[320px]" : "max-w-md"} ${bg}`}>
        <div className="rounded-2xl bg-green-100 p-3 text-sm text-green-900">
          <p className="font-semibold">BeyondBabyCo</p>
          <p className="mt-1">{preview.body}</p>
        </div>
      </div>
    );
  }

  if (channel === "whatsapp") {
    return (
      <div className={`mx-auto rounded-3xl border p-4 ${mobile ? "max-w-[320px]" : "max-w-md"} ${bg}`}>
        <div className="rounded-2xl border border-green-200 bg-[#e7ffdb] p-4 text-sm text-green-900">
          <p className="font-bold text-green-800">BeyondBabyCo</p>
          <p className="mt-2 font-semibold">{preview.title}</p>
          <p className="mt-1">{preview.body}</p>
          {preview.cta ? (
            <p className="mt-3 text-center font-semibold text-[#008069]">{preview.cta.label} →</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (channel === "push") {
    return (
      <div className={`mx-auto rounded-3xl border p-6 ${mobile ? "max-w-[320px]" : "max-w-md"} ${bg}`}>
        <div className={`rounded-2xl border p-4 shadow-md ${card}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-lg">🍼</span>
            <div>
              <p className="text-xs font-semibold uppercase text-green-600/70">BeyondBabyCo · now</p>
              <p className="font-bold">{preview.title}</p>
              <p className="mt-0.5 text-sm opacity-80">{preview.body}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto rounded-3xl border p-4 ${mobile ? "max-w-[320px]" : "max-w-md"} ${bg}`}>
      <div className={`rounded-2xl border p-4 ${card}`}>
        <p className="font-heading font-bold">{preview.title}</p>
        <p className="mt-1 text-sm opacity-80">{preview.body}</p>
        {preview.cta ? (
          <button
            type="button"
            className="mt-3 rounded-full bg-terra-500 px-4 py-2 text-xs font-semibold text-white"
          >
            {preview.cta.label}
          </button>
        ) : null}
        <p className="mt-2 text-[10px] uppercase tracking-wide opacity-50">Priority: {preview.priority}</p>
      </div>
    </div>
  );
}
