"use client";

import {
  CalendarPlus,
  FlaskConical,
  History,
  Pill,
  Search,
  Star,
  UserRoundPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import type { SearchCategory, SearchResult } from "@/lib/global-search";
import { useCommandHistoryStore, useCommandPaletteStore, type FavouriteCommand } from "@/stores/command-history-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

type SearchResponse = { ok: boolean; results?: SearchResult[]; error?: string };

const categoryIcon: Record<SearchCategory, typeof Users> = {
  Patients: Users,
  Appointments: CalendarPlus,
  Laboratory: FlaskConical,
  Pharmacy: Pill,
  Admissions: Users,
  Employees: Users
};

const quickCreateActions: FavouriteCommand[] = [
  { id: "qc-patient", label: "New patient", href: "/mudgalgastromedics-os/patients" },
  { id: "qc-appointment", label: "Book appointment", href: "/mudgalgastromedics-os/appointments" },
  { id: "qc-invoice", label: "Generate invoice", href: "/mudgalgastromedics-os/billing" },
  { id: "qc-lab", label: "Order lab test", href: "/mudgalgastromedics-os/lab" }
];

function navigate(href: string) {
  if (href.startsWith("/")) {
    window.location.assign(href);
    return;
  }
  window.history.pushState(null, "", `/admin${href}`);
  document.querySelector(href)?.scrollIntoView({ block: "start" });
}

/**
 * Enterprise command palette (Tracks 2.5/2.6/2.7): Ctrl/Cmd+K, live search
 * over real stores, recent patients, favourite commands and quick-create.
 * Mounted once in StaffChrome so it is available on the Doctor Portal
 * (/mudgalgastromedics-os/doctor-portal) — the Master Prompt's fastest way
 * to use the platform.
 */
export function GlobalCommandPalette() {
  const { open, setOpen, toggle } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const { recentPatients, favouriteCommands, recordRecentPatient, toggleFavouriteCommand, isFavouriteCommand } = useCommandHistoryStore();
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    let active = true;
    // All setState calls deferred into the timer callback — none run
    // synchronously in the effect body (react-hooks/set-state-in-effect).
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { cache: "no-store" }).catch(() => null);
      if (!active) return;
      const data = ((await response?.json().catch(() => ({}))) ?? {}) as SearchResponse;
      setResults(response?.ok && data.ok && data.results ? data.results : []);
      setLoading(false);
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const grouped = useMemo(() => {
    const byCategory = new Map<SearchCategory, SearchResult[]>();
    for (const result of results) {
      const list = byCategory.get(result.category) ?? [];
      list.push(result);
      byCategory.set(result.category, list);
    }
    return Array.from(byCategory.entries());
  }, [results]);

  function selectResult(result: SearchResult) {
    setOpen(false);
    if (result.patientPhone) {
      recordRecentPatient(result.patientPhone, result.title);
      openDrawer(result.patientPhone, result.title);
      return;
    }
    navigate(result.href);
  }

  const showingSearch = query.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search patients, appointments, lab, pharmacy, staff — or run a quick action.">
      <Command shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search patients, appointments, medicines, staff…" />
        <CommandList>
          {showingSearch ? (
            <>
              <CommandEmpty>{loading ? "Searching…" : "No matching records. Try a name, UHID, phone or medicine."}</CommandEmpty>
              {grouped.map(([category, items]) => {
                const Icon = categoryIcon[category];
                return (
                  <CommandGroup key={category} heading={category}>
                    {items.map((result) => (
                      <CommandItem key={`${result.category}-${result.id}`} value={`${result.category}-${result.id}`} onSelect={() => selectResult(result)}>
                        <Icon size={15} className="text-brand" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{result.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          ) : (
            <>
              <CommandGroup heading="Quick create">
                {quickCreateActions.map((action) => (
                  <CommandItem key={action.id} value={action.label} onSelect={() => (setOpen(false), navigate(action.href))}>
                    <UserRoundPlus size={15} className="text-brand" />
                    {action.label}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavouriteCommand(action);
                      }}
                      aria-label={isFavouriteCommand(action.id) ? "Remove from favourites" : "Add to favourites"}
                      className="ml-auto text-muted-foreground hover:text-brand"
                    >
                      <Star size={13} fill={isFavouriteCommand(action.id) ? "currentColor" : "none"} />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>

              {favouriteCommands.length ? (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Favourites">
                    {favouriteCommands.map((command) => (
                      <CommandItem key={command.id} value={`fav-${command.id}`} onSelect={() => (setOpen(false), navigate(command.href))}>
                        <Star size={15} className="text-gold" fill="currentColor" />
                        {command.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : null}

              {recentPatients.length ? (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Recently viewed">
                    {recentPatients.map((patient) => (
                      <CommandItem
                        key={patient.phone}
                        value={`recent-${patient.phone}`}
                        onSelect={() => {
                          setOpen(false);
                          recordRecentPatient(patient.phone, patient.name);
                          openDrawer(patient.phone, patient.name);
                        }}
                      >
                        <History size={15} className="text-brand" />
                        {patient.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : null}

              {!favouriteCommands.length && !recentPatients.length ? (
                <p className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                  <Search size={14} /> Type to search patients, appointments, lab orders, pharmacy stock or staff.
                </p>
              ) : null}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
