export const pathways = [
  {
    id: "fresh-to-dried",
    label: "Fresh fruit with pulp → dried nut-in-shell",
    inputName: "fresh pili fruit with pulp",
    inputShort: "fresh pili",
    outputName: "dried nut-in-shell",
    capacityStep: "Drying",
  },
  {
    id: "dried-to-kernel",
    label: "Dried nut-in-shell → kernel",
    inputName: "dried nut-in-shell",
    inputShort: "dried nut-in-shell",
    outputName: "kernel",
    capacityStep: "Shelling",
  },
] as const;

export type PathwayId = (typeof pathways)[number]["id"];
export type Pathway = (typeof pathways)[number];

export type OfferInput = {
  source: string;
  quantity: string;
  price: string;
};

export type ScenarioInput = {
  pathwayId: PathwayId;
  orderQuantity: string;
  buyerPrice: string;
  offers: [OfferInput, OfferInput, OfferInput];
  capacity: string;
  variableCost: string;
  targetContribution: string;
  yieldLow: string;
  yieldTypical: string;
  yieldHigh: string;
};

const emptyOffer = (): OfferInput => ({
  source: "",
  quantity: "",
  price: "",
});

export const emptyScenario: ScenarioInput = {
  pathwayId: "fresh-to-dried",
  orderQuantity: "",
  buyerPrice: "",
  offers: [emptyOffer(), emptyOffer(), emptyOffer()],
  capacity: "",
  variableCost: "",
  targetContribution: "",
  yieldLow: "",
  yieldTypical: "",
  yieldHigh: "",
};

export function getPathway(id: PathwayId): Pathway {
  const pathway = pathways.find((item) => item.id === id);
  if (!pathway) {
    return pathways[0];
  }
  return pathway;
}

export function buyerNeedsLabel(pathway: Pathway) {
  const output =
    pathway.outputName.charAt(0).toUpperCase() + pathway.outputName.slice(1);
  return `${output} (set by pathway)`;
}

export function numberError(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "." || Number(trimmed) < 0) {
    return "Enter a number, like 120 or 12.5.";
  }
  return undefined;
}
