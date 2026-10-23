"use client";

import { SectionCard } from "@/components/ui/section-card";
import { useScenario } from "@/components/batch/scenario-context";

export function RationaleSection() {
  const { result } = useScenario();
  const ruledOut = result?.combinations.filter((item) => item.ruledOutReason) ?? [];

  return (
    <SectionCard id="plan-rationale" step={5} title="Why these plans?">
      <div className="flex flex-col gap-4" aria-live="polite">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Plan A rationale</h3>
          <p className="mt-1 text-sm leading-6 text-pretty text-muted">
            {result?.planA?.reason ??
              (result
                ? result.planBReason
                : "Compare offers to see the highest typical contribution, capacity used, and the low-yield target check.")}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Plan B rationale</h3>
          <p className="mt-1 text-sm leading-6 text-pretty text-muted">
            {result
              ? result.planB
                ? result.planB.reason
                : result.planBReason
              : "Compare offers to see whether another mix meets the low-yield target, and what it trades off against Plan A."}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Other combinations</h3>
          {result ? (
            ruledOut.length > 0 ? (
              <ul className="mt-1 flex flex-col gap-2">
                {ruledOut.map((item) => (
                  <li key={item.label} className="text-sm leading-6 text-pretty text-muted">
                    <span className="font-medium text-foreground">{item.label}.</span>{" "}
                    {item.ruledOutReason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm leading-6 text-pretty text-muted">
                Every capacity-feasible mix is already shown as Plan A or Plan B.
              </p>
            )
          ) : (
            <p className="mt-1 text-sm leading-6 text-pretty text-muted">
              Compare offers to see which mixes were ruled out by capacity, contribution, or the
              low-yield target.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
