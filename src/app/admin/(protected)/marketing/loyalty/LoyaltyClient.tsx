"use client";

import DataTable, { type Column } from "@/components/admin/DataTable";
import StatsCard from "@/components/admin/StatsCard";
import Card from "@/components/ui/Card";
import { formatDateTime, type LoyaltyDashboard } from "@/lib/admin/marketing-types";

export default function LoyaltyClient({ dashboard }: { dashboard: LoyaltyDashboard }) {
  const txColumns: Column<(typeof dashboard.recentTransactions)[0]>[] = [
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "points", header: "Points", render: (r) => String(r.points) },
    { key: "reason", header: "Reason", render: (r) => r.reason },
    { key: "date", header: "Date", render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div className="space-y-8">
      <h2 className="font-heading text-lg font-bold text-green-900">Loyalty Program</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Points" value={String(dashboard.totalPoints)} icon="giftcards" />
        <StatsCard label="Active Members" value={String(dashboard.activeMembers)} icon="customers" />
        <StatsCard label="Referrals Completed" value={String(dashboard.referralsCompleted)} icon="activity" />
        <StatsCard label="Referral Rewards" value={String(dashboard.referralRewards)} icon="sparkles" />
      </div>

      <section aria-labelledby="tiers-heading">
        <h3 id="tiers-heading" className="font-heading text-sm font-bold text-green-900">Tier Breakdown</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {dashboard.tierBreakdown.map((t) => (
            <Card key={t.tier} padding="md" radius="3xl" variant="outline">
              <p className="text-sm text-green-700/60">{t.tier}</p>
              <p className="font-heading text-xl font-bold text-green-900">{t.count}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="transactions-heading">
        <h3 id="transactions-heading" className="font-heading text-sm font-bold text-green-900">Recent Point Transactions</h3>
        <div className="mt-4">
          <DataTable columns={txColumns} rows={dashboard.recentTransactions} getRowId={(r) => r.id} empty="No loyalty transactions yet." />
        </div>
      </section>

      <Card padding="md" radius="3xl" variant="outline" className="border-dashed text-sm text-green-700/60">
        Points, rewards, referral rewards and tier data are read from existing <code className="text-green-800">loyalty_points</code> and <code className="text-green-800">referrals</code> tables.
      </Card>
    </div>
  );
}
