export function Metric({
  label,
  note,
  value = "—",
}: {
  label: string;
  note?: string;
  value?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <dt className="min-w-0 text-sm leading-5 text-muted">
        {label}
        {note ? <span className="mt-0.5 block text-xs">{note}</span> : null}
      </dt>
      <dd className="text-sm font-medium leading-5 tabular-nums text-foreground sm:max-w-[62%] sm:text-right">
        {value}
      </dd>
    </div>
  );
}
