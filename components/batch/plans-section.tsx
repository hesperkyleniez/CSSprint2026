"use client";

import { useState } from "react";
import { Metric } from "@/components/ui/metric";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { useScenario } from "@/components/batch/scenario-context";
import { kilograms, peso, triple } from "@/lib/format";
import type { PlanResult } from "@/lib/optimize";
import { measureNoun, type Pathway, type ScenarioInput } from "@/lib/scenario";

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

function acceptLine(selected: string) {
  if (selected.includes(" ") || selected.includes(",")) return `Accept offers ${selected}.`;
  return `Accept offer ${selected}.`;
}

function walkAwayNote(price: number | null, target: string, input: string, scenario: ScenarioInput) {
  const targetText = peso(Number(target));
  if (price === null || price < 0) {
    return `At low yield, this mix misses the ${targetText} target even if the ${input} were free.`;
  }
  const noun = measureNoun(scenario);
  const kg = Number(scenario.inputKgPerUnit);
  const perUnit =
    noun && Number.isFinite(kg) && kg > 0 ? `, about ${peso(price * kg)} per ${noun}` : "";
  return `At low yield, this mix still meets the ${targetText} target if the ${input} averages no more than ${peso(price)}/kg${perUnit}.`;
}

function PlanCard({
  title,
  rows,
  note,
  detail,
}: {
  title: string;
  rows?: { label: string; note?: string; value?: string }[];
  note?: string;
  detail?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="flex h-full flex-col rounded-3xl border border-[#ece7df] bg-white p-4">
      <div>
        <h3 className="font-display text-lg font-medium text-pretty text-foreground">{title}</h3>
        {note ? <p className="mt-3 text-sm leading-7 text-pretty text-foreground lg:mt-2 lg:leading-6">{note}</p> : null}
        {detail ? <p className="mt-3 text-sm leading-7 text-pretty text-foreground lg:mt-2 lg:leading-6">{detail}</p> : null}
        {rows ? (
          <>
            <button
              type="button"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-foreground lg:hidden"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? "Hide details" : "See details"}
            </button>
            <dl className={`mt-2 divide-y divide-line ${open ? "" : "max-lg:hidden"}`}>
              {rows.map((row) => (
                <Metric key={row.label} label={row.label} note={row.note} value={row.value} />
              ))}
            </dl>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function PlansSection() {
  const { pathway, result, scenario, loading, planShift, isDirty, isDemo } = useScenario();
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
    <SectionCard id="recommended-plans" step={4} title="Recommended buying plan" hideTitleOnMobile>
      {isDemo && result ? <Badge tone="solid">SIMULATED RESULTS</Badge> : null}
      {measureNoun(scenario) && result ? (
        <p className="text-xs leading-5 text-pretty text-muted/65 italic">
          Counts were converted with your estimate: one {measureNoun(scenario)} of {pathway.inputShort}{" "}
          is about {scenario.inputKgPerUnit} kg, and one {measureNoun(scenario)} of {pathway.outputName}{" "}
          is about {scenario.orderKgPerUnit} kg. The plans below are in kilograms.
        </p>
      ) : null}
      {planShift ? (
        <p
          className="rounded-2xl bg-inset px-4 py-3 text-sm font-medium leading-6 text-foreground"
          role="status"
        >
          {planShift}
        </p>
      ) : null}
      {loading || isDirty ? (
        <p className="text-sm text-muted" aria-live="polite">
          {loading ? "Updating the comparison…" : "Inputs changed; refreshing the comparison…"}
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {result?.planA ? (
          <PlanCard
            title="Plan A — Best at a normal yield"

            rows={planRows(result.planA, pathway)}
            note={acceptLine(result.planA.selectedOffers)}
            detail={walkAwayNote(
              result.planA.walkAwayPricePerKg,
              scenario.targetContribution,
              pathway.inputShort,
              scenario,
            )}
          />
        ) : (
          <PlanCard
            title={result ? "Plan A — No plan covers the full order" : "Plan A — Best at a normal yield"}

            rows={result ? undefined : placeholders}
            note={result ? result.planAReason : undefined}
          />
        )}
        {result?.planB ? (
          <PlanCard
            title={result.samePlan ? "Plan B — Same offers as Plan A" : "Plan B — Still works if yield is low"}

            rows={planRows(result.planB, pathway)}
            note={acceptLine(result.planB.selectedOffers)}
            detail={walkAwayNote(
              result.planB.walkAwayPricePerKg,
              scenario.targetContribution,
              pathway.inputShort,
              scenario,
            )}
          />
        ) : (
          <PlanCard
            title={result ? "Plan B — No plan works if yield is low" : "Plan B — If yield comes out low"}

            rows={result ? undefined : placeholders}
            note={result ? result.planBReason : undefined}
          />
        )}
      </div>
      <p className="rounded-2xl bg-inset px-4 py-3 text-sm leading-6 text-muted/70 italic">
        Full order required. This figure is not net profit.
      </p>
      <p className="text-sm leading-6 text-muted/70 italic">
        Ties keep the stronger low-yield mix, then less input.
      </p>
    </SectionCard>
  );
}
