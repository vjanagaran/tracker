import { revalidatePath } from "next/cache";

/** The category tree and its counts live in the notes layout, so refresh from there down. */
export function refreshNotes(noteId?: string) {
  revalidatePath("/notes", "layout");
  if (noteId) {
    revalidatePath(`/notes/${noteId}`);
  }
}
