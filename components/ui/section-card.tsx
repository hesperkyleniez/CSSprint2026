"use client";

import { useEffect, useState, type ReactNode } from "react";

const fieldSections: Record<string, string> = {
  offers: "supplier-offers",
  "drying-capacity": "capacity",
  "variable-cost": "capacity",
  "target-contribution": "capacity",
  "yield-low": "capacity",
  "yield-typical": "capacity",
  "yield-high": "capacity",
};

export function sectionForField(fieldId: string) {
  if (fieldId.startsWith("offer-")) return "supplier-offers";
  return fieldSections[fieldId] ?? "processing-pathway";
}

export function expandSection(id: string, focusId?: string) {
  window.dispatchEvent(
    new CustomEvent("talli-show-section", { detail: { id, focusId } }),
  );
  const target = document.getElementById(focusId ?? id);
  if (!target || target.getClientRects().length === 0) return;
  if (focusId) target.focus();
  target.scrollIntoView({ behavior: "smooth", block: focusId ? "center" : "start" });
}

export function SectionCard({
  id,
  step,
  title,
  description,
  children,
  hideTitleOnMobile = false,
  collapseOnMobile = false,
}: {
  id: string;
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  hideTitleOnMobile?: boolean;
  collapseOnMobile?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!collapseOnMobile) return;
    const show = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id === id) setOpen(true);
    };
    window.addEventListener("talli-show-section", show);
    return () => window.removeEventListener("talli-show-section", show);
  }, [collapseOnMobile, id]);

  return (
    <section
      id={id}
      className="flex scroll-mt-4 flex-col rounded-3xl border border-[#ece7df] bg-surface p-5 shadow-[0_8px_24px_rgba(60,46,30,0.045)] lg:h-full lg:p-4"
    >
      {collapseOnMobile ? (
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left lg:hidden"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="font-display text-lg leading-6 font-medium text-foreground">{title}</span>
          <span className="shrink-0 text-sm font-medium text-muted">{open ? "Hide" : "See details"}</span>
        </button>
      ) : null}
      <h2
        className={`font-display text-lg leading-6 font-medium tracking-tight text-pretty text-foreground ${
          hideTitleOnMobile || collapseOnMobile ? "hidden lg:block" : ""
        }`}
      >
        <span className="mr-1.5 text-brand">{step}.</span>
        {title}
      </h2>
      <div
        className={`flex flex-1 flex-col gap-3 ${hideTitleOnMobile ? "max-lg:mt-0 lg:mt-3" : "mt-3"} ${collapseOnMobile && !open ? "max-lg:hidden" : ""}`}
      >
        {description ? <p className="text-sm leading-5 text-pretty text-muted/65 italic">{description}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="h-full rounded-2xl border border-[#ece7df] bg-[#fbfaf7] p-3">{children}</div>
  );
}
