import type { ReactNode } from "react";

export function SectionCard({
  id,
  step,
  title,
  description,
  children,
}: {
  id: string;
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-line bg-surface px-3 py-4 shadow-[0_1px_2px_rgba(48,32,12,0.04)] sm:px-5 sm:py-6"
    >
      <header className="mb-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          <span className="mr-1 text-brand">{step}.</span>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-inset p-3 sm:p-4">{children}</div>
  );
}
