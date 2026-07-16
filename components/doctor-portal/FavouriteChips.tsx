"use client";

import { Sparkles } from "lucide-react";

export function FavouriteChips({ favourites, onPick }: { favourites: string[]; onPick: (value: string) => void }) {
  if (!favourites.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {favourites.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          title={value}
          className="max-w-[220px] truncate rounded-full border border-line bg-soft/60 px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
        >
          <Sparkles size={11} className="mr-1 inline -mt-0.5" />
          {value}
        </button>
      ))}
    </div>
  );
}
