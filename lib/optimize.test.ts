import assert from "node:assert/strict";
import test from "node:test";
import { optimizeScenario } from "./optimize.ts";
import type { ScenarioInput } from "./scenario.ts";

function scenario(patch: Partial<ScenarioInput> = {}): ScenarioInput {
  return {
    pathwayId: "fresh-to-dried",
    orderQuantity: "50",
    buyerPrice: "500",
    offers: [
      { source: "North farm", quantity: "100", price: "80" },
      { source: "Coop", quantity: "60", price: "20" },
      { source: "", quantity: "", price: "" },
    ],
    capacity: "200",
    variableCost: "10",
    targetContribution: "3000",
    yieldLow: "0.2",
    yieldTypical: "0.5",
    yieldHigh: "0.6",
    ...patch,
  };
}

test("selects Plan A by typical contribution and Plan B by the low-yield target", () => {
  const result = optimizeScenario(scenario());
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.planA?.offers, ["a"]);
  assert.equal(result.planA?.contribution.typical, 16000);
  assert.equal(result.planA?.contribution.low, 1000);
  assert.equal(result.planA?.outputKg.typical, 50);
  assert.equal(result.planA?.orderCoveragePct, 100);
  assert.equal(result.planA?.unmatchedOutputKg, 0);
  assert.equal(result.planA?.walkAwayPricePerKg, 210);
  assert.match(result.planA?.reason ?? "", /misses the ₱3,000.00 target/);

  assert.deepEqual(result.planB?.offers, ["a", "b"]);
  assert.equal(result.planB?.contribution.typical, 14200);
  assert.equal(result.planB?.contribution.low, 5200);
  assert.equal(result.planB?.unmatchedOutputKg, 30);
  assert.equal(result.planB?.walkAwayPricePerKg, 127.5);
  assert.match(result.planBReason, /Meets the ₱3,000.00 target/);

  assert.equal(result.offers[0]?.decision, "accepted");
  assert.equal(result.offers[1]?.decision, "declined");
  assert.equal(result.offers[2]?.decision, "not_entered");
  assert.equal(result.combinations.length, 3);
  assert.equal(
    result.combinations.find((combination) => combination.label === "A")?.ruledOutReason,
    null,
  );
  assert.equal(
    result.combinations.find((combination) => combination.label === "A and B")?.ruledOutReason,
    null,
  );
});

test("does not invent Plan B when Plan A already meets the low-yield target", () => {
  const result = optimizeScenario(scenario({ targetContribution: "500" }));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.planB, null);
  assert.match(result.planBReason, /already meets/);
});

test("reports when no mix meets the low-yield target", () => {
  const result = optimizeScenario(scenario({ targetContribution: "10000" }));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.planB, null);
  assert.match(result.planBReason, /best low-yield contribution is ₱5,200.00/);
});

test("rejects every mix that exceeds capacity", () => {
  const result = optimizeScenario(scenario({ capacity: "50" }));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.planA, null);
  assert.equal(result.planB, null);
  assert.match(result.planBReason, /No mix fits/);
  assert.equal(result.offers[0]?.decision, "declined");
  assert.match(result.offers[0]?.reason ?? "", /capacity limit/);
});

test("enumerates all seven non-empty combinations", () => {
  const result = optimizeScenario(
    scenario({
      orderQuantity: "100",
      buyerPrice: "10",
      capacity: "100",
      variableCost: "0",
      targetContribution: "0",
      yieldLow: "0.4",
      yieldTypical: "0.5",
      yieldHigh: "0.6",
      offers: [
        { source: "", quantity: "10", price: "1" },
        { source: "", quantity: "10", price: "1" },
        { source: "", quantity: "10", price: "1" },
      ],
    }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.combinations.length, 7);
  assert.deepEqual(result.planA?.offers, ["a", "b", "c"]);
  const overCapacity = result.combinations.find((combination) => !combination.feasible);
  assert.equal(overCapacity, undefined);
});

test("caps sales at the order and leaves the extra output unmatched", () => {
  const result = optimizeScenario(
    scenario({
      orderQuantity: "40",
      buyerPrice: "10",
      capacity: "100",
      variableCost: "0",
      targetContribution: "0",
      yieldLow: "1",
      yieldTypical: "1",
      yieldHigh: "1",
      offers: [
        { source: "", quantity: "100", price: "0" },
        { source: "", quantity: "", price: "" },
        { source: "", quantity: "", price: "" },
      ],
    }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.planA?.scenarios.typical.sales, 400);
  assert.equal(result.planA?.unmatchedOutputKg, 60);
  assert.equal(result.planA?.orderCoverageKg, 40);
});

test("returns field errors for invalid or incomplete input", () => {
  const result = optimizeScenario(
    scenario({
      orderQuantity: "abc",
      yieldLow: "0.8",
      yieldTypical: "0.2",
      offers: [
        { source: "Farm", quantity: "10", price: "" },
        { source: "", quantity: "", price: "" },
        { source: "", quantity: "", price: "" },
      ],
    }),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.equal(result.fieldErrors["order-quantity"], "Enter a number, like 120 or 12.5.");
  assert.match(result.fieldErrors["yield-typical"], /low yield/);
  assert.equal(result.fieldErrors["offer-a-price"], "Enter offer a asking price.");
});

test("rules out a mix that is over capacity", () => {
  const result = optimizeScenario(
    scenario({
      capacity: "120",
      offers: [
        { source: "", quantity: "100", price: "80" },
        { source: "", quantity: "60", price: "20" },
        { source: "", quantity: "", price: "" },
      ],
    }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const both = result.combinations.find((combination) => combination.label === "A and B");
  assert.equal(both?.feasible, false);
  assert.match(both?.ruledOutReason ?? "", /Ruled out by capacity/);
});
