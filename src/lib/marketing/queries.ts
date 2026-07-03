import "server-only";

export type {
  MarketingDashboard,
  CampaignListItem,
  SegmentListItem,
  TemplateListItem,
  AutomationListItem,
  LoyaltyDashboard,
  CampaignAnalytics,
  QueueItem,
} from "@/lib/admin/marketing-types";

export {
  getMarketingDashboard,
  listCampaigns,
  listSegments,
  listTemplates,
  listAutomation,
  listEmailQueue,
  listWhatsappQueue,
  listPushQueue,
  getCampaignAnalytics,
  getLoyaltyDashboard,
  getMarketingFilterOptions,
} from "@/lib/admin/marketing";

export async function getCampaigns(
  opts?: Parameters<typeof import("@/lib/admin/marketing").listCampaigns>[0],
) {
  const { listCampaigns } = await import("@/lib/admin/marketing");
  return listCampaigns(opts ?? {});
}

export async function getSegments(
  opts?: Parameters<typeof import("@/lib/admin/marketing").listSegments>[0],
) {
  const { listSegments } = await import("@/lib/admin/marketing");
  return listSegments(opts ?? {});
}

export async function getAutomation(
  opts?: Parameters<typeof import("@/lib/admin/marketing").listAutomation>[0],
) {
  const { listAutomation } = await import("@/lib/admin/marketing");
  return listAutomation(opts ?? {});
}

export async function getTemplates(
  opts?: Parameters<typeof import("@/lib/admin/marketing").listTemplates>[0],
) {
  const { listTemplates } = await import("@/lib/admin/marketing");
  return listTemplates(opts ?? {});
}
