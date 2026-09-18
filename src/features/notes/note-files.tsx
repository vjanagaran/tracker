"use client";

import { Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { removeNoteFile } from "./actions";
import { formatFileSize } from "./labels";
import type { NoteFile } from "./types";
import { uploadNoteFile } from "./upload";

export function NoteAttachments({
  noteId,
  files,
  editable,
  onAdd,
  onRemove,
  onError,
}: {
  noteId: string;
  files: NoteFile[];
  editable: boolean;
  onAdd: (file: NoteFile) => void;
  onRemove: (fileId: string) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const attachments = files.filter((file) => file.kind === "attachment");
  if (!editable && attachments.length === 0) {
    return null;
  }

  async function onChosen(list: FileList | null) {
    const chosen = [...(list ?? [])];
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (chosen.length === 0) {
      return;
    }
    setPending(true);
    try {
      for (const file of chosen) {
        const result = await uploadNoteFile({ noteId, file, kind: "attachment" });
        if ("error" in result) {
          onError(result.error);
          continue;
        }
        onAdd(result.file);
      }
    } finally {
      setPending(false);
    }
  }

  async function onRemoveFile(fileId: string) {
    const result = await removeNoteFile({ noteId, fileId });
    if ("error" in result) {
      onError(result.error);
      return;
    }
    onRemove(fileId);
  }

  return (
    <section className="mt-8 border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Files</h2>
        {editable ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-3"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="size-4" aria-hidden="true" />
            {pending ? "Attaching files" : "Attach files"}
          </Button>
        ) : null}
      </div>
      {editable ? (
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => void onChosen(event.target.files)}
        />
      ) : null}
      {attachments.length > 0 ? (
        <ul className="mt-3 divide-y divide-border">
          {attachments.map((file) => (
            <li key={file.id} className="flex min-h-14 items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                {file.signedUrl ? (
                  <a
                    href={file.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {file.name}
                  </a>
                ) : (
                  <p className="truncate text-sm">{file.name}</p>
                )}
                <p className="text-xs text-muted-foreground">{formatFileSize(file.sizeBytes)}</p>
              </div>
              {editable ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 shrink-0 px-3"
                  onClick={() => void onRemoveFile(file.id)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
