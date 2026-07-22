import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const shortcuts = [
  ["Ctrl/⌘ K", "Open command palette"],
  ["?", "Open keyboard shortcuts"],
  ["↑ / ↓", "Move through sidebar items"],
  ["Enter", "Activate focused sidebar item"],
  ["Esc", "Close overlays"]
];

/** Extracted from HospitalOperatingSystem.tsx (Track 4.10) — self-contained, no shared state. */
export function ShortcutsDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Fast navigation for the Hospital OS workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {shortcuts.map(([keys, action]) => (
            <div key={keys} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-mist p-3">
              <span className="text-sm text-muted">{action}</span>
              <kbd className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold">{keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
