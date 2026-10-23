export function AppHeader() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand text-[13px] font-semibold tracking-wide text-white"
        aria-hidden="true"
      >
        P8
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold tracking-tight text-foreground">
          Pili BatchPilot
        </p>
        <p className="text-sm text-muted">Buying decision simulator</p>
      </div>
    </div>
  );
}
