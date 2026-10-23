"use client";

import { Button } from "@/components/ui/button";
import { ReadOnlyField, TextField } from "@/components/ui/field";
import { SectionCard } from "@/components/ui/section-card";
import { numberError } from "@/lib/scenario";
import { useScenario } from "@/components/batch/scenario-context";

export function CapacitySection() {
  const { scenario, pathway, setField, fieldError, compare, loadDemo, loading, requestError } =
    useScenario();
  const yieldDetail = `kg ${pathway.outputName} / kg ${pathway.inputShort}`;

  return (
    <SectionCard
      id="capacity"
      step={3}
      title="Capacity, costs & conversion assumptions"
    >
      <div className="grid items-end gap-4 lg:grid-cols-3">
        <TextField
          id="drying-capacity"
          label={`${pathway.capacityStep} capacity (kg ${pathway.inputShort})`}
          inputMode="decimal"
          value={scenario.capacity}
          onChange={(value) => setField("capacity", value)}
          error={numberError(scenario.capacity) ?? fieldError("drying-capacity")}
        />
        <TextField
          id="variable-cost"
          label="Variable processing cost (₱/kg input)"
          inputMode="decimal"
          value={scenario.variableCost}
          onChange={(value) => setField("variableCost", value)}
          error={numberError(scenario.variableCost) ?? fieldError("variable-cost")}
        />
        <TextField
          id="target-contribution"
          label="Target contribution (₱)"
          inputMode="decimal"
          value={scenario.targetContribution}
          onChange={(value) => setField("targetContribution", value)}
          error={numberError(scenario.targetContribution) ?? fieldError("target-contribution")}
        />
      </div>
      <div className="w-full sm:max-w-xs">
        <ReadOnlyField id="assumptions" label="Assumptions" value="Simulated" />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Output per kg input</p>
        <div className="grid items-end gap-4 lg:grid-cols-3">
          <TextField
            id="yield-low"
            label="Low"
            detail={yieldDetail}
            inputMode="decimal"
            value={scenario.yieldLow}
            onChange={(value) => setField("yieldLow", value)}
            error={numberError(scenario.yieldLow) ?? fieldError("yield-low")}
          />
          <TextField
            id="yield-typical"
            label="Typical"
            detail={yieldDetail}
            inputMode="decimal"
            value={scenario.yieldTypical}
            onChange={(value) => setField("yieldTypical", value)}
            error={numberError(scenario.yieldTypical) ?? fieldError("yield-typical")}
          />
          <TextField
            id="yield-high"
            label="High"
            detail={yieldDetail}
            inputMode="decimal"
            value={scenario.yieldHigh}
            onChange={(value) => setField("yieldHigh", value)}
            error={numberError(scenario.yieldHigh) ?? fieldError("yield-high")}
          />
        </div>
      </div>
      <p className="text-xs leading-5 text-pretty text-muted">
        Scenario assumptions only, not verified local yields.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={loadDemo} disabled={loading}>
          Use simulated demo
        </Button>
        <Button onClick={compare} disabled={loading}>
          {loading ? "Comparing…" : "Compare offers"}
        </Button>
      </div>
      {requestError ? (
        <p className="text-sm leading-6 text-[#a24b38]" role="alert">
          {requestError}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-pretty text-muted">
        The simulated demo is sample data, not a verified local batch.
      </p>
    </SectionCard>
  );
}
