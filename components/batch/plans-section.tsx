"use client";

import { Metric } from "@/components/ui/metric";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { useScenario } from "@/components/batch/scenario-context";
import { kilograms, peso, triple } from "@/lib/format";
import type { PlanResult } from "@/lib/optimize";
import type { Pathway } from "@/lib/scenario";

function planRows(plan: PlanResult, pathway: Pathway) {
  const supplierPrices = plan.supplierWalkAwayPrices.length
    ? plan.supplierWalkAwayPrices
        .map((item) => `${item.id.toUpperCase()}${item.source ? ` (${item.source})` : ""}: ${item.pricePerKg === null ? "no nonnegative price meets the target" : `${peso(item.pricePerKg)}/kg`}`)
        .join(" · ")
    : "No offer selected";
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
      label: "Full order covered?",
      value: `Typical: ${plan.meetsTypicalOrder ? "Yes" : "No"} · Low yield: ${plan.meetsLowYieldOrder ? "Yes" : "No"}`,
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
      label: `Blended max purchase price (low-yield ₱/kg ${pathway.inputShort})`,
      value: plan.walkAwayPricePerKg === null ? "No nonnegative price meets the target" : peso(plan.walkAwayPricePerKg),
    },
    {
      label: "Supplier-specific counteroffer ceilings",
      note: plan.walkAwayBasis,
      value: supplierPrices,
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
  const { pathway, result, loading, isDirty, isDemo } = useScenario();
  const placeholders = [
    { label: "Selected offers" },
    { label: `Capacity used (kg ${pathway.inputShort} input)` },
    {
      label: `Output (kg ${pathway.outputName})`,
      note: "Low / Typical / High",
    },
    { label: "Order coverage (kg, %)" },
    { label: "Full order covered?" },
    { label: "Unmatched output (kg)" },
    { label: "Contribution range (₱)", note: "Low / Typical / High" },
    { label: `Blended max purchase price (low-yield ₱/kg ${pathway.inputShort})` },
    { label: "Supplier-specific counteroffer ceilings" },
  ];

  return (
    <SectionCard id="recommended-plans" step={4} title="Recommended buying plan">
      <p className="rounded-lg border border-line bg-inset px-3 py-2 text-sm leading-6 text-muted">
        Recommendations require the full entered order (Plan A at typical yield; Plan B at low yield). Loss-making purchases are excluded; declining all offers is the ₱0 baseline. Contribution subtracts only entered raw-material and variable-processing costs, so it is not net profit.
      </p>
      <p className="text-xs leading-5 text-muted">
        Tie-breaks favor stronger low-yield contribution, then less input, lower combined costs, fewer offers, and offer order A–C.
      </p>
      {isDemo && result ? <Badge>SIMULATED RESULTS</Badge> : null}
      {loading || isDirty ? (
        <p className="text-sm text-muted" aria-live="polite">
          {loading ? "Updating the comparison…" : "Inputs changed; refreshing the comparison…"}
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
            title={result ? "Plan A — No qualifying full-order plan" : "Plan A — Highest typical contribution"}
            tone="brand"
            rows={result ? undefined : placeholders}
            note={result ? result.planAReason : undefined}
          />
        )}
        {result?.planB ? (
          <PlanCard
            title={result.samePlan ? "Plan B — Same combination as Plan A" : "Plan B — Meets target under low yield"}
            tone="kernel"
            rows={planRows(result.planB, pathway)}
          />
        ) : (
          <PlanCard
            title="Plan B — No qualifying low-yield plan"
            tone="kernel"
            rows={result ? undefined : placeholders}
            note={result ? result.planBReason : undefined}
          />
        )}
      </div>
    </SectionCard>
  );
}
