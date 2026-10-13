import { NoteListPanel } from "@/features/notes/note-list-panel";
import { loadCategories, loadNoteList } from "@/features/notes/load";
import { requireUser } from "@/lib/auth/require-user";

type NotesPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const { category } = await searchParams;
  const { supabase, user } = await requireUser();
  const [notes, categories] = await Promise.all([
    loadNoteList(supabase, user.id),
    loadCategories(supabase, user.id),
  ]);

  return <NoteListPanel notes={notes} categories={categories} scopeValue={category ?? null} />;
}
