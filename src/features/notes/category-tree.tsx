"use client";

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState, type DragEvent } from "react";
import { toast } from "sonner";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CategoryDialog, type CategoryDialogState } from "./category-dialog";
import { deleteCategory, moveCategory } from "./category-actions";
import { moveNote } from "./actions";
import { isNoteDrag, readNoteDrag } from "./note-drag";
import {
  buildCategoryTree,
  SCOPE_ALL,
  SCOPE_NONE,
  siblingPosition,
  visibleCategories,
  type NoteScope,
} from "./categories";
import type { NoteCategory, NoteCategoryNode } from "./types";

const NO_CATEGORY_KEY = "__none__";
const DROP_HIGHLIGHT = "bg-accent ring-2 ring-primary/30";

type Counts = {
  all: number;
  none: number;
  byCategory: Record<string, number>;
};

export function CategoryTree({
  categories,
  counts,
  scope,
}: {
  categories: NoteCategory[];
  counts: Counts;
  scope: NoteScope | null;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null);
  const [removing, setRemoving] = useState<NoteCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The row a dragged note is over: a category id, or NO_CATEGORY_KEY.
  const [dropOver, setDropOver] = useState<string | null>(null);

  const tree = buildCategoryTree(categories);
  const rows = visibleCategories(tree, collapsed);

  function toggle(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function expand(id: string | null) {
    if (!id) {
      return;
    }
    setCollapsed((current) => {
      if (!current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  async function dropNote(event: DragEvent, categoryId: string | null) {
    event.preventDefault();
    setDropOver(null);
    const note = readNoteDrag(event);
    if (!note || note.categoryId === categoryId) {
      return;
    }
    const target = categoryId
      ? (categories.find((category) => category.id === categoryId)?.name ?? "that category")
      : "No category";
    const result = await moveNote({ id: note.id, categoryId });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`Note moved to ${target}.`, {
      action: {
        label: "Undo",
        onClick: () => {
          void moveNote({ id: note.id, categoryId: note.categoryId }).then((undone) => {
            if ("error" in undone) {
              toast.error(undone.error);
            }
          });
        },
      },
    });
  }

  /** Handlers that make a row accept a dragged note. */
  function dropTarget(key: string, categoryId: string | null) {
    return {
      onDragOver: (event: DragEvent) => {
        if (isNoteDrag(event)) {
          event.preventDefault();
          setDropOver(key);
        }
      },
      onDragLeave: (event: DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDropOver((current) => (current === key ? null : current));
        }
      },
      onDrop: (event: DragEvent) => void dropNote(event, categoryId),
    };
  }

  async function onMove(id: string, direction: "up" | "down") {
    setError(null);
    const result = await moveCategory({ id, direction });
    if ("error" in result) {
      setError(result.error);
    }
  }

  async function onDelete() {
    if (!removing) {
      return;
    }
    setDeleting(true);
    const result = await deleteCategory({ id: removing.id });
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
      setRemoving(null);
      return;
    }
    setRemoving(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul>
        <ScopeRow
          href={`/notes?category=${SCOPE_ALL}`}
          label="All notes"
          count={counts.all}
          active={scope?.kind === "all"}
        />
        <ScopeRow
          href={`/notes?category=${SCOPE_NONE}`}
          label="No category"
          count={counts.none}
          active={scope?.kind === "none"}
          dragOver={dropOver === NO_CATEGORY_KEY}
          {...dropTarget(NO_CATEGORY_KEY, null)}
        />
      </ul>

      <div className="mt-4 mb-1 flex items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-medium text-muted-foreground">Categories</h2>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 px-2 text-xs"
          onClick={() => setDialog({ mode: "create", parentId: null })}
        >
          <FolderPlus className="size-4" aria-hidden="true" />
          New category
        </Button>
      </div>

      {error ? <p className="mb-2 px-1 text-sm text-destructive">{error}</p> : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">
            Group your notes by adding a category.
          </p>
        ) : (
          <ul>
            {rows.map((node) => (
              <CategoryRow
                key={node.id}
                node={node}
                categories={categories}
                count={counts.byCategory[node.id] ?? 0}
                active={scope?.kind === "category" && scope.id === node.id}
                collapsed={collapsed.has(node.id)}
                dragOver={dropOver === node.id}
                dropHandlers={dropTarget(node.id, node.id)}
                onToggle={() => toggle(node.id)}
                onAddChild={() => {
                  expand(node.id);
                  setDialog({ mode: "create", parentId: node.id });
                }}
                onEdit={() => setDialog({ mode: "edit", category: node })}
                onMove={(direction) => void onMove(node.id, direction)}
                onDelete={() => setRemoving(node)}
              />
            ))}
          </ul>
        )}
      </div>

      <CategoryDialog
        state={dialog}
        categories={categories}
        onClose={() => setDialog(null)}
        onSaved={(category) => {
          expand(category.parentId);
          setDialog(null);
        }}
      />

      <AlertDialog open={removing != null} onOpenChange={(open) => (open ? undefined : setRemoving(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              {removing ? `${removing.name} is removed. ` : ""}Its notes stay and move to No category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => void onDelete()}
            >
              {deleting ? "Deleting category" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function rowClass(active: boolean) {
  return cn(
    "flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-1 text-sm",
    active ? "bg-accent font-medium" : "hover:bg-foreground/[0.03]",
  );
}

function ScopeRow({
  href,
  label,
  count,
  active,
  dragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  dragOver?: boolean;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
}) {
  return (
    <li
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn("rounded-md", dragOver ? DROP_HIGHLIGHT : null)}
    >
      <Link href={href} aria-current={active ? "page" : undefined} className={rowClass(active)}>
        <span className="min-w-0 break-words">{label}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
      </Link>
    </li>
  );
}

function CategoryRow({
  node,
  categories,
  count,
  active,
  collapsed,
  dragOver,
  dropHandlers,
  onToggle,
  onAddChild,
  onEdit,
  onMove,
  onDelete,
}: {
  node: NoteCategoryNode;
  categories: NoteCategory[];
  count: number;
  dragOver: boolean;
  dropHandlers: {
    onDragOver: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
  };
  active: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onAddChild: () => void;
  onEdit: () => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const { index, count: siblings } = siblingPosition(categories, node.id);

  return (
    <li
      className={cn("flex items-center rounded-md", dragOver ? DROP_HIGHLIGHT : null)}
      style={{ paddingLeft: `${node.depth * 14}px` }}
      {...dropHandlers}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${node.name}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </button>
      ) : (
        <span className="size-11 shrink-0" aria-hidden="true" />
      )}
      <Link
        href={`/notes?category=${node.id}`}
        title={node.description ?? undefined}
        aria-current={active ? "page" : undefined}
        className={rowClass(active)}
      >
        <span className="min-w-0 break-words">{node.name}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
      </Link>
      <CategoryMenu
        name={node.name}
        canMoveUp={index > 0}
        canMoveDown={index < siblings - 1}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onMove={onMove}
        onDelete={onDelete}
      />
    </li>
  );
}

function CategoryMenu({
  name,
  canMoveUp,
  canMoveDown,
  onAddChild,
  onEdit,
  onMove,
  onDelete,
}: {
  name: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddChild: () => void;
  onEdit: () => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="size-11 shrink-0 px-0 text-muted-foreground"
            aria-label={`Options for ${name}`}
          />
        }
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 gap-0 p-1">
        <MenuItem icon={<Plus />} label="Add subcategory" onClick={() => run(onAddChild)} />
        <MenuItem icon={<Pencil />} label="Edit category" onClick={() => run(onEdit)} />
        <MenuItem
          icon={<ChevronUp />}
          label="Move up"
          disabled={!canMoveUp}
          onClick={() => run(() => onMove("up"))}
        />
        <MenuItem
          icon={<ChevronDown />}
          label="Move down"
          disabled={!canMoveDown}
          onClick={() => run(() => onMove("down"))}
        />
        <MenuItem icon={<Trash2 />} label="Delete category" onClick={() => run(onDelete)} />
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({
  icon,
  label,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {icon}
      {label}
    </button>
  );
}
