import type { DragEvent } from "react";

const NOTE_DRAG_TYPE = "application/x-note-move";

/** What travels with a dragged note: enough to move it, and to put it back. */
export type DraggedNote = {
  id: string;
  title: string;
  categoryId: string | null;
};

/**
 * Notes are dragged from the list onto a category in the tree. Dragging needs a
 * mouse; the category menu on the note itself does the same on keyboard and touch.
 */
export function startNoteDrag(event: DragEvent, note: DraggedNote) {
  event.dataTransfer.setData(NOTE_DRAG_TYPE, JSON.stringify(note));
  event.dataTransfer.effectAllowed = "move";
}

export function isNoteDrag(event: DragEvent) {
  return event.dataTransfer.types.includes(NOTE_DRAG_TYPE);
}

export function readNoteDrag(event: DragEvent): DraggedNote | null {
  const raw = event.dataTransfer.getData(NOTE_DRAG_TYPE);
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<DraggedNote>;
    if (typeof value.id !== "string") {
      return null;
    }
    return {
      id: value.id,
      title: typeof value.title === "string" ? value.title : "",
      categoryId: typeof value.categoryId === "string" ? value.categoryId : null,
    };
  } catch {
    return null;
  }
}
