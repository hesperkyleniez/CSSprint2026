"use client";

import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { Panel, SectionCard } from "@/components/ui/section-card";
import { numberError } from "@/lib/scenario";
import { useScenario } from "@/components/batch/scenario-context";

const offers = [
  { id: "a", title: "Offer A", index: 0 },
  { id: "b", title: "Offer B", index: 1 },
  { id: "c", title: "Offer C", index: 2 },
] as const;

export function OffersSection() {
  const { scenario, pathway, setOffer, fieldError } = useScenario();

  return (
    <SectionCard
      id="supplier-offers"
      step={2}
      title="Supplier offers"
      description="Each offer is accepted in full or declined. All three use the selected input."
    >
      {fieldError("offers") ? (
        <p className="text-sm leading-6 text-[#a24b38]" role="alert">
          {fieldError("offers")}
        </p>
      ) : null}
      {offers.map((offer) => {
        const input = scenario.offers[offer.index];
        return (
          <Panel key={offer.id}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{offer.title}</h3>
              <Badge>Simulated</Badge>
            </div>
            <div className="grid items-end gap-3 lg:grid-cols-3">
              <TextField
                id={`offer-${offer.id}-source`}
                label="Source"
                value={input.source}
                onChange={(value) => setOffer(offer.index, "source", value)}
              />
              <TextField
                id={`offer-${offer.id}-quantity`}
                label={`Quantity (kg ${pathway.inputName})`}
                inputMode="decimal"
                value={input.quantity}
                onChange={(value) => setOffer(offer.index, "quantity", value)}
                error={
                  numberError(input.quantity) ?? fieldError(`offer-${offer.id}-quantity`)
                }
              />
              <TextField
                id={`offer-${offer.id}-price`}
                label="Asking price (₱/kg input)"
                inputMode="decimal"
                value={input.price}
                onChange={(value) => setOffer(offer.index, "price", value)}
                error={numberError(input.price) ?? fieldError(`offer-${offer.id}-price`)}
              />
            </div>
          </Panel>
        );
      })}
    </SectionCard>
  );
}
