"use client";

import { SectionCard } from "@/components/ui/section-card";
import { useScenario } from "@/components/batch/scenario-context";
import { kilograms, peso } from "@/lib/format";

function sliderNumber(raw: string) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function WhatIfControl({
  id,
  label,
  raw,
  max,
  display,
  onChange,
}: {
  id: string;
  label: string;
  raw: string;
  max: number;
  display: string;
  onChange: (value: string) => void;
}) {
  const value = Math.min(sliderNumber(raw), max);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium leading-5 text-pretty text-foreground">
        {label}
      </label>
      <div className="flex min-w-0 items-center gap-3">
        <input
          id={id}
          name={id}
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          aria-valuetext={raw.trim() === "" ? "Not set" : display}
          onChange={(event) => onChange(event.target.value)}
          className="assumption-slider min-w-0"
        />
        <span className="w-20 shrink-0 text-right text-sm tabular-nums text-foreground">
          {raw.trim() === "" ? "—" : display}
        </span>
      </div>
    </div>
  );
}

export function WhatIfSection() {
  const { scenario, pathway, setField, setOffer } = useScenario();
  const price = sliderNumber(scenario.offers[0].price);
  const capacity = sliderNumber(scenario.capacity);

  return (
    <SectionCard id="what-if" step={7} title="What-if controls">
      <WhatIfControl
        id="what-if-price"
        label="Offer A asking price (₱/kg input)"
        raw={scenario.offers[0].price}
        max={Math.max(240, Math.ceil(price))}
        display={peso(price)}
        onChange={(value) => setOffer(0, "price", value, true)}
      />
      <WhatIfControl
        id="what-if-capacity"
        label={`${pathway.capacityStep} capacity (kg ${pathway.inputShort} per planning period)`}
        raw={scenario.capacity}
        max={Math.max(400, Math.ceil(capacity))}
        display={`${kilograms(capacity)} kg`}
        onChange={(value) => setField("capacity", value, true)}
      />
      <p className="text-xs leading-5 text-pretty text-muted">
        The price control edits Offer A. The capacity control edits the capacity field. After a
        comparison, moving either one refreshes the plans.
      </p>
    </SectionCard>
  );
}
