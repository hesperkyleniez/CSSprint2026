import Image from "next/image";

export function AppHeader() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/pili-mark.png"
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        className="size-12 shrink-0 object-contain"
      />
      <div className="min-w-0">
        <p className="text-base font-semibold tracking-tight text-foreground">Talli</p>
        <p className="text-sm text-muted">Which offers to accept</p>
      </div>
    </div>
  );
}
