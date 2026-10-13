"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  countByNode,
  countByView,
  nodeKey,
  nodesWithTasks,
  sameNode,
  TASK_WHEN,
  UNLINKED_LABEL,
  whenLabel,
  wheelName,
  type ScopeIndex,
  type TaskNode,
  type TaskScope,
  type TaskWhen,
} from "./scope";
import type { TaskItem, TaskTreeWheel } from "./types";

export function TaskScopePanel({
  tasks,
  tree,
  index,
  today,
  scope,
  onScope,
  onAdd,
  onBack,
}: {
  tasks: TaskItem[];
  tree: TaskTreeWheel[];
  index: ScopeIndex;
  today: string;
  scope: TaskScope;
  onScope: (next: TaskScope) => void;
  onAdd: () => void;
  onBack: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const open = new Set(tree.map((wheel) => nodeKey({ kind: "wheel", wheel: wheel.type })));
    // Arriving from a link to a focus area: open the spoke that holds it.
    if (scope.node?.kind === "focus") {
      const focusId = scope.node.id;
      for (const wheel of tree) {
        for (const spoke of wheel.spokes) {
          if (spoke.focusAreas.some((focus) => focus.id === focusId)) {
            open.add(nodeKey({ kind: "spoke", id: spoke.id }));
          }
        }
      }
    }
    return open;
  });

  const nodeCounts = countByNode(tasks, scope, today, index);
  const viewCounts = countByView(tasks, scope.node, today, index);
  const used = nodesWithTasks(tasks, index);

  function toggle(key: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function chooseWhen(when: TaskWhen) {
    onScope({ ...scope, view: "open", when });
  }

  function chooseNode(node: TaskNode) {
    onScope({ ...scope, node: sameNode(scope.node, node) ? null : node });
  }

  function treeRow(args: {
    node: TaskNode;
    label: string;
    depth: number;
    expandable?: boolean;
    muted?: boolean;
  }) {
    const key = nodeKey(args.node);
    return (
      <Row
        key={key}
        label={args.label}
        count={nodeCounts.get(key) ?? 0}
        depth={args.depth}
        active={sameNode(scope.node, args.node)}
        muted={args.muted}
        expandable={args.expandable}
        expanded={expanded.has(key)}
        onToggle={() => toggle(key)}
        onSelect={() => chooseNode(args.node)}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Button
        type="button"
        variant="ghost"
        className="-ml-2 mt-1 min-h-11 w-fit px-2 text-muted-foreground md:hidden"
        onClick={onBack}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to tasks
      </Button>
      <div className="flex items-center justify-between gap-3 py-3 md:pt-0">
        <h1 className="text-lg font-semibold tracking-tight">Tasks</h1>
        <Button type="button" variant="ghost" className="min-h-11 px-3" onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add a task
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <ul>
          {TASK_WHEN.map((when) => (
            <Row
              key={when}
              label={whenLabel(when)}
              count={viewCounts.when[when]}
              active={scope.view === "open" && scope.when === when}
              onSelect={() => chooseWhen(when)}
            />
          ))}
        </ul>

        {tree.length > 0 ? (
          <h2 className="mt-5 mb-1 px-1 text-xs font-medium text-muted-foreground">
            Wheels, spokes and focus areas
          </h2>
        ) : null}
        <ul>
          {tree.map((wheel) => {
            const wheelNode: TaskNode = { kind: "wheel", wheel: wheel.type };
            const wheelOpen = expanded.has(nodeKey(wheelNode));
            const unlinked: TaskNode = { kind: "unlinked", wheel: wheel.type };
            const spokes = wheel.spokes.filter(
              (spoke) => spoke.isActive || used.has(`spoke:${spoke.id}`),
            );
            return (
              <li key={wheel.type}>
                <ul>
                  {treeRow({
                    node: wheelNode,
                    label: wheelName(wheel.type),
                    depth: 0,
                    expandable: true,
                  })}
                  {wheelOpen
                    ? spokes.map((spoke) => {
                        const spokeNode: TaskNode = { kind: "spoke", id: spoke.id };
                        return (
                          <li key={spoke.id}>
                            <ul>
                              {treeRow({
                                node: spokeNode,
                                label: spoke.isActive ? spoke.name : `${spoke.name} (inactive)`,
                                depth: 1,
                                expandable: spoke.focusAreas.length > 0,
                                muted: !spoke.isActive,
                              })}
                              {expanded.has(nodeKey(spokeNode))
                                ? spoke.focusAreas.map((focus) =>
                                    treeRow({
                                      node: { kind: "focus", id: focus.id },
                                      label: focus.issue,
                                      depth: 2,
                                    }),
                                  )
                                : null}
                            </ul>
                          </li>
                        );
                      })
                    : null}
                  {wheelOpen && used.has(nodeKey(unlinked))
                    ? treeRow({ node: unlinked, label: UNLINKED_LABEL, depth: 1 })
                    : null}
                </ul>
              </li>
            );
          })}
        </ul>

        <ul className="mt-5">
          <Row
            label="Completed"
            count={viewCounts.completed}
            active={scope.view === "completed"}
            onSelect={() => onScope({ ...scope, view: "completed", when: "all" })}
          />
          <Row
            label="Cancelled"
            count={viewCounts.cancelled}
            active={scope.view === "cancelled"}
            onSelect={() => onScope({ ...scope, view: "cancelled", when: "all" })}
          />
        </ul>
      </div>
    </div>
  );
}

function Row({
  label,
  count,
  active,
  depth = 0,
  muted = false,
  expandable,
  expanded = false,
  onToggle,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  depth?: number;
  muted?: boolean;
  /** Undefined means a plain row with no chevron slot. */
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onSelect: () => void;
}) {
  const hasSlot = expandable !== undefined;
  return (
    <li className="flex items-center" style={{ paddingLeft: `${depth * 14}px` }}>
      {hasSlot ? (
        expandable ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {expanded ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="size-11 shrink-0" aria-hidden="true" />
        )
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-1 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
          active ? "bg-accent font-medium" : "hover:bg-foreground/[0.03]",
          muted && !active ? "text-muted-foreground" : null,
        )}
      >
        <span className="min-w-0 break-words">{label}</span>
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            count === 0 ? "text-muted-foreground/60" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      </button>
    </li>
  );
}
