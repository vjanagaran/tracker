"use client";

import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { hydrateBody } from "./body";
import { NoteImage } from "./note-image";
import { NoteToolbar } from "./note-toolbar";
import { IMAGE_MIME_TYPES } from "./schema";
import type { NoteDetail, NoteFile } from "./types";
import { uploadNoteFile } from "./upload";

const imageMime = new Set<string>(IMAGE_MIME_TYPES);

function inlineUrls(files: NoteFile[]) {
  const urls: Record<string, string> = {};
  for (const file of files) {
    if (file.kind === "inline" && file.signedUrl) {
      urls[file.id] = file.signedUrl;
    }
  }
  return urls;
}

export function NoteEditor({
  note,
  files,
  editable,
  onBodyChange,
  onFile,
  onError,
}: {
  note: NoteDetail;
  files: NoteFile[];
  editable: boolean;
  onBodyChange: (body: ReturnType<typeof hydrateBody>) => void;
  onFile: (file: NoteFile) => void;
  onError: (message: string) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const onBodyChangeRef = useRef(onBodyChange);
  const onFileRef = useRef(onFile);
  const onErrorRef = useRef(onError);
  const addImagesRef = useRef<(imageFiles: File[]) => Promise<void>>(async () => {});
  const editorRef = useRef<Editor | null>(null);
  const editableRef = useRef(editable);

  useEffect(() => {
    onBodyChangeRef.current = onBodyChange;
    onFileRef.current = onFile;
    onErrorRef.current = onError;
  }, [onBodyChange, onFile, onError]);

  useEffect(() => {
    editableRef.current = editable;
  }, [editable]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: editable ? "Write the note" : "" }),
      NoteImage,
    ],
    content: hydrateBody(note.body, inlineUrls(files)),
    editorProps: {
      attributes: {
        class: "note-editor-body min-h-[50vh] px-0 py-4 text-[15px] leading-relaxed outline-none",
      },
      handlePaste(_view, event) {
        if (!editableRef.current) {
          return false;
        }
        const images = [...(event.clipboardData?.files ?? [])].filter((file) =>
          imageMime.has(file.type),
        );
        if (images.length === 0) {
          return false;
        }
        void addImagesRef.current(images);
        return true;
      },
      handleDrop(_view, event) {
        if (!editableRef.current) {
          return false;
        }
        const images = [...(event.dataTransfer?.files ?? [])].filter((file) =>
          imageMime.has(file.type),
        );
        if (images.length === 0) {
          return false;
        }
        event.preventDefault();
        void addImagesRef.current(images);
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      onBodyChangeRef.current(instance.getJSON());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    addImagesRef.current = async (imageFiles: File[]) => {
      const instance = editorRef.current;
      if (!instance || !editableRef.current || uploading.current) {
        return;
      }
      uploading.current = true;
      try {
        for (const file of imageFiles) {
          const result = await uploadNoteFile({ noteId: note.id, file, kind: "inline" });
          if ("error" in result) {
            onErrorRef.current(result.error);
            continue;
          }
          onFileRef.current(result.file);
          instance
            .chain()
            .focus()
            .insertContent({
              type: "image",
              attrs: {
                src: result.file.signedUrl ?? "",
                fileId: result.file.id,
              },
            })
            .run();
        }
      } finally {
        uploading.current = false;
      }
    };
  }, [note.id]);

  return (
    <div className="note-editor" data-mode={editable ? "edit" : "view"}>
      {editable ? (
        <>
          <NoteToolbar editor={editor} onInsertImage={() => imageInputRef.current?.click()} />
          <input
            ref={imageInputRef}
            type="file"
            accept={IMAGE_MIME_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => {
              const chosen = [...(event.target.files ?? [])];
              event.target.value = "";
              if (chosen.length > 0) {
                void addImagesRef.current(chosen);
              }
            }}
          />
        </>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
