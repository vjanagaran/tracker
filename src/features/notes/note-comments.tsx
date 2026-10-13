"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteComment } from "./actions";
import { formatCommentTime } from "./labels";
import type { NoteComment } from "./types";

export function NoteComments({
  noteId,
  comments,
  onAdded,
}: {
  noteId: string;
  comments: NoteComment[];
  onAdded: (comment: NoteComment) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addNoteComment({
      noteId,
      comment: String(formData.get("comment") ?? ""),
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    onAdded(result.comment);
  }

  return (
    <section className="mt-8 border-t border-border pt-6" aria-labelledby="note-comments-heading">
      <h2 id="note-comments-heading" className="text-sm font-medium">
        Comments
      </h2>
      {comments.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Comments stay with the note, so you can record what changed and when.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-border py-3 last:border-b-0">
              <p className="text-sm break-words whitespace-pre-wrap">{comment.comment}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatCommentTime(comment.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={onSubmit} className="mt-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Add a comment
          <Textarea
            name="comment"
            required
            rows={3}
            className="min-h-[5.5rem] bg-background text-foreground"
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="min-h-11 w-fit px-4" disabled={pending}>
          {pending ? "Adding a comment" : "Add a comment"}
        </Button>
      </form>
    </section>
  );
}
