import { AppHeader } from "@/components/batch/app-header";
import { CapacitySection } from "@/components/batch/capacity-section";
import { ComparisonSection } from "@/components/batch/comparison-section";
import { OffersSection } from "@/components/batch/offers-section";
import { PathwaySection } from "@/components/batch/pathway-section";
import { PlansSection } from "@/components/batch/plans-section";
import { RationaleSection } from "@/components/batch/rationale-section";
import { ScenarioProvider } from "@/components/batch/scenario-context";
import { WhatIfSection } from "@/components/batch/what-if-section";

export default function Home() {
  return (
    <div className="flex-1">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:gap-8 sm:px-6 sm:pt-10 sm:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <header className="flex flex-col gap-5 sm:gap-6">
          <AppHeader />
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[1.75rem] font-medium leading-tight tracking-tight text-pretty text-foreground sm:text-4xl">
              Plan a pili purchase
            </h1>
            <p className="max-w-2xl text-[15px] leading-6 text-pretty text-muted">
              Compare supplier offers with a buyer order and your processing
              capacity to find the best buying plan.
            </p>
            <p className="text-xs leading-5 text-muted">
              Prototype · Demo inputs simulated · Scenarios not saved.
            </p>
          </div>
        </header>
        <ScenarioProvider>
          <div className="flex flex-col gap-4">
            <PathwaySection />
            <OffersSection />
            <CapacitySection />
            <PlansSection />
            <RationaleSection />
            <ComparisonSection />
            <WhatIfSection />
          </div>
        </ScenarioProvider>
      </main>
    </div>
  );
}
