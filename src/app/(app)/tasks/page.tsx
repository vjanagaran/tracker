import { TaskWorkspace } from "@/features/tasks/task-workspace";
import { loadTaskWorkspace } from "@/features/tasks/load";
import { requireUser } from "@/lib/auth/require-user";

export default async function TasksPage() {
  const { supabase, user } = await requireUser();
  const view = await loadTaskWorkspace(supabase, user.id);

  return <TaskWorkspace initialTasks={view.tasks} plans={view.plans} />;
}
