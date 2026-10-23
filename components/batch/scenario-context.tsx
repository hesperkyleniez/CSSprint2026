"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { demoScenario } from "@/lib/demo-scenario";
import type { OptimizeResult, OptimizeSuccess } from "@/lib/optimize";
import {
  emptyScenario,
  getPathway,
  type OfferInput,
  type Pathway,
  type PathwayId,
  type ScenarioInput,
} from "@/lib/scenario";

type OfferField = keyof OfferInput;
type ScenarioField = Exclude<keyof ScenarioInput, "pathwayId" | "offers">;

const fieldIds: Record<ScenarioField, string> = {
  orderQuantity: "order-quantity",
  buyerPrice: "buyer-price",
  capacity: "drying-capacity",
  variableCost: "variable-cost",
  targetContribution: "target-contribution",
  yieldLow: "yield-low",
  yieldTypical: "yield-typical",
  yieldHigh: "yield-high",
};

const offerLetters = ["a", "b", "c"] as const;

function planLabel(selected: string | null) {
  if (!selected) return "no feasible mix";
  return selected.includes(" ") ? `Offers ${selected}` : `Offer ${selected}`;
}

type ScenarioContextValue = {
  scenario: ScenarioInput;
  pathway: Pathway;
  result: OptimizeSuccess | null;
  loading: boolean;
  isDirty: boolean;
  isDemo: boolean;
  requestError: string | null;
  pathwayNotice: string | null;
  fieldError: (id: string) => string | undefined;
  setPathwayId: (id: PathwayId) => void;
  setField: (field: ScenarioField, value: string, refresh?: boolean) => void;
  setOffer: (
    index: 0 | 1 | 2,
    field: OfferField,
    value: string,
    refresh?: boolean,
  ) => void;
  compare: () => void;
  loadDemo: () => void;
  resetScenario: () => void;
  planShift: string | null;
};

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

function withoutError(errors: Record<string, string>, id: string) {
  if (!(id in errors)) return errors;
  const next = { ...errors };
  delete next[id];
  return next;
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioInput>(emptyScenario);
  const [result, setResult] = useState<OptimizeSuccess | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [pathwayNotice, setPathwayNotice] = useState<string | null>(null);
  const [planShift, setPlanShift] = useState<string | null>(null);
  const scenarioRef = useRef(scenario);
  const resultRef = useRef<OptimizeSuccess | null>(null);
  const requestId = useRef(0);
  const hasCompared = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publish = useCallback((next: ScenarioInput) => {
    scenarioRef.current = next;
    setScenario(next);
  }, []);

  const runCompare = useCallback(async (body: ScenarioInput, scroll: boolean) => {
    const id = ++requestId.current;
    setLoading(true);
    setResult(null);
    setRequestError(null);
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as OptimizeResult;
      if (id !== requestId.current) return;
      if (!data.ok) {
        setFieldErrors(data.fieldErrors);
        resultRef.current = null;
        setResult(null);
        setIsDirty(false);
        setPlanShift(null);
        const first = Object.keys(data.fieldErrors)[0];
        if (first) {
          document.getElementById(first)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        return;
      }
      setFieldErrors({});
      const previous = resultRef.current?.planA?.selectedOffers ?? null;
      const nextSelected = data.planA?.selectedOffers ?? null;
      if (scroll) {
        setPlanShift(null);
      } else if (previous !== nextSelected) {
        setPlanShift(
          `Plan A moved from ${planLabel(previous)} to ${planLabel(nextSelected)}.`,
        );
      }
      resultRef.current = data;
      setResult(data);
      setIsDirty(false);
      if (scroll) {
        document.getElementById("recommended-plans")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch {
      if (id !== requestId.current) return;
      setRequestError("The comparison could not be reached. Try again.");
      setIsDirty(false);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const schedule = useCallback(
    (next: ScenarioInput) => {
      if (timer.current) clearTimeout(timer.current);
      requestId.current += 1;
      setResult(null);
      setLoading(false);
      setIsDirty(true);
      timer.current = setTimeout(() => {
        void runCompare(next, false);
      }, 280);
    },
    [runCompare],
  );

  const value = useMemo<ScenarioContextValue>(() => {
    return {
      scenario,
      pathway: getPathway(scenario.pathwayId),
      result,
      loading,
      isDirty,
      isDemo,
      requestError,
      pathwayNotice,
      fieldError: (id) => fieldErrors[id],
      setPathwayId: (id) => {
        if (timer.current) clearTimeout(timer.current);
        requestId.current += 1;
        setLoading(false);
        const current = scenarioRef.current;
        const nextPathway = getPathway(id);
        publish({
          ...current,
          pathwayId: id,
          orderQuantity: "",
          buyerPrice: "",
          offers: current.offers.map((offer) => ({
            ...offer,
            quantity: "",
            price: "",
          })) as ScenarioInput["offers"],
          capacity: "",
          variableCost: "",
          yieldLow: "",
          yieldTypical: "",
          yieldHigh: "",
        });
        resultRef.current = null;
        setResult(null);
        setIsDirty(false);
        setPlanShift(null);
        setFieldErrors({});
        setRequestError(null);
        setPathwayNotice(`Pathway changed to ${nextPathway.label}. Route-dependent order, offer quantities and prices, capacity, processing cost, and yield assumptions were cleared. Review and re-enter them before comparing.`);
        setIsDemo(false);
        hasCompared.current = false;
      },
      setField: (field, nextValue, refresh = true) => {
        const next = { ...scenarioRef.current, [field]: nextValue };
        publish(next);
        setIsDemo(false);
        setPathwayNotice(null);
        setRequestError(null);
        setFieldErrors((current) => withoutError(current, fieldIds[field]));
        if (refresh && hasCompared.current) schedule(next);
      },
      setOffer: (index, field, nextValue, refresh = true) => {
        const next = {
          ...scenarioRef.current,
          offers: scenarioRef.current.offers.map((offer, offerIndex) =>
            offerIndex === index ? { ...offer, [field]: nextValue } : offer,
          ) as ScenarioInput["offers"],
        };
        publish(next);
        setIsDemo(false);
        setPathwayNotice(null);
        setRequestError(null);
        setFieldErrors((current) => {
          const next =
            field === "quantity" || field === "price"
              ? withoutError(current, `offer-${offerLetters[index]}-${field}`)
              : current;
          return withoutError(next, "offers");
        });
        if (refresh && hasCompared.current) schedule(next);
      },
      compare: () => {
        if (timer.current) clearTimeout(timer.current);
        hasCompared.current = true;
        void runCompare(scenarioRef.current, true);
      },
      loadDemo: () => {
        if (timer.current) clearTimeout(timer.current);
        hasCompared.current = true;
        const next = demoScenario();
        publish(next);
        setIsDemo(true);
        setPathwayNotice(null);
        setIsDirty(false);
        setFieldErrors({});
        setRequestError(null);
        void runCompare(next, true);
      },
      resetScenario: () => {
        if (timer.current) clearTimeout(timer.current);
        requestId.current += 1;
        hasCompared.current = false;
        publish(emptyScenario);
        setIsDemo(false);
        resultRef.current = null;
        setResult(null);
        setPlanShift(null);
        setIsDirty(false);
        setLoading(false);
        setFieldErrors({});
        setRequestError(null);
        setPathwayNotice(null);
      },
      planShift,
    };
  }, [fieldErrors, isDirty, isDemo, loading, pathwayNotice, planShift, publish, requestError, result, runCompare, scenario, schedule]);

  return (
    <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error("useScenario must be used within ScenarioProvider");
  }
  return context;
}
