import PageHeader from "@/components/admin/PageHeader";
import CampaignCalendar from "@/components/campaigns/CampaignCalendar";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCampaignCalendarEvents } from "@/lib/admin/campaign-center";

export default async function CampaignCalendarPage() {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);
  const events = await getCampaignCalendarEvents();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Marketing calendar"
        description="Upcoming launches, scheduled sends, festivals, and newsletter reminders."
      />
      <div className="rounded-3xl border border-cream-200 bg-white p-6">
        <CampaignCalendar events={events} />
      </div>
    </div>
  );
}
