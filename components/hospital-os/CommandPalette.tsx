"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Command, Send } from "lucide-react";
import {
  Command as CommandRoot,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import type { CommandRecord, NavItem } from "@/lib/hospital-os-data";

export function CommandPalette({
  open,
  setOpen,
  query,
  setQuery,
  results,
  pages
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: CommandRecord[];
  pages: NavItem[];
}) {
  // Track 4.13: the palette now opens from every Hospital OS page, not just
  // the dashboard where these anchors actually live. Same-page targets keep
  // the instant pushState+scroll (no reload); a target on a different page
  // gets a real navigation so the browser loads that page and scrolls itself.
  function navigate(href: string) {
    const hashIndex = href.indexOf("#");
    const targetPath = hashIndex === -1 ? href : href.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : href.slice(hashIndex);

    if (!targetPath || targetPath === window.location.pathname) {
      window.history.pushState(null, "", href);
      if (hash) document.querySelector(hash)?.scrollIntoView({ block: "start" });
    } else {
      window.location.assign(href);
    }
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {/* results/pages are already Fuse.js-filtered (including each item's keywords)
          before they reach this component — cmdk's own built-in filter only sees
          the literal `value` string below and would silently re-hide any match
          that came from a keyword alias not present in that string. */}
      <CommandRoot shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search patient, doctor, invoice, medicine, appointment, report, bed, room..." />
        <CommandList>
          <CommandEmpty>No matching records. Try a UHID, invoice number, medicine, bed, room, procedure, or a module name like Settings or HR.</CommandEmpty>
          {pages.length > 0 ? (
            <CommandGroup heading="Pages">
              <AnimatePresence>
                {pages.map((item) => (
                  <CommandItem key={item.label} value={`page ${item.label}`} onSelect={() => navigate(item.href)}>
                    <motion.div
                      className="flex w-full items-center gap-3"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]">
                        <item.icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.label}</span>
                        <span className="block truncate text-xs text-[var(--hos-muted-text)]">Go to page</span>
                      </span>
                      <Send size={14} className="text-[var(--hos-muted-text)]" />
                    </motion.div>
                  </CommandItem>
                ))}
              </AnimatePresence>
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Direct results">
            <AnimatePresence>
              {results.map((record) => (
                <CommandItem key={record.id} value={`${record.entity} ${record.title} ${record.subtitle}`} onSelect={() => navigate(record.href)}>
                  <motion.div
                    className="flex w-full items-center gap-3"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]">
                      <Command size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{record.title}</span>
                      <span className="block truncate text-xs text-[var(--hos-muted-text)]">{record.entity} · {record.subtitle}</span>
                    </span>
                    <Send size={14} className="text-[var(--hos-muted-text)]" />
                  </motion.div>
                </CommandItem>
              ))}
            </AnimatePresence>
          </CommandGroup>
        </CommandList>
      </CommandRoot>
    </CommandDialog>
  );
}
