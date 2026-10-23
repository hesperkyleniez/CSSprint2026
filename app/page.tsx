import { AppHeader } from "@/components/batch/app-header";
import { ScenarioBoard } from "@/components/batch/scenario-board";
import { ScenarioProvider } from "@/components/batch/scenario-context";

export default function Home() {
  return (
    <div className="flex-1">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:px-5 lg:py-6">
        <header className="flex flex-col items-start gap-3 text-left lg:items-center lg:text-center">
          <AppHeader />
          <div className="hidden max-w-xl flex-col items-center gap-1.5 lg:flex">
            <h1 className="font-display text-4xl leading-none font-medium tracking-tight text-pretty text-foreground">
              Plan a pili purchase
            </h1>
            <p className="text-sm leading-5 text-pretty text-muted">
              Enter the buyer order and the supplier offers. Talli shows which
              offers still fill that order.
            </p>
            <p className="text-xs leading-5 text-muted">
              Prototype · Demo inputs simulated · Scenarios not saved.
            </p>
          </div>
        </header>
        <ScenarioProvider>
          <ScenarioBoard />
        </ScenarioProvider>
      </main>
    </div>
  );
}
