"use client";

import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { Panel, SectionCard } from "@/components/ui/section-card";
import { numberError, offerPriceLabel, offerQuantityLabel } from "@/lib/scenario";
import { useScenario } from "@/components/batch/scenario-context";

const offers = [
  { id: "a", title: "Offer A", index: 0 },
  { id: "b", title: "Offer B", index: 1 },
  { id: "c", title: "Offer C", index: 2 },
] as const;

export function OffersSection() {
  const { scenario, pathway, setOffer, fieldError, isDemo } = useScenario();

  return (
    <SectionCard
      id="supplier-offers"
      step={2}
      title="Supplier offers"
      hideTitleOnMobile
      description="Up to three. Leave a row blank."
    >
      {fieldError("offers") ? (
        <p id="offers" tabIndex={-1} className="text-sm leading-6 text-[#8a3b2c]" role="alert">
          {fieldError("offers")}
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
      {offers.map((offer) => {
        const input = scenario.offers[offer.index];
        return (
          <Panel key={offer.id}>
            <fieldset className="min-w-0 border-0 p-0">
            <legend className="m-0 mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              {offer.title}
              <Badge tone={isDemo ? "solid" : "outline"}>{isDemo ? "Sample" : "Your entry"}</Badge>
            </legend>
            <div className="grid items-end gap-3">
              <TextField
                id={`offer-${offer.id}-source`}
                label="Source"
                value={input.source}
                onChange={(value) => setOffer(offer.index, "source", value)}
              />
              <TextField
                id={`offer-${offer.id}-quantity`}
                label={offerQuantityLabel(scenario, pathway)}
                inputMode="decimal"
                value={input.quantity}
                onChange={(value) => setOffer(offer.index, "quantity", value)}
                error={
                  numberError(input.quantity) ?? fieldError(`offer-${offer.id}-quantity`)
                }
              />
              <TextField
                id={`offer-${offer.id}-price`}
                label={offerPriceLabel(scenario)}
                inputMode="decimal"
                value={input.price}
                onChange={(value) => setOffer(offer.index, "price", value)}
                error={numberError(input.price) ?? fieldError(`offer-${offer.id}-price`)}
              />
            </div>
            </fieldset>
          </Panel>
        );
      })}
      </div>
    </SectionCard>
  );
}
