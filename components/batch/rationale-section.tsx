"use client";

import { SectionCard } from "@/components/ui/section-card";
import { useScenario } from "@/components/batch/scenario-context";

export function RationaleSection() {
  const { result } = useScenario();
  const ruledOut = result?.combinations.filter((item) => item.ruledOutReason) ?? [];

  return (
    <SectionCard id="plan-rationale" step={5} title="Why these plans?" collapseOnMobile>
      <div className="flex flex-col gap-6 lg:gap-3" aria-live="polite">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Plan A rationale</h3>
          <p className="mt-2 text-sm leading-7 text-pretty text-foreground lg:mt-1 lg:leading-6">
            {result?.planA?.reason ??
              (result ? result.planBReason : "Shown after you compare.")}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Plan B rationale</h3>
          <p className="mt-2 text-sm leading-7 text-pretty text-foreground lg:mt-1 lg:leading-6">
            {result
              ? result.planB
                ? result.planB.reason
                : result.planBReason
              : "Shown after you compare."}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Other combinations</h3>
          {result ? (
            ruledOut.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-4 lg:mt-1 lg:gap-2">
                {ruledOut.map((item) => (
                  <li key={item.label} className="text-sm leading-7 text-pretty text-foreground lg:leading-6">
                    <span className="font-medium text-foreground">{item.label}.</span>{" "}
                    {item.ruledOutReason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-7 text-pretty text-foreground lg:mt-1 lg:leading-6">
                Already shown in Plan A or Plan B.
              </p>
            )
          ) : (
            <p className="mt-2 text-sm leading-7 text-pretty text-foreground lg:mt-1 lg:leading-6">
              Shown after you compare.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
