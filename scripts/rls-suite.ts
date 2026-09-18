/**
 * Phase 8 — prove isolation through the Supabase client.
 *
 * Creates four short-lived users on the configured project, attacks
 * member B's private graph as A / superadmin / outsider, then deletes
 * the fixtures. Failures that mean "the attack worked" are printed as
 * OPEN and are not patched by this script.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Database = import("../src/lib/database.types.ts").Database;
type Client = SupabaseClient<Database>;

type Verdict = "pass" | "open" | "broken";

type CaseResult = {
  name: string;
  verdict: Verdict;
  detail: string;
};

const results: CaseResult[] = [];

function loadEnv() {
  const path = resolve(process.cwd(), ".env");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function record(name: string, verdict: Verdict, detail: string) {
  results.push({ name, verdict, detail });
  const tag = verdict === "pass" ? "PASS" : verdict === "open" ? "OPEN" : "BROKEN";
  console.log(`${tag}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function isRlsError(message: string | undefined) {
  if (!message) {
    return false;
  }
  return /row-level security|permission denied|42501/i.test(message);
}

function deniedWrite(
  name: string,
  result: { data: unknown; error: { message: string } | null },
) {
  const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
  if (rows.length > 0) {
    record(name, "open", `write returned ${rows.length} row(s)`);
    return;
  }
  if (result.error && !isRlsError(result.error.message)) {
    if (/duplicate|unique|23505|foreign key|23503/i.test(result.error.message)) {
      record(
        name,
        "open",
        `RLS did not stop the write; constraint did (${result.error.message})`,
      );
      return;
    }
    record(name, "broken", result.error.message);
    return;
  }
  record(name, "pass", result.error?.message ?? "no rows");
}

function deniedRead(name: string, rows: unknown[] | null, error: { message: string } | null) {
  if (error && !isRlsError(error.message)) {
    record(name, "broken", error.message);
    return;
  }
  const count = rows?.length ?? 0;
  if (count > 0) {
    record(name, "open", `read returned ${count} row(s)`);
    return;
  }
  record(name, "pass", "empty");
}

function ownerOk(name: string, ok: boolean, detail: string) {
  record(name, ok ? "pass" : "broken", detail);
}

async function signIn(url: string, anon: string, email: string, password: string) {
  const client = createClient<Database>(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`sign-in failed for ${email}: ${error.message}`);
  }
  return client;
}

async function createPerson(
  admin: Client,
  email: string,
  password: string,
  fullName: string,
) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created.error || !created.data.user) {
    throw new Error(`createUser ${email}: ${created.error?.message ?? "no user"}`);
  }
  const id = created.data.user.id;
  await admin.from("profiles").update({ full_name: fullName }).eq("id", id);
  return id;
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon || !secret) {
    throw new Error("Need NEXT_PUBLIC_SUPABASE_URL, publishable key, and SUPABASE_SECRET_KEY");
  }

  const admin = createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stamp = Date.now();
  const password = `Pb-rls-${stamp}-Aa1`;
  const emails = {
    a: `pb-rls-a-${stamp}@example.invalid`,
    b: `pb-rls-b-${stamp}@example.invalid`,
    c: `pb-rls-c-${stamp}@example.invalid`,
    s: `pb-rls-s-${stamp}@example.invalid`,
  };
  const ids = { a: "", b: "", c: "", s: "" };
  let boardId = "";

  try {
    ids.a = await createPerson(admin, emails.a, password, "RLS User A");
    ids.b = await createPerson(admin, emails.b, password, "RLS User B");
    ids.c = await createPerson(admin, emails.c, password, "RLS User C");
    ids.s = await createPerson(admin, emails.s, password, "RLS Superadmin");

    const { error: flagError } = await admin
      .from("profiles")
      .update({ is_superadmin: true })
      .eq("id", ids.s);
    if (flagError) {
      throw new Error(`flag superadmin: ${flagError.message}`);
    }

    const { data: board, error: boardError } = await admin
      .from("boards")
      .insert({
        name: `RLS board ${stamp}`,
        created_by: ids.s,
        cadence_days: 15,
      })
      .select("id")
      .single();
    if (boardError || !board) {
      throw new Error(`create board: ${boardError?.message ?? "no board"}`);
    }
    boardId = board.id;

    const { error: rosterError } = await admin.from("board_members").insert([
      { board_id: boardId, user_id: ids.a, role: "chairman", status: "active" },
      { board_id: boardId, user_id: ids.b, role: "director", status: "active" },
    ]);
    if (rosterError) {
      throw new Error(`roster: ${rosterError.message}`);
    }

    const asA = await signIn(url, anon, emails.a, password);
    const asB = await signIn(url, anon, emails.b, password);
    const asC = await signIn(url, anon, emails.c, password);
    const asS = await signIn(url, anon, emails.s, password);

    const { data: bWheels, error: bWheelsError } = await asB
      .from("wheels")
      .select("id, type");
    ownerOk(
      "B can read own wheels",
      Boolean(bWheels?.length === 2 && !bWheelsError),
      bWheelsError?.message ?? `${bWheels?.length ?? 0} wheels`,
    );
    const bWol = bWheels?.find((row) => row.type === "WOL");
    const bWob = bWheels?.find((row) => row.type === "WOB");
    if (!bWol || !bWob) {
      throw new Error("B is missing bootstrap wheels");
    }

    const { data: bHealth } = await asB
      .from("spokes")
      .select("id, name")
      .eq("wheel_id", bWol.id)
      .eq("name", "Health")
      .single();
    if (!bHealth) {
      throw new Error("B is missing the Health spoke");
    }

    const { data: bSpoke, error: bSpokeError } = await asB
      .from("spokes")
      .insert({ wheel_id: bWob.id, name: "Sales", sort_order: 1 })
      .select("id")
      .single();
    ownerOk(
      "B can add a WOB spoke",
      Boolean(bSpoke && !bSpokeError),
      bSpokeError?.message ?? "inserted",
    );
    if (!bSpoke) {
      throw new Error("B could not add a spoke");
    }

    const { data: cycleId, error: cycleError } = await asB.rpc("create_wheel_cycle", {
      p_wheel_id: bWol.id,
      p_period: "2026-09-01",
    });
    ownerOk(
      "B can start a cycle",
      Boolean(cycleId && !cycleError),
      cycleError?.message ?? String(cycleId),
    );
    if (!cycleId) {
      throw new Error("B could not start a cycle");
    }

    const { error: scoreError } = await asB
      .from("spoke_scores")
      .update({ score_now: 4, target_1y: 6, target_5y: 8 })
      .eq("cycle_id", cycleId)
      .eq("spoke_id", bHealth.id);
    ownerOk("B can write own scores", !scoreError, scoreError?.message ?? "updated");

    const { data: focus, error: focusError } = await asB
      .from("focus_areas")
      .insert({
        spoke_id: bHealth.id,
        current_issue: "Sleep is short",
        goal_1y: "Seven hours",
        goal_5y: "Steady sleep",
      })
      .select("id")
      .single();
    ownerOk(
      "B can write own focus areas",
      Boolean(focus && !focusError),
      focusError?.message ?? "inserted",
    );
    if (!focus) {
      throw new Error("B could not add a focus area");
    }

    const { data: plan, error: planError } = await asB
      .from("action_plans")
      .insert({
        focus_area_id: focus.id,
        description: "Lights out at ten",
        challenge: "Late calls",
      })
      .select("id")
      .single();
    ownerOk(
      "B can write own action plans",
      Boolean(plan && !planError),
      planError?.message ?? "inserted",
    );
    if (!plan) {
      throw new Error("B could not add an action plan");
    }

    const { data: task, error: taskError } = await asB
      .from("tasks")
      .insert({
        user_id: ids.b,
        title: "Walk after dinner",
        tag: "WOL",
        status: "Not Started",
        target_on: "2026-09-18",
      })
      .select("id")
      .single();
    ownerOk(
      "B can write own tasks",
      Boolean(task && !taskError),
      taskError?.message ?? "inserted",
    );
    if (!task) {
      throw new Error("B could not add a task");
    }

    const { error: linkError } = await asB.from("task_action_plans").insert({
      task_id: task.id,
      action_plan_id: plan.id,
    });
    ownerOk("B can link own task to own plan", !linkError, linkError?.message ?? "inserted");

    const { data: note, error: noteError } = await asB
      .from("task_notes")
      .insert({ task_id: task.id, note: "Started this week" })
      .select("id")
      .single();
    ownerOk(
      "B can write own task notes",
      Boolean(note && !noteError),
      noteError?.message ?? "inserted",
    );
    if (!note) {
      throw new Error("B could not add a note");
    }

    const { data: document, error: documentError } = await asB
      .from("notes")
      .insert({
        user_id: ids.b,
        title: "Passport scan",
        body_text: "Renewal date",
      })
      .select("id")
      .single();
    ownerOk(
      "B can write own notes",
      Boolean(document && !documentError),
      documentError?.message ?? "inserted",
    );
    if (!document) {
      throw new Error("B could not add a personal note");
    }

    const { data: noteFile, error: noteFileError } = await asB
      .from("note_files")
      .insert({
        id: crypto.randomUUID(),
        note_id: document.id,
        kind: "attachment",
        original_name: "passport.pdf",
        mime_type: "application/pdf",
        size_bytes: 1200,
        storage_path: `${ids.b}/${document.id}/file`,
      })
      .select("id")
      .single();
    ownerOk(
      "B can write own note files",
      Boolean(noteFile && !noteFileError),
      noteFileError?.message ?? "inserted",
    );
    if (!noteFile) {
      throw new Error("B could not add a note file");
    }

    const { data: aWheels } = await asA.from("wheels").select("id, type");
    const aWol = aWheels?.find((row) => row.type === "WOL");
    const aWob = aWheels?.find((row) => row.type === "WOB");
    if (!aWol || !aWob) {
      throw new Error("A is missing bootstrap wheels");
    }

    const { data: aCycleId } = await asA.rpc("create_wheel_cycle", {
      p_wheel_id: aWol.id,
      p_period: "2026-09-01",
    });
    const { data: aTask } = await asA
      .from("tasks")
      .insert({
        user_id: ids.a,
        title: "A's own task",
        status: "Not Started",
      })
      .select("id")
      .single();
    if (!aCycleId || !aTask) {
      throw new Error("A could not create a cycle or task");
    }

    const privateTables = [
      {
        table: "wheels" as const,
        filter: { column: "id", value: bWol.id },
        update: { type: "WOB" as const },
      },
      {
        table: "spokes" as const,
        filter: { column: "id", value: bHealth.id },
        update: { name: "Hijacked" },
      },
      {
        table: "wheel_cycles" as const,
        filter: { column: "id", value: cycleId },
        update: { period: "2026-08-01" },
      },
      {
        table: "spoke_scores" as const,
        filter: { column: "spoke_id", value: bHealth.id },
        update: { score_now: 0 },
      },
      {
        table: "focus_areas" as const,
        filter: { column: "id", value: focus.id },
        update: { current_issue: "Hijacked" },
      },
      {
        table: "action_plans" as const,
        filter: { column: "id", value: plan.id },
        update: { description: "Hijacked" },
      },
      {
        table: "tasks" as const,
        filter: { column: "id", value: task.id },
        update: { title: "Hijacked" },
      },
      {
        table: "task_action_plans" as const,
        filter: { column: "task_id", value: task.id },
        update: null,
      },
      {
        table: "task_notes" as const,
        filter: { column: "id", value: note.id },
        update: { note: "Hijacked" },
      },
      {
        table: "notes" as const,
        filter: { column: "id", value: document.id },
        update: { title: "Hijacked" },
      },
      {
        table: "note_files" as const,
        filter: { column: "id", value: noteFile.id },
        update: { original_name: "stolen.pdf" },
      },
    ];

    for (const attacker of [
      { label: "A", client: asA },
      { label: "superadmin", client: asS },
    ]) {
      for (const target of privateTables) {
        const selected = await attacker.client
          .from(target.table)
          .select("*")
          .eq(target.filter.column, target.filter.value);
        deniedRead(
          `${attacker.label} cannot read B ${target.table}`,
          selected.data,
          selected.error,
        );

        if (target.update) {
          const updated = await attacker.client
            .from(target.table)
            .update(target.update as never)
            .eq(target.filter.column, target.filter.value)
            .select();
          deniedWrite(`${attacker.label} cannot update B ${target.table}`, updated);
        }

        const removed = await attacker.client
          .from(target.table)
          .delete()
          .eq(target.filter.column, target.filter.value)
          .select();
        deniedWrite(`${attacker.label} cannot delete B ${target.table}`, removed);
      }
    }

    deniedWrite(
      "A cannot insert a wheel for B",
      await asA.from("wheels").insert({ user_id: ids.b, type: "WOL" }).select(),
    );
    deniedWrite(
      "A cannot insert a spoke on B's wheel",
      await asA.from("spokes").insert({ wheel_id: bWob.id, name: "Stolen" }).select(),
    );
    deniedWrite(
      "A cannot insert a cycle on B's wheel",
      await asA.from("wheel_cycles").insert({ wheel_id: bWol.id, period: "2026-10-01" }).select(),
    );
    deniedWrite(
      "A cannot insert a score on B's cycle",
      await asA
        .from("spoke_scores")
        .insert({ cycle_id: cycleId, spoke_id: bHealth.id, score_now: 1 })
        .select(),
    );
    deniedWrite(
      "A cannot insert a focus area on B's spoke",
      await asA.from("focus_areas").insert({ spoke_id: bHealth.id, current_issue: "Stolen" }).select(),
    );
    deniedWrite(
      "A cannot insert an action plan on B's focus area",
      await asA
        .from("action_plans")
        .insert({ focus_area_id: focus.id, description: "Stolen" })
        .select(),
    );
    deniedWrite(
      "A cannot insert a task for B",
      await asA.from("tasks").insert({ user_id: ids.b, title: "Stolen" }).select(),
    );
    deniedWrite(
      "A cannot insert a note on B's task",
      await asA.from("task_notes").insert({ task_id: task.id, note: "Stolen" }).select(),
    );
    deniedWrite(
      "A cannot insert a personal note for B",
      await asA.from("notes").insert({ user_id: ids.b, title: "Stolen" }).select(),
    );
    deniedWrite(
      "A cannot attach a file to B's note",
      await asA
        .from("note_files")
        .insert({
          id: crypto.randomUUID(),
          note_id: document.id,
          kind: "attachment",
          original_name: "stolen.pdf",
          mime_type: "application/pdf",
          size_bytes: 10,
          storage_path: `${ids.a}/${document.id}/stolen`,
        })
        .select(),
    );
    deniedWrite(
      "A cannot link B's task to a plan",
      await asA
        .from("task_action_plans")
        .insert({ task_id: task.id, action_plan_id: plan.id })
        .select(),
    );

    deniedWrite(
      "A cannot attach B's spoke to A's cycle",
      await asA
        .from("spoke_scores")
        .insert({ cycle_id: aCycleId, spoke_id: bHealth.id, score_now: 2 })
        .select(),
    );
    deniedWrite(
      "A cannot attach B's plan to A's task",
      await asA
        .from("task_action_plans")
        .insert({ task_id: aTask.id, action_plan_id: plan.id })
        .select(),
    );

    const velocityAsA = await asA.rpc("board_velocity", {
      p_board_id: boardId,
      p_from: "2026-09-01T00:00:00Z",
      p_to: "2026-09-30T00:00:00Z",
    });
    if (velocityAsA.error) {
      record("member can read board_velocity counts", "broken", velocityAsA.error.message);
    } else {
      const keys = new Set(
        (velocityAsA.data ?? []).flatMap((row) => Object.keys(row)),
      );
      const allowed = new Set(["user_id", "full_name", "completed_count", "open_count"]);
      const extra = [...keys].filter((key) => !allowed.has(key));
      if (extra.length > 0) {
        record("board_velocity returns counts and names only", "open", extra.join(", "));
      } else {
        record("board_velocity returns counts and names only", "pass", `${keys.size} keys`);
      }
    }

    const velocityAsS = await asS.rpc("board_velocity", {
      p_board_id: boardId,
      p_from: "2026-09-01T00:00:00Z",
      p_to: "2026-09-30T00:00:00Z",
    });
    if (velocityAsS.error && /not a member/i.test(velocityAsS.error.message)) {
      record("superadmin cannot read board_velocity", "pass", velocityAsS.error.message);
    } else if (velocityAsS.data && velocityAsS.data.length > 0) {
      record(
        "superadmin cannot read board_velocity",
        "open",
        `returned ${velocityAsS.data.length} row(s)`,
      );
    } else {
      record(
        "superadmin cannot read board_velocity",
        velocityAsS.error ? "pass" : "open",
        velocityAsS.error?.message ?? "empty without error",
      );
    }

    const velocityAsC = await asC.rpc("board_velocity", {
      p_board_id: boardId,
      p_from: "2026-09-01T00:00:00Z",
      p_to: "2026-09-30T00:00:00Z",
    });
    if (velocityAsC.error && /not a member/i.test(velocityAsC.error.message)) {
      record("non-member cannot read board_velocity", "pass", velocityAsC.error.message);
    } else if (velocityAsC.data && velocityAsC.data.length > 0) {
      record(
        "non-member cannot read board_velocity",
        "open",
        `returned ${velocityAsC.data.length} row(s)`,
      );
    } else {
      record(
        "non-member cannot read board_velocity",
        "open",
        velocityAsC.error?.message ?? "empty without error",
      );
    }

    const deleteHistoric = await asB.from("spokes").delete().eq("id", bHealth.id).select();
    if (deleteHistoric.error && /disable it instead/i.test(deleteHistoric.error.message)) {
      record("spoke delete guard fires when a spoke has history", "pass", deleteHistoric.error.message);
    } else if ((deleteHistoric.data?.length ?? 0) > 0) {
      record("spoke delete guard fires when a spoke has history", "open", "spoke was deleted");
    } else {
      record(
        "spoke delete guard fires when a spoke has history",
        "broken",
        deleteHistoric.error?.message ?? "no error and no delete",
      );
    }

    const secondCycle = await asB.rpc("create_wheel_cycle", {
      p_wheel_id: bWol.id,
      p_period: "2026-09-15",
    });
    if (secondCycle.error && /duplicate|unique|23505/i.test(secondCycle.error.message)) {
      record("second cycle in the same month is rejected", "pass", secondCycle.error.message);
    } else if (secondCycle.data) {
      record(
        "second cycle in the same month is rejected",
        "open",
        `created ${secondCycle.data}`,
      );
    } else {
      record(
        "second cycle in the same month is rejected",
        "broken",
        secondCycle.error?.message ?? "no cycle and no error",
      );
    }
  } finally {
    if (boardId) {
      await admin.from("board_members").delete().eq("board_id", boardId);
      await admin.from("boards").delete().eq("id", boardId);
    }
    for (const id of Object.values(ids)) {
      if (id) {
        await admin.auth.admin.deleteUser(id);
      }
    }
  }

  const open = results.filter((row) => row.verdict === "open");
  const broken = results.filter((row) => row.verdict === "broken");
  const passed = results.filter((row) => row.verdict === "pass");

  console.log("");
  console.log(`passed ${passed.length} · open ${open.length} · broken ${broken.length}`);
  if (open.length > 0) {
    console.log("OPEN — these succeeded when they should have been denied:");
    for (const row of open) {
      console.log(`  - ${row.name}: ${row.detail}`);
    }
  }
  if (broken.length > 0) {
    console.log("BROKEN — owner/setup path failed:");
    for (const row of broken) {
      console.log(`  - ${row.name}: ${row.detail}`);
    }
  }

  if (open.length > 0 || broken.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
