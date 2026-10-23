"use client";

import type { ReactNode } from "react";

const controlClass =
  "h-11 w-full min-w-0 rounded-full border border-[#ddd6cc] bg-white px-4 text-base text-foreground outline-none transition focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

function FieldShell({
  id,
  label,
  detail,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  detail?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const message = error ?? hint;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-5 text-pretty text-foreground"
      >
        {label}
        {detail ? (
          <span className="mt-0.5 block text-xs leading-4 font-normal text-pretty text-muted/65 italic">
            {detail}
          </span>
        ) : null}
      </label>
      {children}
      {message ? (
        <p
          id={messageId}
          className={`text-sm leading-5 text-pretty ${error ? "text-[#8a3b2c]" : "text-muted/65 italic"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
    >
      <path
        d="M5.5 7.5 10 12l4.5-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TextField({
  id,
  label,
  detail,
  hint,
  error,
  describedBy,
  value,
  onChange,
  inputMode = "text",
}: {
  id: string;
  label: string;
  detail?: string;
  hint?: string;
  error?: string;
  describedBy?: string;
  value?: string;
  onChange?: (value: string) => void;
  inputMode?: "text" | "decimal" | "numeric";
}) {
  const messageId = error || hint ? `${id}-message` : undefined;
  const describedByIds = [messageId, describedBy].filter(Boolean).join(" ") || undefined;

  return (
    <FieldShell id={id} label={label} detail={detail} hint={hint} error={error}>
      <input
        id={id}
        name={id}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds}
        className={`${controlClass} ${error ? "border-[#a24b38] focus-visible:border-[#a24b38] focus-visible:outline-[#a24b38]" : ""}`}
      />
    </FieldShell>
  );
}

export function ReadOnlyField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span
        id={`${id}-label`}
        className="text-[13px] font-medium leading-5 text-foreground"
      >
        {label}
      </span>
      <p
        id={id}
        aria-labelledby={`${id}-label`}
        className="flex min-h-11 items-center rounded-full border border-[#ddd6cc] bg-inset px-4 py-2 text-base leading-5 text-pretty text-foreground"
      >
        {value}
      </p>
    </div>
  );
}

export function SelectField({
  id,
  label,
  hint,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const messageId = hint ? `${id}-message` : undefined;

  return (
    <FieldShell id={id} label={label} hint={hint}>
      <div className="relative">
        <select
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={messageId}
          className={`${controlClass} cursor-pointer appearance-none pr-12`}
        >
          {children}
        </select>
        <Chevron />
      </div>
    </FieldShell>
  );
}
