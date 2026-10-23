import { getPathway, pathways, type Pathway, type PathwayId } from "./scenario";

export const offerIds = ["a", "b", "c"] as const;
export type OfferId = (typeof offerIds)[number];

export type YieldKey = "low" | "typical" | "high";

export type YieldMath = {
  outputKg: number;
  orderCoverageKg: number;
  orderCoveragePct: number;
  unmatchedOutputKg: number;
  sales: number;
  contribution: number;
  walkAwayPricePerKg: number;
};

export type PlanResult = {
  offers: OfferId[];
  selectedOffers: string;
  capacityUsedKg: number;
  capacityRemainingKg: number;
  outputKg: Record<YieldKey, number>;
  orderCoverageKg: number;
  orderCoveragePct: number;
  unmatchedOutputKg: number;
  contribution: Record<YieldKey, number>;
  walkAwayPricePerKg: number;
  scenarios: Record<YieldKey, YieldMath>;
  reason: string;
};

export type CombinationResult = {
  offers: OfferId[];
  label: string;
  feasible: boolean;
  capacityUsedKg: number;
  typicalContribution: number;
  lowContribution: number;
  meetsLowYieldTarget: boolean;
  ruledOutReason: string | null;
};

export type OfferDecision = {
  id: OfferId;
  source: string;
  entered: boolean;
  decision: "accepted" | "declined" | "not_entered";
  reason: string;
};

export type OptimizeSuccess = {
  ok: true;
  pathway: Pathway;
  planA: PlanResult | null;
  planB: PlanResult | null;
  planBReason: string;
  offers: OfferDecision[];
  combinations: CombinationResult[];
};

export type OptimizeFailure = {
  ok: false;
  error: string;
  fieldErrors: Record<string, string>;
};

export type OptimizeResult = OptimizeSuccess | OptimizeFailure;

type ParsedOffer = {
  id: OfferId;
  source: string;
  quantityKg: number;
  pricePerKg: number;
};

type ParsedScenario = {
  pathway: Pathway;
  orderQuantityKg: number;
  buyerPricePerKg: number;
  capacityKg: number;
  variableCostPerKg: number;
  targetContribution: number;
  yields: Record<YieldKey, number>;
  offers: Array<ParsedOffer | null>;
};

type RawCombination = {
  offers: ParsedOffer[];
  inputKg: number;
  rawMaterialCost: number;
  processingCost: number;
  feasible: boolean;
  scenarios: Record<YieldKey, YieldMath>;
};

const yieldKeys: YieldKey[] = ["low", "typical", "high"];

const fieldIds = {
  orderQuantity: "order-quantity",
  buyerPrice: "buyer-price",
  capacity: "drying-capacity",
  variableCost: "variable-cost",
  targetContribution: "target-contribution",
  yieldLow: "yield-low",
  yieldTypical: "yield-typical",
  yieldHigh: "yield-high",
} as const;

export function optimizeScenario(input: unknown): OptimizeResult {
  const parsed = parseScenario(input);
  if (!parsed.ok) return parsed;
  return evaluate(parsed.data);
}

function parseScenario(
  input: unknown,
): { ok: true; data: ParsedScenario } | OptimizeFailure {
  if (!isRecord(input)) {
    return failure("Request body must be a scenario object.");
  }

  const fieldErrors: Record<string, string> = {};
  const pathwayId = input.pathwayId;
  if (!isPathwayId(pathwayId)) {
    fieldErrors.pathway = "Select a processing pathway.";
  }

  const orderQuantityKg = readNumber(
    input.orderQuantity,
    fieldIds.orderQuantity,
    "Order quantity",
    fieldErrors,
  );
  const buyerPricePerKg = readNumber(
    input.buyerPrice,
    fieldIds.buyerPrice,
    "Buyer price",
    fieldErrors,
  );
  const capacityKg = readNumber(
    input.capacity,
    fieldIds.capacity,
    "Capacity",
    fieldErrors,
  );
  const variableCostPerKg = readNumber(
    input.variableCost,
    fieldIds.variableCost,
    "Variable processing cost",
    fieldErrors,
  );
  const targetContribution = readNumber(
    input.targetContribution,
    fieldIds.targetContribution,
    "Target contribution",
    fieldErrors,
  );
  const yieldLow = readNumber(input.yieldLow, fieldIds.yieldLow, "Low yield", fieldErrors);
  const yieldTypical = readNumber(
    input.yieldTypical,
    fieldIds.yieldTypical,
    "Typical yield",
    fieldErrors,
  );
  const yieldHigh = readNumber(
    input.yieldHigh,
    fieldIds.yieldHigh,
    "High yield",
    fieldErrors,
  );

  const offers = readOffers(input.offers, fieldErrors);
  const entered = offers?.filter((offer) => offer !== null) ?? [];
  if (offers && entered.length === 0 && !Object.keys(fieldErrors).some((key) => key.startsWith("offer-"))) {
    fieldErrors.offers = "Enter a quantity and asking price for at least one offer.";
  }

  if (
    yieldLow !== null &&
    yieldTypical !== null &&
    yieldHigh !== null &&
    (yieldLow > yieldTypical || yieldTypical > yieldHigh)
  ) {
    fieldErrors[fieldIds.yieldTypical] =
      "Keep low yield at or below typical, and typical at or below high.";
  }

  if (Object.keys(fieldErrors).length > 0 || !offers || !isPathwayId(pathwayId)) {
    return {
      ok: false,
      error: "Check the scenario fields.",
      fieldErrors,
    };
  }

  if (
    orderQuantityKg === null ||
    buyerPricePerKg === null ||
    capacityKg === null ||
    variableCostPerKg === null ||
    targetContribution === null ||
    yieldLow === null ||
    yieldTypical === null ||
    yieldHigh === null
  ) {
    return failure("Check the scenario fields.", fieldErrors);
  }

  return {
    ok: true,
    data: {
      pathway: getPathway(pathwayId),
      orderQuantityKg,
      buyerPricePerKg,
      capacityKg,
      variableCostPerKg,
      targetContribution,
      yields: { low: yieldLow, typical: yieldTypical, high: yieldHigh },
      offers,
    },
  };
}

function evaluate(scenario: ParsedScenario): OptimizeSuccess {
  const entered = scenario.offers.filter((offer): offer is ParsedOffer => offer !== null);
  const combinations = enumerate(entered).map((offers) =>
    evaluateCombination(scenario, offers),
  );
  const feasible = combinations.filter((combination) => combination.feasible);
  const planARaw = bestBy(feasible, (combination) => combination.scenarios.typical.contribution);

  const lowTargetHits = feasible.filter(
    (combination) =>
      combination.scenarios.low.contribution + 0.001 >= scenario.targetContribution,
  );
  const planAMeetsLowTarget =
    planARaw !== null &&
    lowTargetHits.some((combination) => sameOffers(combination, planARaw));
  const planBRaw = planAMeetsLowTarget
    ? null
    : bestBy(
        lowTargetHits.filter(
          (combination) => planARaw === null || !sameOffers(combination, planARaw),
        ),
        (combination) => combination.scenarios.typical.contribution,
      );

  const planA = planARaw ? toPlan(scenario, planARaw, planReason(scenario, planARaw, "a", planARaw)) : null;
  const planB = planBRaw
    ? toPlan(scenario, planBRaw, planReason(scenario, planBRaw, "b", planARaw))
    : null;

  return {
    ok: true,
    pathway: scenario.pathway,
    planA,
    planB,
    planBReason: planB?.reason ?? planBFallback(scenario, planARaw, lowTargetHits, feasible),
    offers: offerDecisions(scenario, planARaw),
    combinations: combinations.map((combination) =>
      toCombinationView(scenario, combination, planARaw, planBRaw),
    ),
  };
}

function evaluateCombination(
  scenario: ParsedScenario,
  offers: ParsedOffer[],
): RawCombination {
  const inputKg = offers.reduce((sum, offer) => sum + offer.quantityKg, 0);
  const rawMaterialCost = offers.reduce(
    (sum, offer) => sum + offer.quantityKg * offer.pricePerKg,
    0,
  );
  const processingCost = inputKg * scenario.variableCostPerKg;
  const feasible = inputKg <= scenario.capacityKg + 1e-9;
  const scenarios = Object.fromEntries(
    yieldKeys.map((key) => [
      key,
      yieldMath(scenario, inputKg, rawMaterialCost, processingCost, scenario.yields[key]),
    ]),
  ) as Record<YieldKey, YieldMath>;

  return { offers, inputKg, rawMaterialCost, processingCost, feasible, scenarios };
}

function yieldMath(
  scenario: ParsedScenario,
  inputKg: number,
  rawMaterialCost: number,
  processingCost: number,
  yieldPerKg: number,
): YieldMath {
  const outputKg = inputKg * yieldPerKg;
  const orderCoverageKg = Math.min(outputKg, scenario.orderQuantityKg);
  const unmatchedOutputKg = Math.max(0, outputKg - scenario.orderQuantityKg);
  const sales = orderCoverageKg * scenario.buyerPricePerKg;
  const contribution = sales - rawMaterialCost - processingCost;
  const walkAwayPricePerKg =
    inputKg > 0 ? (sales - processingCost - scenario.targetContribution) / inputKg : 0;
  const orderCoveragePct =
    scenario.orderQuantityKg > 0 ? (orderCoverageKg / scenario.orderQuantityKg) * 100 : 0;

  return {
    outputKg: round(outputKg, 3),
    orderCoverageKg: round(orderCoverageKg, 3),
    orderCoveragePct: round(orderCoveragePct, 1),
    unmatchedOutputKg: round(unmatchedOutputKg, 3),
    sales: round(sales, 2),
    contribution: round(contribution, 2),
    walkAwayPricePerKg: round(walkAwayPricePerKg, 2),
  };
}

function toPlan(
  scenario: ParsedScenario,
  combination: RawCombination,
  reason: string,
): PlanResult {
  const typical = combination.scenarios.typical;
  return {
    offers: combination.offers.map((offer) => offer.id),
    selectedOffers: offerList(combination.offers.map((offer) => offer.id)),
    capacityUsedKg: round(combination.inputKg, 3),
    capacityRemainingKg: round(Math.max(0, scenario.capacityKg - combination.inputKg), 3),
    outputKg: {
      low: combination.scenarios.low.outputKg,
      typical: combination.scenarios.typical.outputKg,
      high: combination.scenarios.high.outputKg,
    },
    orderCoverageKg: typical.orderCoverageKg,
    orderCoveragePct: typical.orderCoveragePct,
    unmatchedOutputKg: typical.unmatchedOutputKg,
    contribution: {
      low: combination.scenarios.low.contribution,
      typical: typical.contribution,
      high: combination.scenarios.high.contribution,
    },
    walkAwayPricePerKg: typical.walkAwayPricePerKg,
    scenarios: combination.scenarios,
    reason,
  };
}

function toCombinationView(
  scenario: ParsedScenario,
  combination: RawCombination,
  planA: RawCombination | null,
  planB: RawCombination | null,
): CombinationResult {
  const meetsLowYieldTarget =
    combination.scenarios.low.contribution + 0.001 >= scenario.targetContribution;
  const isRecommended =
    (planA !== null && sameOffers(combination, planA)) ||
    (planB !== null && sameOffers(combination, planB));
  return {
    offers: combination.offers.map((offer) => offer.id),
    label: offerList(combination.offers.map((offer) => offer.id)),
    feasible: combination.feasible,
    capacityUsedKg: round(combination.inputKg, 3),
    typicalContribution: combination.scenarios.typical.contribution,
    lowContribution: combination.scenarios.low.contribution,
    meetsLowYieldTarget: combination.feasible && meetsLowYieldTarget,
    ruledOutReason: isRecommended ? null : ruledOutReason(scenario, combination, planA),
  };
}

function planReason(
  scenario: ParsedScenario,
  combination: RawCombination,
  which: "a" | "b",
  planA: RawCombination | null,
): string {
  const step = scenario.pathway.capacityStep.toLowerCase();
  const used = kgText(combination.inputKg);
  const capacity = kgText(scenario.capacityKg);
  const usedPct =
    scenario.capacityKg > 0
      ? round((combination.inputKg / scenario.capacityKg) * 100, 1)
      : 0;
  const low = combination.scenarios.low.contribution;
  const typical = combination.scenarios.typical.contribution;
  const meets = low + 0.001 >= scenario.targetContribution;

  if (which === "a") {
    return `Highest typical contribution among capacity-feasible mixes: ${peso(typical)}. Uses ${used} kg of the ${capacity} kg ${step} capacity (${usedPct}%). Low-yield contribution is ${peso(low)}, which ${meets ? "meets" : "misses"} the ${peso(scenario.targetContribution)} target.`;
  }

  const planATypical = planA ? planA.scenarios.typical.contribution : typical;
  return `Meets the ${peso(scenario.targetContribution)} target at low yield with ${peso(low)}. Typical contribution is ${peso(typical)}, compared with ${peso(planATypical)} for Plan A. Uses ${used} kg of the ${capacity} kg ${step} capacity (${usedPct}%).`;
}

function planBFallback(
  scenario: ParsedScenario,
  planA: RawCombination | null,
  lowTargetHits: RawCombination[],
  feasible: RawCombination[],
): string {
  if (
    planA &&
    lowTargetHits.some((combination) => sameOffers(combination, planA))
  ) {
    return `Plan A already meets the ${peso(scenario.targetContribution)} target under low yield (${peso(planA.scenarios.low.contribution)}), so there is no separate conservative plan.`;
  }

  const bestLow = feasible.reduce<number | null>((best, combination) => {
    const contribution = combination.scenarios.low.contribution;
    return best === null || contribution > best ? contribution : best;
  }, null);

  if (bestLow === null) {
    return `No mix fits the ${kgText(scenario.capacityKg)} kg ${scenario.pathway.capacityStep.toLowerCase()} capacity, so there is no low-yield plan.`;
  }

  return `No capacity-feasible mix meets the ${peso(scenario.targetContribution)} target under low yield. The best low-yield contribution is ${peso(bestLow)}.`;
}

function ruledOutReason(
  scenario: ParsedScenario,
  combination: RawCombination,
  planA: RawCombination | null,
): string {
  if (!combination.feasible) {
    return `Ruled out by capacity: uses ${kgText(combination.inputKg)} kg, above the ${kgText(scenario.capacityKg)} kg ${scenario.pathway.capacityStep.toLowerCase()} limit.`;
  }

  const typical = combination.scenarios.typical.contribution;
  const low = combination.scenarios.low.contribution;
  const meets = low + 0.001 >= scenario.targetContribution;
  const compared = planA
    ? ` Ruled out by contribution: typical contribution is ${peso(typical)}, below Plan A at ${peso(planA.scenarios.typical.contribution)}.`
    : "";
  const targetNote = meets
    ? ` Low-yield contribution is ${peso(low)}, which meets the ${peso(scenario.targetContribution)} target.`
    : ` Ruled out for the low-yield target: ${peso(low)} is below ${peso(scenario.targetContribution)}.`;
  return `${compared}${targetNote}`.trim();
}

function offerDecisions(
  scenario: ParsedScenario,
  planA: RawCombination | null,
): OfferDecision[] {
  const accepted = new Set(planA?.offers.map((offer) => offer.id) ?? []);
  return scenario.offers.map((offer, index) => {
    const id = offerIds[index];
    if (!offer) {
      return {
        id,
        source: "",
        entered: false,
        decision: "not_entered",
        reason: "No quantity and asking price entered.",
      };
    }

    if (accepted.has(id)) {
      return {
        id,
        source: offer.source,
        entered: true,
        decision: "accepted",
        reason: "Accepted in Plan A, the highest typical-contribution mix.",
      };
    }

    if (offer.quantityKg > scenario.capacityKg + 1e-9) {
      return {
        id,
        source: offer.source,
        entered: true,
        decision: "declined",
        reason: `Declined: ${kgText(offer.quantityKg)} kg is above the ${kgText(scenario.capacityKg)} kg capacity limit.`,
      };
    }

    return {
      id,
      source: offer.source,
      entered: true,
      decision: "declined",
      reason: planA
        ? `Declined: mixes that include this offer earn less at typical yield than Plan A (${peso(planA.scenarios.typical.contribution)}).`
        : "Declined: no mix that includes this offer fits the capacity limit.",
    };
  });
}

function enumerate(offers: ParsedOffer[]): ParsedOffer[][] {
  const combinations: ParsedOffer[][] = [];
  const count = 1 << offers.length;
  for (let mask = 1; mask < count; mask += 1) {
    const chosen = offers.filter((_, index) => (mask & (1 << index)) !== 0);
    combinations.push(chosen);
  }
  return combinations;
}

function bestBy(
  combinations: RawCombination[],
  score: (combination: RawCombination) => number,
): RawCombination | null {
  return combinations.reduce<RawCombination | null>((best, combination) => {
    if (!best) return combination;
    const next = score(combination);
    const current = score(best);
    if (next > current + 0.001) return combination;
    if (Math.abs(next - current) <= 0.001 && combination.inputKg < best.inputKg) {
      return combination;
    }
    return best;
  }, null);
}

function sameOffers(left: RawCombination, right: RawCombination) {
  const leftIds = left.offers.map((offer) => offer.id).join("");
  const rightIds = right.offers.map((offer) => offer.id).join("");
  return leftIds === rightIds;
}

function readOffers(
  input: unknown,
  fieldErrors: Record<string, string>,
): Array<ParsedOffer | null> | null {
  if (!Array.isArray(input) || input.length !== 3) {
    fieldErrors.offers = "Send exactly three offer slots.";
    return null;
  }

  return input.map((offer, index) => {
    const id = offerIds[index];
    if (!isRecord(offer)) {
      fieldErrors[`offer-${id}-quantity`] = "Offer must include quantity and asking price.";
      return null;
    }

    const quantityBlank = isBlank(offer.quantity);
    const priceBlank = isBlank(offer.price);
    const source = typeof offer.source === "string" ? offer.source.trim() : "";

    if (quantityBlank && priceBlank) return null;

    const quantityKg = readNumber(
      offer.quantity,
      `offer-${id}-quantity`,
      `Offer ${id.toUpperCase()} quantity`,
      fieldErrors,
    );
    const pricePerKg = readNumber(
      offer.price,
      `offer-${id}-price`,
      `Offer ${id.toUpperCase()} asking price`,
      fieldErrors,
    );

    if (quantityKg === null || pricePerKg === null) return null;
    if (quantityKg <= 0) {
      fieldErrors[`offer-${id}-quantity`] = "Enter a quantity greater than zero.";
      return null;
    }

    return { id, source, quantityKg, pricePerKg };
  });
}

function readNumber(
  value: unknown,
  fieldId: string,
  label: string,
  fieldErrors: Record<string, string>,
): number | null {
  if (isBlank(value)) {
    fieldErrors[fieldId] = `Enter ${label.toLowerCase()}.`;
    return null;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    fieldErrors[fieldId] = `${label} must be a number.`;
    return null;
  }
  const text = String(value).trim();
  if (!/^\d*\.?\d+$/.test(text)) {
    fieldErrors[fieldId] = "Enter a number, like 120 or 12.5.";
    return null;
  }
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors[fieldId] = "Enter a number zero or greater.";
    return null;
  }
  return parsed;
}

function offerList(offers: OfferId[]) {
  const labels = offers.map((id) => id.toUpperCase());
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

function failure(
  error: string,
  fieldErrors: Record<string, string> = {},
): OptimizeFailure {
  return { ok: false, error, fieldErrors };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isPathwayId(value: unknown): value is PathwayId {
  return pathways.some((pathway) => pathway.id === value);
}

function round(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function peso(value: number) {
  const rounded = round(value, 2);
  const sign = rounded < 0 ? "-" : "";
  const [whole, fraction] = Math.abs(rounded).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}₱${grouped}.${fraction}`;
}

function kgText(value: number) {
  const rounded = round(value, 3);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}
