import { notFound } from "next/navigation";
import { NotePane } from "@/features/notes/note-pane";
import { loadCategories, loadNote } from "@/features/notes/load";
import { requireUser } from "@/lib/auth/require-user";

type NotePageProps = {
  params: Promise<{ noteId: string }>;
  searchParams: Promise<{ edit?: string; category?: string }>;
};

export default async function NotePage({ params, searchParams }: NotePageProps) {
  const { noteId } = await params;
  const { edit, category } = await searchParams;
  const { supabase, user } = await requireUser();
  const [selected, categories] = await Promise.all([
    loadNote(supabase, user.id, noteId),
    loadCategories(supabase, user.id),
  ]);

  if (!selected) {
    notFound();
  }

  // Back goes to the list the note was opened from, else to its own category.
  const backTo = category ?? selected.categoryId ?? "none";

  return (
    <NotePane
      key={selected.id}
      note={selected}
      categories={categories}
      backHref={`/notes?category=${encodeURIComponent(backTo)}`}
      startInEdit={edit === "1"}
    />
  );
}
