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
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="min-w-0 text-sm leading-5 text-muted">
        {label}
        {note ? <span className="mt-0.5 block text-xs">{note}</span> : null}
      </dt>
      <dd className="max-w-[62%] text-right text-sm leading-5 tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
