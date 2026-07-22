"use client";

import { Building2, Command, Menu, Moon, Search, Sun } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionButton } from "@/components/design-system/ActionButton";
import { LiveClockWeather } from "@/components/design-system/LiveClockWeather";
import { ProfilePhotoButton } from "@/components/design-system/ProfilePhotoButton";
import { NotificationCenter } from "@/components/hospital-os/NotificationCenter";

export function TopNav({
  onOpenSidebar,
  onOpenPalette,
  onOpenShortcuts,
  darkMode,
  onToggleTheme,
  realtimeStatus,
  hasPhoto,
  onPhotoUpdated
}: {
  onOpenSidebar: () => void;
  onOpenPalette: () => void;
  onOpenShortcuts: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  realtimeStatus: string;
  hasPhoto: boolean;
  onPhotoUpdated: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/92 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
        <ActionButton variant="outline" size="sm" className="h-9 w-9 px-0 lg:hidden" onClick={onOpenSidebar} aria-label="Open navigation">
          <Menu size={18} />
        </ActionButton>
        <ActionButton
          variant="outline"
          onClick={onOpenPalette}
          className="min-h-10 flex-1 justify-start gap-3 bg-mist px-3 text-left text-sm font-normal text-muted hover:bg-mist"
        >
          <Search size={17} />
          <span className="truncate">Search patients, UHID, doctor, invoice, medicine, bed, room, procedure...</span>
          <span className="ml-auto hidden rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold sm:block">Ctrl K</span>
        </ActionButton>
        <LiveClockWeather variant="os" />
        <Popover>
          <PopoverTrigger asChild>
            <ActionButton variant="outline" className="hidden min-h-10 gap-2 md:inline-flex">
              <Building2 size={17} /> Agra Main
            </ActionButton>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <p className="text-sm font-semibold">Branch switcher</p>
            <p className="mt-2 text-sm text-muted">Multi-branch switching is stubbed for v1 and not connected to a backend.</p>
          </PopoverContent>
        </Popover>
        <ActionButton variant="outline" size="sm" className="h-9 w-9 px-0" onClick={onOpenShortcuts} aria-label="Keyboard shortcuts">
          <Command size={18} />
        </ActionButton>
        <NotificationCenter />
        <ActionButton variant="outline" size="sm" className="h-9 w-9 px-0" onClick={onToggleTheme} aria-label="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </ActionButton>
        <ProfilePhotoButton hasPhoto={hasPhoto} onPhotoUpdated={onPhotoUpdated} avatarClassName="h-10 w-10 border border-line" />
      </div>
      <div className="border-t border-line px-4 py-2 text-xs font-medium text-muted lg:px-6">
        Realtime: <span className="capitalize text-brand">{realtimeStatus}</span>
      </div>
    </header>
  );
}
