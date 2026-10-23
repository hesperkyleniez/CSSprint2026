"use client";

import { SectionCard } from "@/components/ui/section-card";
import { useScenario } from "@/components/batch/scenario-context";
import type { OfferDecision } from "@/lib/optimize";

const decisionLabel: Record<OfferDecision["decision"], string> = {
  both: "Both plans",
  plan_a: "Plan A only",
  plan_b: "Plan B only",
  declined: "Declined",
  not_entered: "Not entered",
};

function DecisionText({ decision }: { decision?: OfferDecision["decision"] }) {
  if (!decision) return <span className="text-muted">—</span>;
  const tone = ["both", "plan_a", "plan_b"].includes(decision) ? "font-medium text-brand" : "text-foreground";
  return <span className={tone}>{decisionLabel[decision]}</span>;
}

export function ComparisonSection() {
  const { result } = useScenario();
  const offers = result?.offers ?? [
    { id: "a", decision: undefined, reason: "—" },
    { id: "b", decision: undefined, reason: "—" },
    { id: "c", decision: undefined, reason: "—" },
  ];

  return (
    <SectionCard id="offer-comparison" step={6} title="Offer comparison" collapseOnMobile>
      <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-[#ece7df] sm:hidden">
        {offers.map((offer) => (
          <li key={offer.id} className="flex flex-col gap-3 px-3 py-4 text-sm">
            <p className="font-medium text-foreground">Offer {offer.id.toUpperCase()}</p>
            <p className="flex items-start justify-between gap-4">
              <span className="text-muted">Decision</span>
              <DecisionText decision={offer.decision} />
            </p>
            <p className="text-pretty leading-7 text-foreground">
              <span className="block text-muted">Reason</span>
              {offer.reason}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-3xl border border-[#ece7df] sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-inset text-left text-muted">
              <th scope="col" className="w-24 px-3 py-2.5 font-medium">
                Offer
              </th>
              <th scope="col" className="w-36 px-3 py-2.5 font-medium">
                Decision
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-t border-line align-top">
                <th scope="row" className="px-3 py-3 text-left font-medium text-foreground">
                  {offer.id.toUpperCase()}
                </th>
                <td className="px-3 py-3">
                  <DecisionText decision={offer.decision} />
                </td>
                <td className="px-3 py-3 text-pretty leading-6 text-foreground">{offer.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
