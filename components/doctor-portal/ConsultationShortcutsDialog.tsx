import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const shortcuts = [
  ["Tab / Shift+Tab", "Move between fields"],
  ["Ctrl/⌘ + D", "Jump to Diagnosis"],
  ["Ctrl/⌘ + P", "Jump to Prescription notes"],
  ["Ctrl/⌘ + Space", "Add a medicine row"],
  ["Ctrl/⌘ + Enter", "Complete consultation"],
  ["Alt + 1–7", "Jump to a section"]
];

/** Doctor Portal-specific shortcuts — separate from the Hospital OS shell's own ShortcutsDialog (sidebar/command-palette navigation), since these only make sense inside a consultation. */
export function ConsultationShortcutsDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Consultation shortcuts</DialogTitle>
          <DialogDescription>Keyboard-first documentation — the mouse is optional.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {shortcuts.map(([keys, action]) => (
            <div key={keys} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-soft/60 p-3">
              <span className="text-sm text-muted">{action}</span>
              <kbd className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold">{keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
