import { isTimeZone, localNow } from "@/features/morning-note/clock";
import { TaskWorkspace } from "@/features/tasks/task-workspace";
import { loadTaskWorkspace } from "@/features/tasks/load";
import { requireUser } from "@/lib/auth/require-user";

export default async function TasksPage() {
  const { supabase, user } = await requireUser();
  const [view, { data: profile }] = await Promise.all([
    loadTaskWorkspace(supabase, user.id),
    supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
  ]);

  // "Today" follows the member's own zone when they have set one; otherwise
  // the browser's clock decides once the page is open.
  const timeZone = profile?.timezone && isTimeZone(profile.timezone) ? profile.timezone : null;
  const serverToday = localNow(timeZone ?? "UTC", new Date()).isoDay;

  return (
    <TaskWorkspace
      initialTasks={view.tasks}
      plans={view.plans}
      tree={view.tree}
      boards={view.boards}
      serverToday={serverToday}
      timeZone={timeZone}
    />
  );
}
