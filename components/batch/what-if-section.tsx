"use client";

import { useScenario } from "@/components/batch/scenario-context";
import { TextField } from "@/components/ui/field";
import { SectionCard } from "@/components/ui/section-card";
import { measureNoun } from "@/lib/scenario";

export function WhatIfSection() {
  const { scenario, pathway, setField, setOffer, planShift } = useScenario();
  const noun = measureNoun(scenario);

  return (
    <SectionCard id="what-if" step={7} title="Try a different price or capacity" collapseOnMobile>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="what-if-price"
          label={noun ? `Offer A asking price (₱/${noun})` : "Offer A asking price (₱/kg input)"}
          describedBy="what-if-help"
          inputMode="decimal"
          value={scenario.offers[0].price}
          onChange={(value) => setOffer(0, "price", value, true)}
        />
        <TextField
          id="what-if-capacity"
          label={
            noun
              ? `${pathway.capacityStep} capacity (${noun} of ${pathway.inputShort} per planning period)`
              : `${pathway.capacityStep} capacity (kg ${pathway.inputShort} per planning period)`
          }
          describedBy="what-if-help"
          inputMode="decimal"
          value={scenario.capacity}
          onChange={(value) => setField("capacity", value, true)}
        />
      </div>
      {planShift ? (
        <p className="rounded-2xl bg-inset px-4 py-3 text-sm font-medium leading-6 text-foreground" role="status">
          {planShift}
        </p>
      ) : null}
      <p id="what-if-help" className="text-sm leading-5 text-pretty text-muted/65 italic">
        Plans update after you compare.
      </p>
    </SectionCard>
  );
}
