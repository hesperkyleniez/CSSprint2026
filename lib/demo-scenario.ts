import type { ScenarioInput } from "./scenario";

/** Simulated fresh-fruit scenario. Figures are for the demo, not verified local data. */
export function demoScenario(): ScenarioInput {
  return {
    pathwayId: "fresh-to-dried",
    quantityMeasure: "kg",
    unitName: "",
    inputKgPerUnit: "",
    orderKgPerUnit: "",
    orderQuantity: "50",
    buyerPrice: "500",
    offers: [
      { source: "Simulated farmer", quantity: "100", price: "80" },
      { source: "Simulated trader", quantity: "60", price: "20" },
      { source: "", quantity: "", price: "" },
    ],
    capacity: "200",
    variableCost: "10",
    targetContribution: "3000",
    yieldLow: "0.35",
    yieldTypical: "0.5",
    yieldHigh: "0.6",
  };
}
