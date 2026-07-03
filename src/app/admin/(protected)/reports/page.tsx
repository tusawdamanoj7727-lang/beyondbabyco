import { redirect } from "next/navigation";

export default async function LegacyReportsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v) q.set(k, v);
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  redirect(`/admin/analytics${suffix}`);
}
