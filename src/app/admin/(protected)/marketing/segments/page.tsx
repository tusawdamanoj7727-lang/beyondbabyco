import { listSegments, listTemplates } from "@/lib/admin/marketing";
import SegmentsClient from "./SegmentsClient";

export default async function SegmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [segments, templates] = await Promise.all([
    listSegments({ search: sp.search, page }),
    listTemplates({ channel: "all", status: "all", page: Number(sp.tpage) || 1 }),
  ]);

  return <SegmentsClient segments={segments} templates={templates} search={sp.search ?? ""} />;
}
