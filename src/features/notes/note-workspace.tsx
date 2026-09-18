"use client";

import { ChevronLeft, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Json } from "@/lib/database.types";
import { createNote, deleteNote, saveNote } from "./actions";
import { persistableBody } from "./body";
import { displayTitle } from "./labels";
import { NoteAttachments } from "./note-files";
import { NoteEditor } from "./note-editor";
import { NoteList } from "./note-list";
import type { NoteDetail, NoteFile, NoteListItem } from "./types";

export function NoteWorkspace({
  notes,
  selected,
  startInEdit = false,
}: {
  notes: NoteListItem[];
  selected: NoteDetail | null;
  startInEdit?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(notes);
  const [notesSnapshot, setNotesSnapshot] = useState(notes);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const selectedId = selected?.id ?? null;
  const [paneId, setPaneId] = useState(selectedId);
  const [editing, setEditing] = useState(Boolean(startInEdit));

  if (notes !== notesSnapshot) {
    setNotesSnapshot(notes);
    setItems(notes);
  }

  if (selectedId !== paneId) {
    setPaneId(selectedId);
    setEditing(Boolean(startInEdit));
  }

  const visible = items.filter((note) => {
    const haystack = `${note.title} ${note.preview}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  async function onNewNote() {
    setCreating(true);
    setListError(null);
    const result = await createNote();
    setCreating(false);
    if ("error" in result) {
      setListError(result.error);
      return;
    }
    setItems((current) => [result.note, ...current.filter((row) => row.id !== result.note.id)]);
    router.push(`/notes/${result.note.id}?edit=1`);
  }

  function onMeta(note: NoteListItem) {
    setItems((current) => {
      const next = current.map((row) => (row.id === note.id ? note : row));
      next.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      return next;
    });
  }

  return (
    <div className="-mx-5 -mt-6 flex min-h-[calc(100dvh-8.5rem)] flex-col md:-mx-10 md:-my-9 md:min-h-[calc(100dvh)] md:flex-row">
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-border px-5 md:w-72 md:border-r md:px-4 md:py-6",
          selected ? "hidden md:flex" : "flex",
        )}
      >
        <div className="flex items-center justify-between gap-3 py-3 md:pt-0">
          <h1 className="text-lg font-semibold tracking-tight">Notes</h1>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-3"
            disabled={creating}
            onClick={() => void onNewNote()}
          >
            <Plus className="size-4" aria-hidden="true" />
            {creating ? "Adding a note" : "New note"}
          </Button>
        </div>
        <label className="relative mb-3 block">
          <span className="sr-only">Search notes</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="pl-8"
          />
        </label>
        {listError ? <p className="mb-2 text-sm text-destructive">{listError}</p> : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 && query.trim() ? (
            <p className="px-1 py-4 text-sm text-muted-foreground">No notes match that search.</p>
          ) : (
            <NoteList
              notes={visible}
              selectedId={selected?.id ?? null}
              onSelect={() => setEditing(false)}
            />
          )}
        </div>
      </aside>
      <section
        className={cn(
          "min-w-0 flex-1 px-5 py-4 md:px-8 md:py-6",
          selected ? "flex flex-col" : "hidden md:flex md:flex-col",
        )}
      >
        {selected ? (
          <NotePane
            key={selected.id}
            note={selected}
            editing={editing}
            onEdit={() => setEditing(true)}
            onMeta={onMeta}
            onDeleted={() => {
              setItems((current) => current.filter((row) => row.id !== selected.id));
              router.push("/notes");
            }}
          />
        ) : (
          <div className="flex flex-1 flex-col justify-center">
            <p className="max-w-prose text-sm text-muted-foreground">Personal documents stay here.</p>
            <Button type="button" className="mt-4 min-h-11 w-fit px-4" onClick={() => void onNewNote()}>
              <Plus className="size-4" aria-hidden="true" />
              New note
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function NotePane({
  note,
  editing,
  onEdit,
  onMeta,
  onDeleted,
}: {
  note: NoteDetail;
  editing: boolean;
  onEdit: () => void;
  onMeta: (item: NoteListItem) => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [files, setFiles] = useState(note.files);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(note.title);
  const bodyRef = useRef<Json>(note.body);
  const dirtyRef = useRef(false);
  const onMetaRef = useRef(onMeta);
  const persistRef = useRef<(force?: boolean) => void>(() => {});
  const noteId = note.id;

  useEffect(() => {
    onMetaRef.current = onMeta;
  }, [onMeta]);

  function markDirty() {
    dirtyRef.current = true;
    setRevision((value) => value + 1);
  }

  function persist(force = false) {
    if (!force && !dirtyRef.current) {
      return;
    }
    dirtyRef.current = false;
    setStatus("saving");
    void saveNote({
      id: noteId,
      title: titleRef.current,
      body: persistableBody(bodyRef.current),
    }).then((result) => {
      if ("error" in result) {
        dirtyRef.current = true;
        setError(result.error);
        setStatus("idle");
        return;
      }
      setError(null);
      setStatus("saved");
      onMetaRef.current(result.note);
    });
  }

  useEffect(() => {
    persistRef.current = persist;
  });

  useEffect(() => {
    return () => {
      persistRef.current();
    };
  }, []);

  useEffect(() => {
    if (!editing || revision === 0) {
      return;
    }
    const timer = setTimeout(() => {
      persistRef.current();
    }, 700);
    return () => clearTimeout(timer);
  }, [revision, noteId, editing]);

  async function onDelete() {
    setDeleting(true);
    const result = await deleteNote({ id: note.id });
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
      setConfirmDelete(false);
      return;
    }
    onDeleted();
  }

  const saveLabel = status === "saving" ? "Saving" : "Save";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-2">
        <Link
          href="/notes"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground md:hidden"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Notes
        </Link>
        <p className="hidden min-h-11 items-center text-xs text-muted-foreground md:flex">
          {editing ? (status === "saving" ? "Saving" : status === "saved" ? "Saved" : "") : ""}
        </p>
        <div className="ml-auto flex items-center gap-1">
          {editing ? (
            <Button
              type="button"
              className="min-h-11 px-4"
              disabled={status === "saving"}
              onClick={() => persist(true)}
            >
              {saveLabel}
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="min-h-11 px-3" onClick={onEdit}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-3"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete note
          </Button>
        </div>
      </div>
      {editing ? (
        <p className="mb-2 text-xs text-muted-foreground md:hidden">
          {status === "saving" ? "Saving" : status === "saved" ? "Saved" : ""}
        </p>
      ) : null}
      {editing ? (
        <input
          value={title}
          onChange={(event) => {
            titleRef.current = event.target.value;
            setTitle(event.target.value);
            markDirty();
          }}
          placeholder="Title"
          className="w-full bg-transparent text-[1.5rem] font-semibold tracking-tight outline-none placeholder:text-muted-foreground md:text-[1.75rem]"
        />
      ) : (
        <h2 className="text-[1.5rem] font-semibold tracking-tight md:text-[1.75rem]">
          {displayTitle(title)}
        </h2>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NoteEditor
          note={note}
          files={files}
          editable={editing}
          onBodyChange={(body) => {
            bodyRef.current = body as Json;
            if (editing) {
              markDirty();
            }
          }}
          onFile={(file: NoteFile) => setFiles((current) => [...current, file])}
          onError={setError}
        />
        <NoteAttachments
          noteId={note.id}
          files={files}
          editable={editing}
          onAdd={(file) => setFiles((current) => [...current, file])}
          onRemove={(fileId) => setFiles((current) => current.filter((file) => file.id !== fileId))}
          onError={setError}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note</AlertDialogTitle>
            <AlertDialogDescription>This removes the note and its files.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void onDelete()}>
              {deleting ? "Deleting note" : "Delete note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
