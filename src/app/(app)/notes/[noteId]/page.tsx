import { notFound } from "next/navigation";
import { NoteWorkspace } from "@/features/notes/note-workspace";
import { loadNote, loadNoteList } from "@/features/notes/load";
import { requireUser } from "@/lib/auth/require-user";

type NotePageProps = {
  params: Promise<{ noteId: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function NotePage({ params, searchParams }: NotePageProps) {
  const { noteId } = await params;
  const { edit } = await searchParams;
  const { supabase, user } = await requireUser();
  const [notes, selected] = await Promise.all([
    loadNoteList(supabase, user.id),
    loadNote(supabase, user.id, noteId),
  ]);

  if (!selected) {
    notFound();
  }

  return (
    <NoteWorkspace notes={notes} selected={selected} startInEdit={edit === "1"} />
  );
}
