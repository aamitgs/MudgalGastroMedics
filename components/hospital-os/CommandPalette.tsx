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
import type { CommandRecord } from "@/lib/hospital-os-data";

export function CommandPalette({
  open,
  setOpen,
  query,
  setQuery,
  results
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: CommandRecord[];
}) {
  function navigate(record: CommandRecord) {
    window.history.pushState(null, "", record.href);
    document.querySelector(record.href)?.scrollIntoView({ block: "start" });
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandRoot>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search patient, doctor, invoice, medicine, appointment, report, bed, room..." />
        <CommandList>
          <CommandEmpty>No matching records. Try a UHID, invoice number, medicine, bed, room, or procedure.</CommandEmpty>
          <CommandGroup heading="Direct results">
            <AnimatePresence>
              {results.map((record) => (
                <CommandItem key={record.id} value={`${record.entity} ${record.title} ${record.subtitle}`} onSelect={() => navigate(record)}>
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
