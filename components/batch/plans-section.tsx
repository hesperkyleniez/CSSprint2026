"use client";

import { Metric } from "@/components/ui/metric";
import { SectionCard } from "@/components/ui/section-card";
import { useScenario } from "@/components/batch/scenario-context";
import { kilograms, peso, triple } from "@/lib/format";
import type { PlanResult } from "@/lib/optimize";
import type { Pathway } from "@/lib/scenario";

function planRows(plan: PlanResult, pathway: Pathway) {
  return [
    { label: "Selected offers", value: plan.selectedOffers },
    {
      label: `Capacity used (kg ${pathway.inputShort} input)`,
      value: kilograms(plan.capacityUsedKg),
    },
    {
      label: `Output (kg ${pathway.outputName})`,
      note: "Low / Typical / High",
      value: triple(plan.outputKg),
    },
    {
      label: "Order coverage (kg, %)",
      value: `${kilograms(plan.orderCoverageKg)}, ${plan.orderCoveragePct}%`,
    },
    {
      label: "Unmatched output (kg)",
      value: kilograms(plan.unmatchedOutputKg),
    },
    {
      label: "Contribution range (₱)",
      note: "Low / Typical / High",
      value: triple(plan.contribution, peso),
    },
    {
      label: `Walk-away price per kg (₱/kg ${pathway.inputShort})`,
      value: peso(plan.walkAwayPricePerKg),
    },
  ];
}

function PlanCard({
  title,
  tone,
  rows,
  note,
}: {
  title: string;
  tone: "brand" | "kernel";
  rows?: { label: string; note?: string; value?: string }[];
  note?: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div
        className={`h-1 ${tone === "brand" ? "bg-brand" : "bg-kernel"}`}
        aria-hidden="true"
      />
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-pretty text-foreground">{title}</h3>
        {note ? <p className="mt-2 text-sm leading-6 text-pretty text-muted">{note}</p> : null}
        {rows ? (
          <dl className="mt-2 divide-y divide-line">
            {rows.map((row) => (
              <Metric key={row.label} label={row.label} note={row.note} value={row.value} />
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );
}

export function PlansSection() {
  const { pathway, result, loading } = useScenario();
  const placeholders = [
    { label: "Selected offers" },
    { label: `Capacity used (kg ${pathway.inputShort} input)` },
    {
      label: `Output (kg ${pathway.outputName})`,
      note: "Low / Typical / High",
    },
    { label: "Order coverage (kg, %)" },
    { label: "Unmatched output (kg)" },
    { label: "Contribution range (₱)", note: "Low / Typical / High" },
    { label: `Walk-away price per kg (₱/kg ${pathway.inputShort})` },
  ];

  return (
    <SectionCard id="recommended-plans" step={4} title="Recommended buying plan">
      {loading ? (
        <p className="text-sm text-muted" aria-live="polite">
          Updating the comparison…
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {result?.planA ? (
          <PlanCard
            title="Plan A — Highest typical contribution"
            tone="brand"
            rows={planRows(result.planA, pathway)}
          />
        ) : (
          <PlanCard
            title="Plan A — Highest typical contribution"
            tone="brand"
            rows={result ? undefined : placeholders}
            note={result ? result.planBReason : undefined}
          />
        )}
        {result?.planB ? (
          <PlanCard
            title="Plan B — Meets target under low yield"
            tone="kernel"
            rows={planRows(result.planB, pathway)}
          />
        ) : (
          <PlanCard
            title="Plan B — Meets target under low yield"
            tone="kernel"
            rows={result ? undefined : placeholders}
            note={result ? result.planBReason : undefined}
          />
        )}
      </div>
    </SectionCard>
  );
}
