"use client";

import { Building2, Command, Menu, MessageSquare, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    <header className="sticky top-0 z-30 border-b border-[var(--hos-border)] bg-[var(--hos-surface)]/92 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)] lg:hidden" onClick={onOpenSidebar} aria-label="Open navigation">
          <Menu size={18} />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenPalette}
          className="min-h-10 flex-1 justify-start gap-3 border-[var(--hos-border)] bg-[var(--hos-bg)] px-3 text-left text-sm font-normal text-[var(--hos-muted-text)] hover:bg-[var(--hos-bg)]"
        >
          <Search size={17} />
          <span className="truncate">Search patients, UHID, doctor, invoice, medicine, bed, room, procedure...</span>
          <span className="ml-auto hidden rounded-md border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 py-1 text-[11px] font-semibold sm:block">Ctrl K</span>
        </Button>
        <LiveClockWeather variant="os" />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="hidden min-h-10 gap-2 border-[var(--hos-border)] bg-[var(--hos-surface)] md:inline-flex">
              <Building2 size={17} /> Agra Main
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <p className="text-sm font-semibold">Branch switcher</p>
            <p className="mt-2 text-sm text-[var(--hos-muted-text)]">Multi-branch switching is stubbed for v1 and not connected to a backend.</p>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)]" aria-label="Messages">
          <MessageSquare size={18} />
        </Button>
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)]" onClick={onOpenShortcuts} aria-label="Keyboard shortcuts">
          <Command size={18} />
        </Button>
        <NotificationCenter />
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)]" onClick={onToggleTheme} aria-label="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <ProfilePhotoButton hasPhoto={hasPhoto} onPhotoUpdated={onPhotoUpdated} avatarClassName="h-10 w-10 border border-[var(--hos-border)]" />
      </div>
      <div className="border-t border-[var(--hos-border)] px-4 py-2 text-xs font-medium text-[var(--hos-muted-text)] lg:px-6">
        Realtime: <span className="capitalize text-[var(--hos-primary)]">{realtimeStatus}</span>
      </div>
    </header>
  );
}
