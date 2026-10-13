"use client";

import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Json } from "@/lib/database.types";
import { deleteNote, saveNote } from "./actions";
import { persistableBody } from "./body";
import { categoryOptions, categoryPath } from "./categories";
import { displayTitle } from "./labels";
import { NoteAttachments } from "./note-files";
import { NoteComments } from "./note-comments";
import { NoteEditor } from "./note-editor";
import type { NoteCategory, NoteDetail, NoteFile } from "./types";

const NO_CATEGORY = "none";

export function NotePane({
  note,
  categories,
  backHref,
  startInEdit = false,
}: {
  note: NoteDetail;
  categories: NoteCategory[];
  backHref: string;
  startInEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(startInEdit);
  const [title, setTitle] = useState(note.title);
  const [categoryId, setCategoryId] = useState<string | null>(note.categoryId);
  const [files, setFiles] = useState(note.files);
  const [comments, setComments] = useState(note.comments);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(note.title);
  const categoryRef = useRef<string | null>(note.categoryId);
  const bodyRef = useRef<Json>(note.body);
  const dirtyRef = useRef(false);
  const persistRef = useRef<(force?: boolean) => void>(() => {});
  const noteId = note.id;

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
      categoryId: categoryRef.current,
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
    dirtyRef.current = false;
    router.push(backHref);
  }

  const options = categoryOptions(categories);
  const items = [
    { value: NO_CATEGORY, label: "No category" },
    ...options.map((option) => ({ value: option.id, label: option.label })),
  ];
  const trail = categoryPath(categories, categoryId);
  const saveLabel = status === "saving" ? "Saving" : "Save";
  const statusLabel = status === "saving" ? "Saving" : status === "saved" ? "Saved" : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-2">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Notes
          </Link>
          <p className="hidden text-xs text-muted-foreground md:block">
            {editing ? statusLabel : ""}
          </p>
        </div>
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
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-3"
              onClick={() => setEditing(true)}
            >
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
        <p className="mb-2 text-xs text-muted-foreground md:hidden">{statusLabel}</p>
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
          aria-label="Title"
          className="w-full bg-transparent text-[1.5rem] font-semibold tracking-tight outline-none placeholder:text-muted-foreground md:text-[1.75rem]"
        />
      ) : (
        <h2 className="text-[1.5rem] font-semibold tracking-tight md:text-[1.75rem]">
          {displayTitle(title)}
        </h2>
      )}
      {editing ? (
        <div className="mt-3 flex max-w-sm flex-col gap-1.5">
          <Label htmlFor="note-category" className="text-xs font-normal text-muted-foreground">
            Category
          </Label>
          <Select
            value={categoryId ?? NO_CATEGORY}
            items={items}
            onValueChange={(value) => {
              const next = value && value !== NO_CATEGORY ? value : null;
              categoryRef.current = next;
              setCategoryId(next);
              markDirty();
            }}
          >
            <SelectTrigger id="note-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={NO_CATEGORY}>No category</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span style={{ paddingLeft: `${option.depth * 12}px` }}>
                    {option.label.split(" / ").at(-1)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : trail.length > 0 ? (
        <p className="mt-1 text-sm break-words text-muted-foreground">{trail.join(" / ")}</p>
      ) : null}
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
        <NoteComments
          noteId={note.id}
          comments={comments}
          onAdded={(comment) => setComments((current) => [...current, comment])}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the note, its files and its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => void onDelete()}
            >
              {deleting ? "Deleting note" : "Delete note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
