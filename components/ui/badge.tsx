import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted">
      {children}
    </span>
  );
}
