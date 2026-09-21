import type { SupabaseClient } from "@supabase/supabase-js";
import { formatTarget, repeatLabel, tagLabel } from "@/features/tasks/labels";
import { OPEN_STATUSES } from "@/features/tasks/types";
import type { Database } from "@/lib/database.types";
import { bucketTasks } from "@/features/dashboard/bucket";
import { formatDayHeading, formatDayShort, formatMeetingToday, localNow } from "./clock";
import { TODAY_LIMIT, towardSpokes } from "./compose";
import type { MorningMeeting, MorningNote, MorningRecipient, MorningTask } from "./types";

type Client = SupabaseClient<Database>;

export async function loadRecipients(supabase: Client): Promise<MorningRecipient[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, timezone, morning_note_sent_on")
    .eq("morning_note_on", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).flatMap((row) => {
    if (!row.email || !row.timezone) {
      return [];
    }
    return [
      {
        userId: row.id,
        email: row.email,
        timezone: row.timezone,
        sentOn: row.morning_note_sent_on,
      },
    ];
  });
}

export async function loadMorningNote(
  supabase: Client,
  userId: string,
  timeZone: string,
  at: Date,
): Promise<MorningNote> {
  const local = localNow(timeZone, at);
  const [tasks, meeting] = await Promise.all([
    loadMorningTasks(supabase, userId, local.isoDay),
    loadMeetingToday(supabase, userId, timeZone, local.isoDay),
  ]);

  return {
    heading: formatDayHeading(timeZone, at),
    dayShort: formatDayShort(timeZone, at),
    toward: towardSpokes(tasks.dueToday),
    dueToday: tasks.dueToday.slice(0, TODAY_LIMIT),
    dueTodayHidden: Math.max(0, tasks.dueToday.length - TODAY_LIMIT),
    overdue: tasks.overdue.slice(0, TODAY_LIMIT),
    overdueHidden: Math.max(0, tasks.overdue.length - TODAY_LIMIT),
    meeting,
  };
}

export async function markSent(supabase: Client, userId: string, isoDay: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ morning_note_sent_on: isoDay })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function loadMorningTasks(
  supabase: Client,
  userId: string,
  today: string,
): Promise<{ dueToday: MorningTask[]; overdue: MorningTask[] }> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, tag, target_on, repeat_every")
    .eq("user_id", userId)
    .in("status", OPEN_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const spokesByTask = await loadSpokesByTask(
    supabase,
    rows.map((row) => row.id),
  );
  const mapped = rows.map((row) => ({
    id: row.id,
    title: row.title,
    tagLabel: tagLabel(row.tag) === "—" ? null : tagLabel(row.tag),
    spokes: spokesByTask.get(row.id) ?? [],
    repeatLabel: repeatLabel(row.repeat_every) === "—" ? null : repeatLabel(row.repeat_every),
    targetLabel: row.target_on ? formatTarget(row.target_on) : null,
    targetOn: row.target_on,
  }));

  const buckets = bucketTasks(
    mapped.map((row) => ({
      id: row.id,
      title: row.title,
      tag: null,
      targetOn: row.targetOn,
      repeatEvery: null,
    })),
    today,
  );

  const byId = new Map(mapped.map((row) => [row.id, row]));
  const toMorning = (id: string): MorningTask | null => {
    const row = byId.get(id);
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      title: row.title,
      tagLabel: row.tagLabel,
      spokes: row.spokes,
      repeatLabel: row.repeatLabel,
      targetLabel: row.targetLabel,
    };
  };

  return {
    dueToday: buckets.dueToday.flatMap((item) => {
      const task = toMorning(item.id);
      return task ? [task] : [];
    }),
    overdue: buckets.overdue.flatMap((item) => {
      const task = toMorning(item.id);
      return task ? [task] : [];
    }),
  };
}

async function loadSpokesByTask(supabase: Client, taskIds: string[]) {
  const spokes = new Map<string, string[]>();
  if (taskIds.length === 0) {
    return spokes;
  }

  const { data: links, error: linkError } = await supabase
    .from("task_action_plans")
    .select("task_id, action_plan_id")
    .in("task_id", taskIds);

  if (linkError) {
    throw new Error(linkError.message);
  }
  if (!links || links.length === 0) {
    return spokes;
  }

  const planIds = [...new Set(links.map((link) => link.action_plan_id))];
  const { data: plans, error: planError } = await supabase
    .from("action_plans")
    .select("id, focus_area_id")
    .in("id", planIds);

  if (planError) {
    throw new Error(planError.message);
  }

  const focusIds = [...new Set((plans ?? []).map((plan) => plan.focus_area_id))];
  if (focusIds.length === 0) {
    return spokes;
  }

  const { data: focuses, error: focusError } = await supabase
    .from("focus_areas")
    .select("id, spoke_id")
    .in("id", focusIds);

  if (focusError) {
    throw new Error(focusError.message);
  }

  const spokeIds = [...new Set((focuses ?? []).map((focus) => focus.spoke_id))];
  if (spokeIds.length === 0) {
    return spokes;
  }

  const { data: spokeRows, error: spokeError } = await supabase
    .from("spokes")
    .select("id, name")
    .in("id", spokeIds);

  if (spokeError) {
    throw new Error(spokeError.message);
  }

  const focusById = new Map((focuses ?? []).map((focus) => [focus.id, focus.spoke_id]));
  const spokeById = new Map((spokeRows ?? []).map((spoke) => [spoke.id, spoke.name]));
  const planById = new Map((plans ?? []).map((plan) => [plan.id, plan.focus_area_id]));

  for (const link of links) {
    const focusId = planById.get(link.action_plan_id);
    const spokeId = focusId ? focusById.get(focusId) : undefined;
    const name = spokeId ? spokeById.get(spokeId) : undefined;
    if (!name) {
      continue;
    }
    const list = spokes.get(link.task_id) ?? [];
    if (!list.includes(name)) {
      list.push(name);
    }
    spokes.set(link.task_id, list);
  }

  return spokes;
}

async function loadMeetingToday(
  supabase: Client,
  userId: string,
  timeZone: string,
  isoDay: string,
): Promise<MorningMeeting | null> {
  const { data: memberships, error: memberError } = await supabase
    .from("board_members")
    .select("board_id, boards(name)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (memberError) {
    throw new Error(memberError.message);
  }

  const boards = (memberships ?? []).flatMap((row) => {
    const board = row.boards;
    if (!board) {
      return [];
    }
    return [{ id: row.board_id, name: board.name }];
  });

  if (boards.length === 0) {
    return null;
  }

  const { data: meetings, error: meetingError } = await supabase
    .from("meetings")
    .select("board_id, scheduled_at")
    .in(
      "board_id",
      boards.map((board) => board.id),
    )
    .neq("status", "Cancelled");

  if (meetingError) {
    throw new Error(meetingError.message);
  }

  const today = (meetings ?? []).filter(
    (meeting) => localNow(timeZone, new Date(meeting.scheduled_at)).isoDay === isoDay,
  );
  today.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const next = today[0];
  if (!next) {
    return null;
  }

  const board = boards.find((item) => item.id === next.board_id);
  return {
    boardName: board?.name ?? "Board",
    when: formatMeetingToday(next.scheduled_at, timeZone),
  };
}
