"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateTaskStatus, updateTaskTarget } from "./actions";
import { taskQueryKey } from "./query-keys";
import type { TaskItem, TaskNote, TaskStatus } from "./types";

export function useTasks(initialTasks: TaskItem[]) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: taskQueryKey,
    queryFn: () => initialTasks,
    initialData: initialTasks,
    staleTime: Infinity,
  });

  const tasks = query.data ?? initialTasks;

  const statusMutation = useMutation({
    mutationFn: async (input: { id: string; status: TaskStatus }) => {
      const result = await updateTaskStatus(input);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey });
      const previous = queryClient.getQueryData<TaskItem[]>(taskQueryKey);
      queryClient.setQueryData<TaskItem[]>(taskQueryKey, (current) =>
        (current ?? []).map((task) => {
          if (task.id !== id) {
            return task;
          }
          return {
            ...task,
            status,
            completedOn:
              status === "Completed"
                ? (task.completedOn ?? new Date().toISOString())
                : null,
          };
        }),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskQueryKey, context.previous);
      }
    },
    onSuccess: (result) => {
      upsertTask(result.task);
      if (result.spawned) {
        upsertTask(result.spawned);
      }
    },
  });

  const targetMutation = useMutation({
    mutationFn: async (input: { id: string; targetOn: string }) => {
      const result = await updateTaskTarget(input);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async ({ id, targetOn }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey });
      const previous = queryClient.getQueryData<TaskItem[]>(taskQueryKey);
      queryClient.setQueryData<TaskItem[]>(taskQueryKey, (current) =>
        (current ?? []).map((task) => (task.id === id ? { ...task, targetOn } : task)),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskQueryKey, context.previous);
      }
    },
    onSuccess: (result) => {
      upsertTask(result.task);
    },
  });

  function upsertTask(task: TaskItem) {
    queryClient.setQueryData<TaskItem[]>(taskQueryKey, (current) => {
      const list = current ?? [];
      const index = list.findIndex((row) => row.id === task.id);
      if (index === -1) {
        return [...list, task];
      }
      const next = [...list];
      next[index] = task;
      return next;
    });
  }

  function removeTask(taskId: string) {
    queryClient.setQueryData<TaskItem[]>(taskQueryKey, (current) =>
      (current ?? []).filter((task) => task.id !== taskId),
    );
  }

  function appendNote(taskId: string, note: TaskNote) {
    queryClient.setQueryData<TaskItem[]>(taskQueryKey, (current) =>
      (current ?? []).map((task) =>
        task.id === taskId ? { ...task, notes: [...task.notes, note] } : task,
      ),
    );
  }

  return {
    tasks,
    updateStatus: (id: string, status: TaskStatus) => {
      statusMutation.mutate({ id, status });
    },
    updateTarget: (id: string, targetOn: string) => {
      targetMutation.mutate({ id, targetOn });
    },
    upsertTask,
    removeTask,
    appendNote,
    statusError:
      statusMutation.error instanceof Error
        ? statusMutation.error.message
        : targetMutation.error instanceof Error
          ? targetMutation.error.message
          : null,
  };
}
