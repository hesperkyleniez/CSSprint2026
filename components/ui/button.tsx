import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  children,
  type = "button",
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const tone =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-deep"
      : "border border-line bg-white text-foreground hover:bg-inset";

  return (
    <button
      type={type}
      className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 ${tone} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
