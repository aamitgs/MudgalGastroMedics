import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { AccessRole } from "@/lib/access/matrix";
import type { StaffNote, StaffNoteCategory, StaffNoteDepartment, StaffNotePriority, StaffNoteStatus } from "@/lib/staff-notes-types";

type StaffNoteStore = { notes: StaffNote[] };

const store = createDocumentStore<StaffNoteStore>("staff-notes", (parsed) => {
  const doc = parsed as Partial<StaffNoteStore> | undefined;
  return { notes: Array.isArray(doc?.notes) ? (doc.notes as StaffNote[]) : [] };
});

export async function listStaffNotes() {
  return (await store.load()).notes;
}

export async function createStaffNote(input: {
  category: StaffNoteCategory;
  fromDepartment: StaffNoteDepartment;
  toDepartment: StaffNoteDepartment;
  authorRole: AccessRole;
  authorName: string;
  priority: StaffNotePriority;
  message: string;
  patientId?: string;
  patientName?: string;
}) {
  const doc = await store.load();
  const now = new Date().toISOString();
  const note: StaffNote = {
    id: generateId("NOTE", 4),
    createdAt: now,
    updatedAt: now,
    category: input.category,
    fromDepartment: input.fromDepartment,
    toDepartment: input.toDepartment,
    authorRole: input.authorRole,
    authorName: input.authorName,
    priority: input.priority,
    message: input.message,
    patientId: input.patientId,
    patientName: input.patientName,
    status: "Open"
  };
  doc.notes.unshift(note);
  await store.save(doc);
  return note;
}

export async function updateStaffNoteStatus(id: string, status: StaffNoteStatus, acknowledgedBy: string) {
  const doc = await store.load();
  const note = doc.notes.find((item) => item.id === id);
  if (!note) return null;
  note.status = status;
  note.updatedAt = new Date().toISOString();
  if (status === "Acknowledged" || status === "Resolved") {
    note.acknowledgedBy = acknowledgedBy;
    note.acknowledgedAt = new Date().toISOString();
  }
  await store.save(doc);
  return note;
}

/**
 * Hard delete — only Resolved notes. Unlike the other three operational
 * modules, staff notes have no "draft/cancelled/never happened" state: every
 * note was a real message someone sent, so Open/Acknowledged notes (a shift
 * may still be relying on them) never qualify — Resolved is the only
 * terminal state.
 */
export async function deleteStaffNote(id: string) {
  const doc = await store.load();
  const note = doc.notes.find((item) => item.id === id);
  if (!note) return { error: "Note not found." };
  if (note.status !== "Resolved") return { error: "Only Resolved notes can be deleted." };

  doc.notes = doc.notes.filter((item) => item.id !== id);
  await store.save(doc);
  return { note };
}
