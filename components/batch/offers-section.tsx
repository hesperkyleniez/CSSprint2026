"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { Panel, SectionCard } from "@/components/ui/section-card";
import { maxOfferCount, minOfferCount, numberError, offerLetter, offerPriceLabel, offerQuantityLabel } from "@/lib/scenario";
import { useScenario } from "@/components/batch/scenario-context";

export function OffersSection() {
  const { scenario, pathway, setOffer, addOffer, removeOffer, fieldError, isDemo } = useScenario();
  const canRemove = scenario.offers.length > minOfferCount;
  const canAdd = scenario.offers.length < maxOfferCount;
  const scroller = useRef<HTMLDivElement>(null);
  const previousCount = useRef(scenario.offers.length);

  useEffect(() => {
    if (scenario.offers.length > previousCount.current) {
      scroller.current?.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "end",
      });
    }
    previousCount.current = scenario.offers.length;
  }, [scenario.offers.length]);

  return (
    <SectionCard
      id="supplier-offers"
      step={2}
      title="Supplier offers"
      hideTitleOnMobile
      description="At least two. Add another if you have one."
    >
      {fieldError("offers") ? (
        <p id="offers" tabIndex={-1} className="text-sm leading-6 text-[#8a3b2c]" role="alert">
          {fieldError("offers")}
        </p>
      ) : null}
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1"
      >
      {scenario.offers.map((input, index) => {
        const id = offerLetter(index);
        return (
          <div key={id} className="w-[calc(100%-2.75rem)] shrink-0 snap-start lg:w-[calc((100%-1.5rem)/3)]">
          <Panel>
            <fieldset className="min-w-0 border-0 p-0">
            <legend className="m-0 mb-2 flex w-full items-center justify-between gap-2 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2">
                Offer {id.toUpperCase()}
                <Badge tone={isDemo ? "solid" : "outline"}>{isDemo ? "Sample" : "Your entry"}</Badge>
              </span>
              {canRemove ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center text-sm font-medium text-muted"
                  onClick={() => removeOffer(index)}
                >
                  Remove
                </button>
              ) : null}
            </legend>
            <div className="grid items-end gap-3">
              <TextField
                id={`offer-${id}-source`}
                label="Source"
                value={input.source}
                onChange={(value) => setOffer(index, "source", value)}
              />
              <TextField
                id={`offer-${id}-quantity`}
                label={offerQuantityLabel(scenario, pathway)}
                inputMode="decimal"
                value={input.quantity}
                onChange={(value) => setOffer(index, "quantity", value)}
                error={
                  numberError(input.quantity) ?? fieldError(`offer-${id}-quantity`)
                }
              />
              <TextField
                id={`offer-${id}-price`}
                label={offerPriceLabel(scenario)}
                inputMode="decimal"
                value={input.price}
                onChange={(value) => setOffer(index, "price", value)}
                error={numberError(input.price) ?? fieldError(`offer-${id}-price`)}
              />
            </div>
            </fieldset>
          </Panel>
          </div>
        );
      })}
      </div>
      {canAdd ? (
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9d3c9] bg-white px-5 text-sm font-medium text-foreground transition hover:bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            onClick={addOffer}
          >
            Add more
          </button>
        </div>
      ) : null}
    </SectionCard>
  );
}
