import Image from "next/image";

type BrandMarkProps = { compact?: boolean };

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="flex items-center gap-2 text-[#671525]">
      <Image alt="" aria-hidden="true" height={36} priority src="/brand/monogram.svg" width={36} />
      {!compact && <span className="text-base font-bold tracking-tight">Make My Marriage</span>}
    </span>
  );
}
