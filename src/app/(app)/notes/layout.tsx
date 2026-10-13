import { NotesShell } from "@/features/notes/notes-shell";
import { loadCategories, loadNoteCategoryIds } from "@/features/notes/load";
import { rollupCounts } from "@/features/notes/categories";
import { requireUser } from "@/lib/auth/require-user";

export default async function NotesLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [categories, notes] = await Promise.all([
    loadCategories(supabase, user.id),
    loadNoteCategoryIds(supabase, user.id),
  ]);

  const counts = {
    all: notes.length,
    none: notes.filter((note) => note.categoryId == null).length,
    byCategory: Object.fromEntries(rollupCounts(categories, notes)),
  };

  return (
    <NotesShell categories={categories} counts={counts}>
      {children}
    </NotesShell>
  );
}
