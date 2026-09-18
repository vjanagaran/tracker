import { NoteWorkspace } from "@/features/notes/note-workspace";
import { loadNoteList } from "@/features/notes/load";
import { requireUser } from "@/lib/auth/require-user";

export default async function NotesPage() {
  const { supabase, user } = await requireUser();
  const notes = await loadNoteList(supabase, user.id);

  return <NoteWorkspace notes={notes} selected={null} />;
}
