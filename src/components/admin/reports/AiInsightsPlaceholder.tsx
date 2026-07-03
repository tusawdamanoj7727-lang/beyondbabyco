"use client";

import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import Badge from "@/components/ui/Badge";

const PLACEHOLDER_INSIGHTS = [
  { title: "Revenue Forecast", description: "AI will predict next 30-day revenue based on seasonality and trends." },
  { title: "Churn Risk", description: "Identify customers likely to churn based on order frequency and returns." },
  { title: "Inventory Optimizer", description: "Recommend reorder quantities and highlight slow-moving SKUs." },
  { title: "Promotion Advisor", description: "Suggest coupon strategies to maximize conversion without margin loss." },
];

export default function AiInsightsPlaceholder() {
  return (
    <section aria-labelledby="ai-insights-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 id="ai-insights-heading" className="font-heading text-lg font-bold text-green-900">AI Business Insights</h2>
        <Badge variant="info" size="sm">Planned</Badge>
      </div>
      <p className="text-sm text-green-700/60">Reserved for future AI-powered analytics widgets. No AI is connected yet.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_INSIGHTS.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.06}>
            <Card padding="md" radius="3xl" variant="glass" className="h-full border-dashed border-green-300/50">
              <h3 className="font-heading text-sm font-bold text-green-900">{item.title}</h3>
              <p className="mt-2 text-xs text-green-700/60">{item.description}</p>
              <p className="mt-3 text-[10px] uppercase tracking-wide text-green-700/55">Planned integration</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
