"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";

import Button from "@/components/ui/Button";
import { formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { updateCustomerProfileAction } from "@/lib/account/profile-actions";

const PREFS_KEY = "bbc_profile_prefs_v1";
const BIRTHDAY_KEY = "bbc_profile_birthday_v1";

type ProfileData = {
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
};

export default function ProfileClient({ initial }: { initial: ProfileData }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: initial.fullName,
    phone: initial.phone.replace(/\D/g, "").slice(-10),
    avatar_url: initial.avatarUrl,
    birthday: "",
    email_updates: true,
    sms_updates: false,
  });

  useEffect(() => {
    try {
      const prefs = localStorage.getItem(PREFS_KEY);
      const birthday = localStorage.getItem(BIRTHDAY_KEY);
      if (prefs) {
        const parsed = JSON.parse(prefs) as { email_updates?: boolean; sms_updates?: boolean };
        setForm((f) => ({
          ...f,
          email_updates: parsed.email_updates ?? true,
          sms_updates: parsed.sms_updates ?? false,
        }));
      }
      if (birthday) setForm((f) => ({ ...f, birthday }));
    } catch {
      /* ignore */
    }
  }, []);

  function save() {
    startTransition(async () => {
      const result = await updateCustomerProfileAction({
        full_name: form.full_name,
        phone: form.phone,
        avatar_url: form.avatar_url,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not save profile");
        return;
      }
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ email_updates: form.email_updates, sms_updates: form.sms_updates }),
      );
      if (form.birthday) localStorage.setItem(BIRTHDAY_KEY, form.birthday);
      setSaved(true);
      toast.success("Profile updated");
      window.setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-green-900">Profile</h1>
        <p className="text-sm text-green-700/70">Manage your personal information and preferences.</p>
      </div>

      <div className="flex items-center gap-4 rounded-3xl border border-green-100 bg-white/90 p-5">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-cream-100">
          {form.avatar_url ? (
            <Image src={form.avatar_url} alt="" fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-bold text-green-700">
              {form.full_name.charAt(0) || "?"}
            </div>
          )}
        </div>
        <div>
          <p className="font-heading font-semibold text-green-900">{form.full_name || "Your name"}</p>
          <p className="text-sm text-green-700/70">{initial.email}</p>
        </div>
      </div>

      <form
        className="space-y-5 rounded-3xl border border-green-100 bg-white/90 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Full name" id="profile-name">
          <input
            id="profile-name"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className={inputClass}
            autoComplete="name"
          />
        </Field>
        <Field label="Email (read-only)" id="profile-email">
          <input id="profile-email" value={initial.email} readOnly disabled className={inputClassDisabled} />
        </Field>
        <Field label="Phone" id="profile-phone">
          <input
            id="profile-phone"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            className={inputClass}
            autoComplete="tel"
          />
        </Field>
        <Field label="Photo link" id="profile-avatar" hint="Paste a link to your profile photo">
          <input
            id="profile-avatar"
            type="url"
            value={form.avatar_url}
            onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
            className={inputClass}
            placeholder="https://example.com/photo.jpg"
          />
        </Field>
        <Field label="Birthday" id="profile-birthday" hint="Stored on this device for personalised reminders">
          <input
            id="profile-birthday"
            type="date"
            value={form.birthday}
            onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-green-800">Preferences</legend>
          <label className="flex items-center gap-2 text-sm text-green-800">
            <input
              type="checkbox"
              checked={form.email_updates}
              onChange={(e) => setForm((f) => ({ ...f, email_updates: e.target.checked }))}
            />
            Email order updates
          </label>
          <label className="flex items-center gap-2 text-sm text-green-800">
            <input
              type="checkbox"
              checked={form.sms_updates}
              onChange={(e) => setForm((f) => ({ ...f, sms_updates: e.target.checked }))}
            />
            SMS delivery alerts
          </label>
        </fieldset>

        <Button variant="primary" type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Saved
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-green-800">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-green-700/70">{hint}</p> : null}
    </div>
  );
}

const inputClass = cn(formControl, "text-sm");
const inputClassDisabled = cn(formControl, "cursor-not-allowed bg-cream-50 text-green-700/70");
