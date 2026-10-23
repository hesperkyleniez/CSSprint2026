import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "outline",
}: {
  children: ReactNode;
  tone?: "outline" | "solid";
}) {
  const style =
    tone === "solid"
      ? "border-transparent bg-kernel text-white"
      : "border-[#ddd6cc] bg-white text-muted";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide ${style}`}
    >
      {children}
    </span>
  );
}
