import Image from "next/image";

export function AppHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/pili-mark.png"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain"
      />
      <div className="text-left">
        <p className="font-display text-base leading-5 tracking-tight text-foreground">Talli</p>
        <p className="text-xs leading-4 text-muted">Which offers to accept</p>
      </div>
    </div>
  );
}
