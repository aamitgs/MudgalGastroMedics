import Image from "next/image";

type BrandIconTileProps = {
  className?: string;
  imageClassName?: string;
};

export function BrandIconTile({ className = "", imageClassName = "" }: BrandIconTileProps) {
  return (
    <span className={`grid place-items-center rounded bg-soft text-brand-dark ${className}`}>
      <Image
        src="/mgm-icon.png"
        alt=""
        width={72}
        height={72}
        className={`h-[72%] w-[72%] object-contain ${imageClassName}`}
      />
    </span>
  );
}
