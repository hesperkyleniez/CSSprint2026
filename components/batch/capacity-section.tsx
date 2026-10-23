"use client";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { SectionCard } from "@/components/ui/section-card";
import { capacityQuantityLabel, numberError, variableCostLabel } from "@/lib/scenario";
import { useScenario } from "@/components/batch/scenario-context";

export function CapacitySection() {
  const { scenario, pathway, setField, fieldError, compare, loadDemo, resetScenario, loading, requestError } =
    useScenario();

  return (
    <>
    <SectionCard
      id="capacity"
      step={3}
      title="Capacity, costs & conversion assumptions"
      hideTitleOnMobile
    >
      <div className="grid items-end gap-3 sm:grid-cols-2">
        <TextField
          id="drying-capacity"
          label={capacityQuantityLabel(scenario, pathway)}
          inputMode="decimal"
          value={scenario.capacity}
          onChange={(value) => setField("capacity", value)}
          error={numberError(scenario.capacity) ?? fieldError("drying-capacity")}
        />
        <TextField
          id="variable-cost"
          label={variableCostLabel(scenario)}
          inputMode="decimal"
          value={scenario.variableCost}
          onChange={(value) => setField("variableCost", value)}
          error={numberError(scenario.variableCost) ?? fieldError("variable-cost")}
        />
        <TextField
          id="target-contribution"
          label="Least you want to clear (₱)"
          detail="Your goal if yield is low."
          inputMode="decimal"
          value={scenario.targetContribution}
          onChange={(value) => setField("targetContribution", value)}
          error={numberError(scenario.targetContribution) ?? fieldError("target-contribution")}
        />
      </div>
      <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0">
        <legend className="m-0 text-sm font-medium text-foreground">
          Output from 1 kg of {pathway.inputShort}
        </legend>
        <p id="yield-hint" className="text-sm leading-5 text-pretty text-muted/65 italic">
          Weak, normal, and strong batch.
        </p>
        <div className="grid items-end gap-3 sm:grid-cols-3">
          <TextField
            id="yield-low"
            label="Low yield"
            describedBy="yield-hint"
            inputMode="decimal"
            value={scenario.yieldLow}
            onChange={(value) => setField("yieldLow", value)}
            error={numberError(scenario.yieldLow) ?? fieldError("yield-low")}
          />
          <TextField
            id="yield-typical"
            label="Typical yield"
            describedBy="yield-hint"
            inputMode="decimal"
            value={scenario.yieldTypical}
            onChange={(value) => setField("yieldTypical", value)}
            error={numberError(scenario.yieldTypical) ?? fieldError("yield-typical")}
          />
          <TextField
            id="yield-high"
            label="High yield"
            describedBy="yield-hint"
            inputMode="decimal"
            value={scenario.yieldHigh}
            onChange={(value) => setField("yieldHigh", value)}
            error={numberError(scenario.yieldHigh) ?? fieldError("yield-high")}
          />
        </div>
      </fieldset>
      <div className="hidden gap-2 lg:grid lg:grid-cols-3">
        <Button variant="secondary" onClick={loadDemo} disabled={loading}>
          Use simulated demo
        </Button>
        <Button onClick={compare} disabled={loading}>
          {loading ? "Comparing…" : "Compare offers"}
        </Button>
        <Button variant="quiet" onClick={resetScenario} disabled={loading}>
          Reset scenario
        </Button>
      </div>
      {requestError ? (
        <p className="text-sm leading-6 text-[#a24b38]" role="alert">
          {requestError}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-pretty text-muted/65 italic">
        Sample data, not a verified batch.
      </p>
    </SectionCard>
    </>
  );
}
