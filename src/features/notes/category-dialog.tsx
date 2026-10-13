"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategory, updateCategory } from "./category-actions";
import { categoryOptions, CATEGORY_MAX_LENGTH, descendantIds } from "./categories";
import type { NoteCategory } from "./types";

const TOP_LEVEL = "top";

export type CategoryDialogState =
  | { mode: "create"; parentId: string | null }
  | { mode: "edit"; category: NoteCategory };

export function CategoryDialog({
  state,
  categories,
  onClose,
  onSaved,
}: {
  state: CategoryDialogState | null;
  categories: NoteCategory[];
  onClose: () => void;
  onSaved: (category: NoteCategory) => void;
}) {
  return (
    <Dialog open={state != null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        {state ? (
          <CategoryForm
            key={state.mode === "edit" ? state.category.id : `new-${state.parentId ?? "top"}`}
            state={state}
            categories={categories}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  state,
  categories,
  onClose,
  onSaved,
}: {
  state: CategoryDialogState;
  categories: NoteCategory[];
  onClose: () => void;
  onSaved: (category: NoteCategory) => void;
}) {
  const editing = state.mode === "edit";
  const [name, setName] = useState(editing ? state.category.name : "");
  const [parentId, setParentId] = useState<string | null>(
    editing ? state.category.parentId : state.parentId,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const excluded = editing
    ? descendantIds(categories, state.category.id).add(state.category.id)
    : new Set<string>();
  const options = categoryOptions(categories, excluded);
  const items = [
    { value: TOP_LEVEL, label: "Top level" },
    ...options.map((option) => ({ value: option.id, label: option.label })),
  ];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = editing
      ? await updateCategory({ id: state.category.id, name, parentId })
      : await createCategory({ name, parentId });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.category);
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Rename it or move it under another category."
            : "Categories group your notes. Put one inside another to make a subcategory."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          value={name}
          maxLength={CATEGORY_MAX_LENGTH}
          autoComplete="off"
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-parent">Inside</Label>
        <Select
          value={parentId ?? TOP_LEVEL}
          items={items}
          onValueChange={(value) => setParentId(value && value !== TOP_LEVEL ? value : null)}
        >
          <SelectTrigger id="category-parent" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={TOP_LEVEL}>Top level</SelectItem>
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {editing
            ? pending
              ? "Saving category"
              : "Save category"
            : pending
              ? "Adding category"
              : "Add category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
