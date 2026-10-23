"use client";

import { useEffect, useRef, useState } from "react";
import { useScenario } from "@/components/batch/scenario-context";
import { CapacitySection } from "@/components/batch/capacity-section";
import { ComparisonSection } from "@/components/batch/comparison-section";
import { OffersSection } from "@/components/batch/offers-section";
import { PathwaySection } from "@/components/batch/pathway-section";
import { PlansSection } from "@/components/batch/plans-section";
import { RationaleSection } from "@/components/batch/rationale-section";
import { WhatIfSection } from "@/components/batch/what-if-section";
import { Button } from "@/components/ui/button";
import { expandSection } from "@/components/ui/section-card";

const steps = [
  { title: "Buyer order", label: "Buyer order" },
  { title: "Supplier offers", label: "Supplier offers" },
  { title: "Capacity & costs", label: "Capacity" },
  { title: "Review", label: "Review" },
] as const;

const resultSections = new Set([
  "recommended-plans",
  "plan-rationale",
  "offer-comparison",
  "what-if",
]);

function entered(value: string) {
  const trimmed = value.trim();
  return trimmed || "Not entered";
}

function showOnPhone(visible: boolean) {
  return visible ? "" : "max-lg:hidden";
}

function Progress({ step }: { step: number }) {
  return (
    <div className="lg:hidden">
      <h1 className="sr-only">{steps[step - 1].title}</h1>
      <ol className="mx-auto flex w-full max-w-[19.5rem] items-start" aria-label="Progress">
        {steps.map((item, index) => {
          const current = index + 1 === step;
          const done = index + 1 < step;
          const leftOn = index > 0 && step > index;
          const rightOn = index < steps.length - 1 && step > index + 1;
          return (
            <li
              key={item.title}
              className="flex min-w-0 flex-1 flex-col items-center"
              aria-current={current ? "step" : undefined}
            >
              <div className="flex w-full items-center">
                <span className={`h-px flex-1 ${index === 0 ? "bg-transparent" : leftOn ? "bg-foreground" : "bg-[#ddd6cc]"}`} />
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    current || done ? "bg-foreground text-white" : "bg-[#e4dfd6] text-[#6d675f]"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`h-px flex-1 ${
                    index === steps.length - 1 ? "bg-transparent" : rightOn ? "bg-foreground" : "bg-[#ddd6cc]"
                  }`}
                />
              </div>
              <p
                className={`mt-1.5 px-0.5 text-center text-[11px] leading-3.5 ${
                  current ? "font-medium text-foreground" : "text-muted/80"
                }`}
              >
                {item.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm leading-5 text-pretty text-muted/65 italic">{value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-brand"
      >
        Edit
      </button>
    </div>
  );
}

export function ScenarioBoard() {
  const { scenario, pathway, compare, loadDemo, resetScenario, loading, requestError } = useScenario();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"form" | "results">("form");
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const show = (event: Event) => {
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      const detail = (event as CustomEvent<{ id?: string; focusId?: string }>).detail;
      if (!detail?.id) return;
      pendingFocus.current = detail.focusId ?? detail.id;
      if (resultSections.has(detail.id)) {
        setMode("results");
        return;
      }
      setMode("form");
      if (detail.id === "supplier-offers") setStep(2);
      else if (detail.id === "capacity") setStep(3);
      else setStep(1);
    };
    window.addEventListener("talli-show-section", show);
    return () => window.removeEventListener("talli-show-section", show);
  }, []);

  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const target = document.getElementById(id);
    target?.focus();
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step, mode]);

  function goTo(next: number) {
    pendingFocus.current = null;
    setMode("form");
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const form = mode === "form";
  const offerSummary = scenario.offers
    .map((offer, index) => {
      const letter = String.fromCharCode(65 + index);
      if (!offer.source.trim() && !offer.quantity.trim() && !offer.price.trim()) return `${letter}: blank`;
      return `${letter}: ${offer.source.trim() || "No source"}, ${entered(offer.quantity)} @ ${entered(offer.price)}`;
    })
    .join(" · ");

  return (
    <div
      className={`flex flex-col gap-4 ${form ? "pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0" : "pb-6 lg:pb-0"}`}
    >
      {form ? <Progress step={step} /> : null}
      {mode === "results" ? (
        <div className="flex flex-col gap-3 lg:hidden">
          <h1 className="font-display text-2xl leading-tight font-medium text-foreground">
            Buying plan results
          </h1>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => goTo(1)}>
              Edit inputs
            </Button>
            <Button variant="secondary" onClick={() => expandSection("what-if")}>
              What if
            </Button>
          </div>
        </div>
      ) : null}
      <div
        className={`grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:items-stretch lg:[grid-template-areas:'pathway_capacity'_'offers_offers'_'plans_plans'_'why_compare'_'whatif_whatif'] ${form && step === 4 ? "max-lg:hidden" : ""}`}
      >
        <div className={`lg:h-full lg:[grid-area:pathway] ${showOnPhone(form && step === 1)}`}>
          <PathwaySection />
          <div className="mt-4 lg:hidden">
            <Button variant="secondary" onClick={loadDemo} disabled={loading}>
              Use simulated demo
            </Button>
          </div>
        </div>
        <div className={`min-w-0 lg:h-full lg:[grid-area:offers] ${showOnPhone(form && step === 2)}`}>
          <OffersSection />
        </div>
        <div className={`lg:h-full lg:[grid-area:capacity] ${showOnPhone(form && step === 3)}`}>
          <CapacitySection />
        </div>
        <div className={`lg:h-full lg:[grid-area:plans] ${showOnPhone(mode === "results")}`}>
          <PlansSection />
        </div>
        <div className={`lg:h-full lg:[grid-area:why] ${showOnPhone(mode === "results")}`}>
          <RationaleSection />
        </div>
        <div className={`lg:h-full lg:[grid-area:compare] ${showOnPhone(mode === "results")}`}>
          <ComparisonSection />
        </div>
        <div className={`lg:h-full lg:[grid-area:whatif] ${showOnPhone(mode === "results")}`}>
          <WhatIfSection />
        </div>
      </div>
      {form && step === 4 ? (
        <section className="rounded-3xl border border-[#ece7df] bg-surface p-5 shadow-[0_8px_24px_rgba(60,46,30,0.045)] lg:hidden">
          <ReviewRow
            label="Buyer order"
            value={`${pathway.label}. Quantity ${entered(scenario.orderQuantity)}. Price ${entered(scenario.buyerPrice)}.`}
            onEdit={() => goTo(1)}
          />
          <ReviewRow label="Supplier offers" value={offerSummary} onEdit={() => goTo(2)} />
          <ReviewRow
            label="Capacity & costs"
            value={`Capacity ${entered(scenario.capacity)}. Processing ${entered(scenario.variableCost)}. Target ${entered(scenario.targetContribution)}. Yields ${entered(scenario.yieldLow)} / ${entered(scenario.yieldTypical)} / ${entered(scenario.yieldHigh)}.`}
            onEdit={() => goTo(3)}
          />
          {requestError ? (
            <p className="pt-3 text-sm leading-6 text-[#a24b38]" role="alert">
              {requestError}
            </p>
          ) : null}
          <div className="grid gap-2 pt-3">
            <Button variant="secondary" onClick={loadDemo} disabled={loading}>
              Use simulated demo
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                resetScenario();
                goTo(1);
              }}
              disabled={loading}
            >
              Reset scenario
            </Button>
          </div>
        </section>
      ) : null}
      {form ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          {step === 1 ? (
            <Button onClick={() => goTo(2)}>Next: Offers</Button>
          ) : null}
          {step === 2 ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => goTo(1)}>
                Back
              </Button>
              <Button onClick={() => goTo(3)}>Next: Costs</Button>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => goTo(2)}>
                Back
              </Button>
              <Button onClick={() => goTo(4)}>Review</Button>
            </div>
          ) : null}
          {step === 4 ? (
            <Button onClick={compare} disabled={loading}>
              {loading ? "Comparing…" : "Compare offers"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
