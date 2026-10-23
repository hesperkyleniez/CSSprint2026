import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
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
      ? "bg-foreground text-white hover:bg-black"
      : variant === "quiet"
        ? "bg-inset text-foreground hover:bg-[#e9e4db]"
        : "border border-[#d9d3c9] bg-white text-foreground hover:bg-inset";

  return (
    <button
      type={type}
      className={`inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 ${tone} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
