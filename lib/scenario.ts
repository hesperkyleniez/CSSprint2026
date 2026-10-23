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

export type QuantityMeasure = "kg" | "other";

export type ScenarioInput = {
  pathwayId: PathwayId;
  quantityMeasure: QuantityMeasure;
  unitName: string;
  inputKgPerUnit: string;
  orderKgPerUnit: string;
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
  quantityMeasure: "kg",
  unitName: "",
  inputKgPerUnit: "",
  orderKgPerUnit: "",
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

export function measureNoun(scenario: Pick<ScenarioInput, "quantityMeasure" | "unitName">) {
  if (scenario.quantityMeasure !== "other") return null;
  const name = scenario.unitName.trim();
  return name || "unit";
}

export function orderQuantityLabel(scenario: ScenarioInput, pathway: Pathway) {
  const noun = measureNoun(scenario);
  if (!noun) return `Order quantity (kg ${pathway.outputName})`;
  return `Order quantity (${noun} of ${pathway.outputName})`;
}

export function buyerPriceLabel(scenario: ScenarioInput) {
  const noun = measureNoun(scenario);
  if (!noun) return "Buyer price (₱/kg)";
  return `Buyer price (₱/${noun})`;
}

export function offerQuantityLabel(scenario: ScenarioInput, pathway: Pathway) {
  const noun = measureNoun(scenario);
  if (!noun) return `Quantity (kg ${pathway.inputName})`;
  return `Quantity (${noun} of ${pathway.inputName})`;
}

export function offerPriceLabel(scenario: ScenarioInput) {
  const noun = measureNoun(scenario);
  if (!noun) return "Asking price (₱/kg input)";
  return `Asking price (₱/${noun})`;
}

export function capacityQuantityLabel(scenario: ScenarioInput, pathway: Pathway) {
  const noun = measureNoun(scenario);
  if (!noun) return `${pathway.capacityStep} capacity (kg ${pathway.inputShort})`;
  return `${pathway.capacityStep} capacity (${noun} of ${pathway.inputShort})`;
}

export function variableCostLabel(scenario: ScenarioInput) {
  const noun = measureNoun(scenario);
  if (!noun) return "Variable processing cost (₱/kg input)";
  return `Variable processing cost (₱/${noun} of input)`;
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
