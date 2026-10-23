import {
  getPathway,
  maxOfferCount,
  minOfferCount,
  offerLetter,
  pathways,
  type Pathway,
  type PathwayId,
} from "./scenario";

export type OfferId = string;

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
  walkAwayPricePerKg: number | null;
  walkAwayBasis: string;
  supplierWalkAwayPrices: Array<{ id: OfferId; source: string; pricePerKg: number | null }>;
  meetsTypicalOrder: boolean;
  meetsLowYieldOrder: boolean;
  meetsLowYieldTarget: boolean;
  noPurchase: boolean;
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
  meetsTypicalOrder: boolean;
  meetsLowYieldOrder: boolean;
  selectedBy: Array<"Plan A" | "Plan B">;
  ruledOutReason: string | null;
};

export type OfferDecision = {
  id: OfferId;
  source: string;
  entered: boolean;
  decision: "both" | "plan_a" | "plan_b" | "declined" | "not_entered";
  reason: string;
};

export type OptimizeSuccess = {
  ok: true;
  pathway: Pathway;
  planA: PlanResult | null;
  planAReason: string;
  planB: PlanResult | null;
  planBReason: string;
  samePlan: boolean;
  noPurchaseContribution: number;
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
  const factors = readMeasure(input, fieldErrors);

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
    "the least you want to clear",
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
  if (
    yieldLow !== null &&
    yieldTypical !== null &&
    yieldHigh !== null &&
    (yieldLow > yieldTypical || yieldTypical > yieldHigh)
  ) {
    fieldErrors[fieldIds.yieldTypical] =
      "Keep low yield at or below typical, and typical at or below high.";
  }

  if (orderQuantityKg !== null && orderQuantityKg <= 0) {
    fieldErrors[fieldIds.orderQuantity] = "Order quantity must be greater than zero.";
  }
  if (capacityKg !== null && capacityKg <= 0) {
    fieldErrors[fieldIds.capacity] = "Capacity must be greater than zero.";
  }
  for (const [value, field, label] of [
    [yieldLow, fieldIds.yieldLow, "Low"],
    [yieldTypical, fieldIds.yieldTypical, "Typical"],
    [yieldHigh, fieldIds.yieldHigh, "High"],
  ] as const) {
    if (value !== null && (value <= 0 || value > 1)) {
      fieldErrors[field] = `${label} yield must be greater than 0 and no more than 1.0 for these weight-based pathways.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !offers || !factors || !isPathwayId(pathwayId)) {
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
      orderQuantityKg: orderQuantityKg * factors.orderFactor,
      buyerPricePerKg: buyerPricePerKg / factors.orderFactor,
      capacityKg: capacityKg * factors.inputFactor,
      variableCostPerKg: variableCostPerKg / factors.inputFactor,
      targetContribution,
      yields: { low: yieldLow, typical: yieldTypical, high: yieldHigh },
      offers: offers.map((offer) =>
        offer
          ? {
              ...offer,
              quantityKg: offer.quantityKg * factors.inputFactor,
              pricePerKg: offer.pricePerKg / factors.inputFactor,
            }
          : null,
      ),
    },
  };
}

function evaluate(scenario: ParsedScenario): OptimizeSuccess {
  const entered = scenario.offers.filter((offer): offer is ParsedOffer => offer !== null);
  const combinations = enumerate(entered).map((offers) =>
    evaluateCombination(scenario, offers),
  );
  const feasible = combinations.filter((combination) => combination.feasible);
  const planARaw = bestBy(
    feasible.filter(
      (combination) =>
        meetsOrder(scenario, combination, "typical") &&
        combination.scenarios.typical.contribution > 0,
    ),
    (combination) => combination.scenarios.typical.contribution,
  );

  const lowTargetHits = feasible.filter(
    (combination) =>
      meetsOrder(scenario, combination, "low") &&
      combination.scenarios.low.contribution + 0.001 >= scenario.targetContribution &&
      combination.scenarios.low.contribution > 0,
  );
  const planAMeetsLowTarget =
    planARaw !== null &&
    lowTargetHits.some((combination) => sameOffers(combination, planARaw));
  const planBRaw = planAMeetsLowTarget
    ? planARaw
    : bestBy(lowTargetHits, (combination) => combination.scenarios.typical.contribution);

  const planA = planARaw ? toPlan(scenario, planARaw, planReason(scenario, planARaw, "a", planARaw)) : null;
  const planB = planBRaw
    ? toPlan(scenario, planBRaw, planReason(scenario, planBRaw, "b", planARaw))
    : null;

  return {
    ok: true,
    pathway: scenario.pathway,
    planA,
    planAReason: planA?.reason ?? planAFallback(scenario, planARaw, feasible),
    planB,
    planBReason: planB?.reason ?? planBFallback(scenario, feasible),
    samePlan: planAMeetsLowTarget,
    noPurchaseContribution: 0,
    offers: offerDecisions(scenario, planARaw, planBRaw, combinations),
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

function meetsOrder(
  scenario: ParsedScenario,
  combination: RawCombination,
  yieldKey: YieldKey,
) {
  return combination.scenarios[yieldKey].orderCoverageKg + 1e-9 >= scenario.orderQuantityKg;
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
    outputKg,
    orderCoverageKg,
    orderCoveragePct,
    unmatchedOutputKg,
    sales,
    contribution,
    walkAwayPricePerKg,
  };
}

function toPlan(
  scenario: ParsedScenario,
  combination: RawCombination,
  reason: string,
): PlanResult {
  const typical = combination.scenarios.typical;
  const low = combination.scenarios.low;
  const supplierWalkAwayPrices = combination.offers.map((offer) => {
    const otherOfferCost = combination.rawMaterialCost - offer.quantityKg * offer.pricePerKg;
    const ceiling =
      (low.sales - combination.processingCost - scenario.targetContribution - otherOfferCost) /
      offer.quantityKg;
    return {
      id: offer.id,
      source: offer.source,
      pricePerKg: ceiling >= 0 ? round(ceiling, 2) : null,
    };
  });
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
    walkAwayPricePerKg:
      combination.inputKg > 0 &&
      low.sales - combination.processingCost - scenario.targetContribution >= 0
        ? round(
            (low.sales - combination.processingCost - scenario.targetContribution) /
              combination.inputKg,
            2,
          )
        : null,
    walkAwayBasis: `Based on low-yield output with sales capped at the entered order, entered processing cost, and your ${peso(scenario.targetContribution)} target. Each supplier ceiling holds the other selected offers at their entered prices.`,
    supplierWalkAwayPrices,
    meetsTypicalOrder: meetsOrder(scenario, combination, "typical"),
    meetsLowYieldOrder: meetsOrder(scenario, combination, "low"),
    meetsLowYieldTarget: low.contribution + 0.001 >= scenario.targetContribution,
    noPurchase: combination.offers.length === 0,
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
  const selectedBy: Array<"Plan A" | "Plan B"> = [];
  if (planA && sameOffers(combination, planA)) selectedBy.push("Plan A");
  if (planB && sameOffers(combination, planB)) selectedBy.push("Plan B");
  const isRecommended = selectedBy.length > 0;
  return {
    offers: combination.offers.map((offer) => offer.id),
    label: combination.offers.length
      ? offerList(combination.offers.map((offer) => offer.id))
      : "Decline all (no purchase)",
    feasible: combination.feasible,
    capacityUsedKg: round(combination.inputKg, 3),
    typicalContribution: combination.scenarios.typical.contribution,
    lowContribution: combination.scenarios.low.contribution,
    meetsLowYieldTarget: combination.feasible && meetsLowYieldTarget,
    meetsTypicalOrder: combination.feasible && meetsOrder(scenario, combination, "typical"),
    meetsLowYieldOrder: combination.feasible && meetsOrder(scenario, combination, "low"),
    selectedBy,
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
    return `Highest positive typical contribution among mixes that cover the full buyer order: ${peso(typical)}. Uses ${used} kg of the ${capacity} kg ${step} capacity (${usedPct}%). Low-yield contribution is ${peso(low)}, which ${meets ? "meets" : "misses"} the ${peso(scenario.targetContribution)} target.`;
  }

  const planATypical = planA ? planA.scenarios.typical.contribution : typical;
  if (planA && sameOffers(combination, planA)) {
    return `This same combination qualifies for both objectives: it covers the full order at low yield and meets the ${peso(scenario.targetContribution)} low-yield target (${peso(low)}). It is shown as both Plan A and Plan B.`;
  }
  return `Meets the ${peso(scenario.targetContribution)} target at low yield with ${peso(low)}. Typical contribution is ${peso(typical)}, compared with ${peso(planATypical)} for Plan A. Uses ${used} kg of the ${capacity} kg ${step} capacity (${usedPct}%).`;
}

function planBFallback(
  scenario: ParsedScenario,
  feasible: RawCombination[],
): string {
  const buyingFeasible = feasible.filter((combination) => combination.offers.length > 0);
  if (buyingFeasible.length === 0) {
    return scenario.offers.some(Boolean)
      ? `No entered offer combination fits the ${kgText(scenario.capacityKg)} kg ${scenario.pathway.capacityStep.toLowerCase()} capacity. Declining all offers is shown as the ₱0 no-purchase baseline.`
      : "No supplier offers were entered, so there is no buying plan to test. Declining all offers remains the ₱0 baseline.";
  }

  const fullOrderLow = buyingFeasible.filter((combination) => meetsOrder(scenario, combination, "low"));
  const bestLow = (fullOrderLow.length ? fullOrderLow : buyingFeasible).reduce<number | null>((best, combination) => {
    const contribution = combination.scenarios.low.contribution;
    return best === null || contribution > best ? contribution : best;
  }, null);

  if (bestLow === null) {
    return `No mix fits the ${kgText(scenario.capacityKg)} kg ${scenario.pathway.capacityStep.toLowerCase()} capacity, so there is no low-yield plan.`;
  }

  return fullOrderLow.length
    ? `No mix that covers the full order at low yield meets the ${peso(scenario.targetContribution)} target. The best low-yield contribution among full-order mixes is ${peso(bestLow)}. Declining all offers remains the ₱0 baseline.`
    : `No capacity-feasible mix covers the full order at low yield. The highest-contribution available low-yield mix contributes ${peso(bestLow)} but covers only ${round(Math.max(...buyingFeasible.map((combination) => combination.scenarios.low.orderCoveragePct)), 1)}% of the order; the app does not recommend it as order fulfillment. Declining all offers remains the ₱0 baseline.`;
}

function planAFallback(
  scenario: ParsedScenario,
  planA: RawCombination | null,
  feasible: RawCombination[],
) {
  if (planA) return planReason(scenario, planA, "a", planA);
  const purchaseOptions = feasible.filter((combination) => combination.offers.length > 0);
  if (!purchaseOptions.length) {
    return scenario.offers.some(Boolean)
      ? `No entered offer combination fits the ${kgText(scenario.capacityKg)} kg ${scenario.pathway.capacityStep.toLowerCase()} capacity. Declining all offers is the ₱0 baseline.`
      : "No supplier offers were entered. Declining all offers is available as the ₱0 no-purchase baseline.";
  }
  const complete = purchaseOptions.filter((combination) => meetsOrder(scenario, combination, "typical"));
  if (!complete.length) {
    const best = bestBy(purchaseOptions, (combination) => combination.scenarios.typical.contribution);
    const coverage = best?.scenarios.typical.orderCoveragePct ?? 0;
    return `No capacity-feasible offer mix covers the full order at typical yield. The highest-contribution available mix covers ${round(coverage, 1)}%; partial fulfillment is not recommended. Declining all offers is the ₱0 baseline.`;
  }
  return "No full-order mix has positive typical contribution. The app recommends declining all offers rather than taking a loss.";
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
  const typicalComplete = meetsOrder(scenario, combination, "typical");
  const lowComplete = meetsOrder(scenario, combination, "low");
  if (combination.offers.length === 0) {
    return "No-purchase baseline: avoids buying cost, but fulfills none of the buyer order.";
  }
  if (!typicalComplete) {
    return `Does not cover the full order at typical yield (${peso(combination.scenarios.typical.contribution)} contribution; ${round(combination.scenarios.typical.orderCoveragePct, 1)}% coverage). The simulator does not recommend partial fulfillment.`;
  }
  if (!lowComplete) {
    return `Covers the order at typical yield but not at low yield (${round(combination.scenarios.low.orderCoveragePct, 1)}% low-yield coverage), so it cannot qualify as the conservative plan.`;
  }
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
  planB: RawCombination | null,
  combinations: RawCombination[],
): OfferDecision[] {
  const acceptedA = new Set(planA?.offers.map((offer) => offer.id) ?? []);
  const acceptedB = new Set(planB?.offers.map((offer) => offer.id) ?? []);
  return scenario.offers.map((offer, index) => {
    const id = offerLetter(index);
    if (!offer) {
      return {
        id,
        source: "",
        entered: false,
        decision: "not_entered",
        reason: "No quantity and asking price entered.",
      };
    }

    if (acceptedA.has(id) && acceptedB.has(id)) {
      return {
        id,
        source: offer.source,
        entered: true,
        decision: "both",
        reason: "Selected in both Plan A and Plan B.",
      };
    }
    if (acceptedA.has(id)) return { id, source: offer.source, entered: true, decision: "plan_a", reason: "Selected in Plan A only." };
    if (acceptedB.has(id)) return { id, source: offer.source, entered: true, decision: "plan_b", reason: "Selected in Plan B only." };

    if (offer.quantityKg > scenario.capacityKg + 1e-9) {
      return {
        id,
        source: offer.source,
        entered: true,
        decision: "declined",
        reason: `Declined: ${kgText(offer.quantityKg)} kg is above the ${kgText(scenario.capacityKg)} kg capacity limit.`,
      };
    }

    const candidateMixes = combinations.filter((combination) =>
      combination.offers.some((item) => item.id === id),
    );
    const feasibleMixes = candidateMixes.filter((combination) => combination.feasible);
    const fullOrderMixes = feasibleMixes.filter((combination) => meetsOrder(scenario, combination, "typical"));
    const reason =
      !feasibleMixes.length
        ? `Declined: every mix containing this offer exceeds the ${kgText(scenario.capacityKg)} kg capacity.`
        : !fullOrderMixes.length
          ? "Declined: no capacity-feasible mix containing this offer covers the full order at typical yield. Partial fulfillment is not recommended."
          : fullOrderMixes.every((combination) => combination.scenarios.typical.contribution <= 0)
            ? "Declined: full-order mixes containing this offer are loss-making at typical yield; no purchase is the ₱0 baseline."
            : planA
              ? `Declined in the recommended plans: the best typical contribution of mixes containing this offer is below Plan A (${peso(planA.scenarios.typical.contribution)}).`
              : "Declined: not selected by a plan that meets the full-order requirements.";
    return {
      id,
      source: offer.source,
      entered: true,
      decision: "declined",
      reason,
    };
  });
}

function enumerate(offers: ParsedOffer[]): ParsedOffer[][] {
  const combinations: ParsedOffer[][] = [];
  const count = 1 << offers.length;
  for (let mask = 0; mask < count; mask += 1) {
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
    if (Math.abs(next - current) <= 0.001) {
      const nextLow = combination.scenarios.low.contribution;
      const bestLow = best.scenarios.low.contribution;
      if (nextLow > bestLow + 0.001) return combination;
      if (bestLow > nextLow + 0.001) return best;
      if (combination.inputKg < best.inputKg - 1e-9) return combination;
      if (Math.abs(combination.inputKg - best.inputKg) <= 1e-9) {
        const nextCost = combination.rawMaterialCost + combination.processingCost;
        const bestCost = best.rawMaterialCost + best.processingCost;
        if (nextCost < bestCost - 0.001) return combination;
        if (Math.abs(nextCost - bestCost) <= 0.001 && combination.offers.length < best.offers.length) return combination;
        if (combination.offers.length === best.offers.length && sameOffers(combination, best) === false && combination.offers.map((offer) => offer.id).join("") < best.offers.map((offer) => offer.id).join("")) return combination;
      }
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
  if (!Array.isArray(input) || input.length < minOfferCount || input.length > maxOfferCount) {
    fieldErrors.offers =
      Array.isArray(input) && input.length > maxOfferCount
        ? "Eight offers is the limit."
        : "Keep at least two offer slots.";
    return null;
  }

  return input.map((offer, index) => {
    const id = offerLetter(index);
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

function readMeasure(
  input: Record<string, unknown>,
  fieldErrors: Record<string, string>,
): { inputFactor: number; orderFactor: number } | null {
  if (input.quantityMeasure !== "other") {
    return { inputFactor: 1, orderFactor: 1 };
  }

  const unitName = typeof input.unitName === "string" ? input.unitName.trim() : "";
  if (!unitName) {
    fieldErrors["unit-name"] = "Name the measure, like sack or kaing.";
  }

  const inputFactor = readPositiveKg(
    input.inputKgPerUnit,
    "input-kg-per-unit",
    "Kilograms of input in one unit",
    fieldErrors,
  );
  const orderFactor = readPositiveKg(
    input.orderKgPerUnit,
    "order-kg-per-unit",
    "Kilograms of the buyer product in one unit",
    fieldErrors,
  );

  if (!unitName || inputFactor === null || orderFactor === null) return null;
  return { inputFactor, orderFactor };
}

function readPositiveKg(
  value: unknown,
  fieldId: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  const parsed = readNumber(value, fieldId, label, fieldErrors);
  if (parsed !== null && parsed <= 0) {
    fieldErrors[fieldId] = "Enter a weight greater than zero.";
    return null;
  }
  return parsed;
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
