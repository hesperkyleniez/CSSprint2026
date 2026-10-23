"use client";

import { ReadOnlyField, SelectField, TextField } from "@/components/ui/field";
import { SectionCard } from "@/components/ui/section-card";
import {
  buyerNeedsLabel,
  numberError,
  pathways,
  type PathwayId,
} from "@/lib/scenario";
import { useScenario } from "@/components/batch/scenario-context";

export function PathwaySection() {
  const { scenario, pathway, setPathwayId, setField, fieldError, pathwayNotice, isDemo } = useScenario();

  return (
    <SectionCard
      id="processing-pathway"
      step={1}
      title="Processing pathway & buyer order"
    >
      <SelectField
        id="pathway"
        label="Processing pathway"
        value={scenario.pathwayId}
        onChange={(value) => setPathwayId(value as PathwayId)}
        hint={`Pathway sets supplier input, buyer output, capacity step, and conversion units. This scenario buys ${pathway.inputName} and sells ${pathway.outputName}.`}
      >
        {pathways.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField id="order-status" label="Order status" value={isDemo ? "Simulated sample order" : "Manual scenario; unverified"} />
        <ReadOnlyField
          id="buyer-needs"
          label="Buyer needs"
          value={buyerNeedsLabel(pathway)}
        />
      </div>
      {pathwayNotice ? (
        <p className="rounded-lg border border-kernel/30 bg-inset px-3 py-2 text-sm leading-6 text-foreground" role="status">
          {pathwayNotice}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="order-quantity"
          label={`Order quantity (kg ${pathway.outputName})`}
          inputMode="decimal"
          value={scenario.orderQuantity}
          onChange={(value) => setField("orderQuantity", value)}
          error={numberError(scenario.orderQuantity) ?? fieldError("order-quantity")}
        />
        <TextField
          id="buyer-price"
          label="Buyer price (₱/kg)"
          inputMode="decimal"
          value={scenario.buyerPrice}
          onChange={(value) => setField("buyerPrice", value)}
          error={numberError(scenario.buyerPrice) ?? fieldError("buyer-price")}
        />
      </div>
    </SectionCard>
  );
}
