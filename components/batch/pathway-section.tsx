"use client";

import { ReadOnlyField, SelectField, TextField } from "@/components/ui/field";
import { expandSection, sectionForField, SectionCard } from "@/components/ui/section-card";
import {
  buyerNeedsLabel,
  buyerPriceLabel,
  measureNoun,
  numberError,
  orderQuantityLabel,
  pathways,
  type PathwayId,
} from "@/lib/scenario";
import { useScenario } from "@/components/batch/scenario-context";

function ScenarioErrors() {
  const { fieldErrors } = useScenario();
  const entries = Object.entries(fieldErrors);
  if (entries.length === 0) return null;

  return (
    <div
      id="scenario-errors"
      tabIndex={-1}
      role="alert"
      className="scroll-mt-4 rounded-2xl border border-[#a24b38]/40 bg-white px-4 py-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <p className="text-sm font-medium text-foreground">Check these entries before comparing.</p>
      <ul className="mt-2 flex flex-col gap-1">
        {entries.map(([id, message]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="inline-flex min-h-11 items-center text-sm leading-6 text-[#8a3b2c] underline decoration-[#a24b38]/40 underline-offset-2"
              onClick={(event) => {
                event.preventDefault();
                expandSection(sectionForField(id), id);
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PathwaySection() {
  const {
    scenario,
    pathway,
    setPathwayId,
    setQuantityMeasure,
    setField,
    fieldError,
    pathwayNotice,
    isDemo,
  } = useScenario();
  const noun = measureNoun(scenario);

  return (
    <SectionCard
      id="processing-pathway"
      step={1}
      title="Processing pathway & buyer order"
      hideTitleOnMobile
    >
      <SelectField
        id="pathway"
        label="Processing pathway"
        value={scenario.pathwayId}
        onChange={(value) => setPathwayId(value as PathwayId)}
        hint={`Buys ${pathway.inputShort}. Sells ${pathway.outputName}.`}
      >
        {pathways.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="quantity-measure"
        label="How you count quantity"
        value={scenario.quantityMeasure}
        onChange={(value) => setQuantityMeasure(value === "other" ? "other" : "kg")}
        hint="Use kg, or a sack if you count units."
      >
        <option value="kg">Kilograms</option>
        <option value="other">Sacks or another unit</option>
      </SelectField>
      {noun ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 lg:grid-cols-3">
            <TextField
              id="unit-name"
              label="What do you call one unit?"
              detail="Sack or kaing."
              value={scenario.unitName}
              onChange={(value) => setField("unitName", value)}
              error={fieldError("unit-name")}
            />
            <TextField
              id="input-kg-per-unit"
              label={`One ${noun} of ${pathway.inputShort} weighs`}
              detail="In kilograms."
              inputMode="decimal"
              value={scenario.inputKgPerUnit}
              onChange={(value) => setField("inputKgPerUnit", value)}
              error={numberError(scenario.inputKgPerUnit) ?? fieldError("input-kg-per-unit")}
            />
            <TextField
              id="order-kg-per-unit"
              label={`One ${noun} of ${pathway.outputName} weighs`}
              detail="In kilograms."
              inputMode="decimal"
              value={scenario.orderKgPerUnit}
              onChange={(value) => setField("orderKgPerUnit", value)}
              error={numberError(scenario.orderKgPerUnit) ?? fieldError("order-kg-per-unit")}
            />
          </div>
          <p className="text-sm leading-5 text-pretty text-muted/65 italic">
            Weights can differ. Talli converts both to kg.
          </p>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <ReadOnlyField id="order-status" label="Order status" value={isDemo ? "Sample order" : "Your order"} />
        <ReadOnlyField
          id="buyer-needs"
          label="Buyer needs"
          value={buyerNeedsLabel(pathway)}
        />
      </div>
      <ScenarioErrors />
      {pathwayNotice ? (
        <p className="rounded-2xl bg-inset px-4 py-3 text-sm leading-6 text-foreground" role="status">
          {pathwayNotice}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="order-quantity"
          label={orderQuantityLabel(scenario, pathway)}
          inputMode="decimal"
          value={scenario.orderQuantity}
          onChange={(value) => setField("orderQuantity", value)}
          error={numberError(scenario.orderQuantity) ?? fieldError("order-quantity")}
        />
        <TextField
          id="buyer-price"
          label={buyerPriceLabel(scenario)}
          inputMode="decimal"
          value={scenario.buyerPrice}
          onChange={(value) => setField("buyerPrice", value)}
          error={numberError(scenario.buyerPrice) ?? fieldError("buyer-price")}
        />
      </div>
    </SectionCard>
  );
}
