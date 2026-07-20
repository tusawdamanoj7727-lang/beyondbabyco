/**
 * Client-safe types and constants for Marketing Automation.
 */

export const CAMPAIGN_TYPES = ["email", "whatsapp", "push", "sms"] as const;
export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  push: "Push Notification",
  sms: "SMS",
};

export const CAMPAIGN_STATUSES = ["draft", "scheduled", "running", "paused", "completed", "cancelled"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TEMPLATE_CHANNELS = ["email", "whatsapp", "push"] as const;
export type TemplateChannel = (typeof TEMPLATE_CHANNELS)[number];

export const TEMPLATE_CHANNEL_LABELS: Record<TemplateChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  push: "Push",
};

export const TEMPLATE_STATUSES = ["active", "archived"] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const SEGMENT_PRESETS = [
  "first_time_buyers",
  "returning_customers",
  "vip_customers",
  "high_ltv",
  "inactive",
  "abandoned_cart",
  "newsletter_subscribers",
  "location",
  "order_count",
  "average_spend",
  "coupon_usage",
  "review_rating",
] as const;
export type SegmentPreset = (typeof SEGMENT_PRESETS)[number];

export const SEGMENT_PRESET_LABELS: Record<SegmentPreset, string> = {
  first_time_buyers: "First-time Buyers",
  returning_customers: "Returning Customers",
  vip_customers: "VIP Customers",
  high_ltv: "High LTV",
  inactive: "Inactive Customers",
  abandoned_cart: "Abandoned Cart",
  newsletter_subscribers: "Newsletter Subscribers",
  location: "Location",
  order_count: "Order Count",
  average_spend: "Average Spend",
  coupon_usage: "Coupon Usage",
  review_rating: "Review Rating",
};

export const WORKFLOW_TYPES = [
  "welcome_email",
  "order_followup",
  "review_request",
  "birthday_greeting",
  "abandoned_cart",
  "win_back",
  "coupon_reminder",
  "loyalty_upgrade",
  "newsletter_welcome",
] as const;
export type WorkflowType = (typeof WORKFLOW_TYPES)[number];

export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  welcome_email: "Welcome Email",
  order_followup: "Order Follow-up",
  review_request: "Review Request",
  birthday_greeting: "Birthday Greeting",
  abandoned_cart: "Abandoned Cart Reminder",
  win_back: "Win-back Campaign",
  coupon_reminder: "Coupon Reminder",
  loyalty_upgrade: "Loyalty Upgrade",
  newsletter_welcome: "Newsletter Welcome",
};

export const QUEUE_STATUSES = ["queued", "processing", "sent", "failed"] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export const MARKETING_NAV = [
  { href: "/admin/marketing", label: "Dashboard" },
  { href: "/admin/marketing/campaigns", label: "Campaign Center" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/marketing/campaigns/calendar", label: "Calendar" },
  { href: "/admin/marketing/campaigns/creative", label: "AI Creative" },
  { href: "/admin/marketing/email", label: "Email" },
  { href: "/admin/marketing/whatsapp", label: "WhatsApp" },
  { href: "/admin/marketing/push", label: "Push" },
  { href: "/admin/marketing/segments", label: "Segments" },
  { href: "/admin/marketing/loyalty", label: "Loyalty" },
  { href: "/admin/marketing/automation", label: "Automation" },
] as const;

export interface MarketingDashboard {
  totalCampaigns: number;
  scheduledCampaigns: number;
  runningCampaigns: number;
  completedCampaigns: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenueGenerated: number;
  subscribers: number;
  automationRuns: number;
}

export interface CampaignAnalytics {
  openRate: number;
  clickRate: number;
  bounceRate: number;
  deliveryRate: number;
  conversionRate: number;
  revenue: number;
}

export interface CampaignListItem {
  id: string;
  name: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  segmentName: string | null;
  templateName: string | null;
  scheduledAt: string | null;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  revenue: number;
  createdAt: string;
}

export interface SegmentListItem {
  id: string;
  name: string;
  slug: string;
  segmentType: string;
  customerCount: number;
  isActive: boolean;
  criteria: Record<string, unknown>;
  updatedAt: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  channel: TemplateChannel;
  status: TemplateStatus;
  subject: string | null;
  title: string | null;
  variables: string[];
  updatedAt: string;
}

export interface AutomationListItem {
  id: string;
  name: string;
  slug: string;
  workflowType: string;
  triggerEvent: string;
  delayMinutes: number;
  actionType: CampaignType;
  isEnabled: boolean;
  runCount: number;
  lastRunAt: string | null;
  segmentName: string | null;
  templateName: string | null;
}

export interface QueueItem {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  status: QueueStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface LoyaltyDashboard {
  totalPoints: number;
  activeMembers: number;
  referralsCompleted: number;
  referralRewards: number;
  tierBreakdown: { tier: string; count: number }[];
  recentTransactions: { id: string; customerName: string; points: number; reason: string; createdAt: string }[];
}

export interface MarketingListResult<T> {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMoney(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Future integration placeholders */
export const MARKETING_INTEGRATIONS = [
  "Brevo",
  "Mailchimp",
  "SendGrid",
  "Meta WhatsApp Cloud API",
  "Firebase Cloud Messaging",
  "OneSignal",
] as const;
