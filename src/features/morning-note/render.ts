import { dashboardUrl, profileUrl } from "@/lib/app-url";
import { APP_NAME } from "@/lib/brand";
import { overdueLine, taskLine } from "./compose";
import type { MorningNote } from "./types";

function escape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderText(note: MorningNote) {
  const lines: string[] = [note.heading];
  if (note.toward.length > 0) {
    lines.push(`Toward ${note.toward.join(" and ")}.`);
  }
  lines.push("");

  if (note.dueToday.length > 0) {
    lines.push("Today");
    for (const task of note.dueToday) {
      const line = taskLine(task);
      lines.push(line.meta ? `· ${line.title} — ${line.meta}` : `· ${line.title}`);
    }
    if (note.dueTodayHidden > 0) {
      lines.push(`and ${note.dueTodayHidden} more`);
    }
    lines.push("");
  }

  if (note.overdue.length > 0) {
    lines.push("Later");
    for (const task of note.overdue) {
      const line = overdueLine(task);
      lines.push(line.meta ? `· ${line.title} — ${line.meta}` : `· ${line.title}`);
    }
    if (note.overdueHidden > 0) {
      lines.push(`and ${note.overdueHidden} more`);
    }
    lines.push("");
  }

  if (note.meeting) {
    lines.push(`${note.meeting.boardName} · today, ${note.meeting.when}`);
    lines.push("");
  }

  lines.push(`Open the dashboard: ${dashboardUrl()}`);
  lines.push(`Morning note · turn this off in Profile: ${profileUrl()}#morning-note`);
  return lines.join("\n");
}

export function renderHtml(note: MorningNote) {
  const href = dashboardUrl();
  const toward =
    note.toward.length > 0
      ? `<p style="margin:4px 0 20px;color:#6e6b68;font-size:15px">Toward ${escape(joinAnd(note.toward))}.</p>`
      : "";

  const todayBlock =
    note.dueToday.length > 0
      ? section(
          "Today",
          note.dueToday.map((task) => {
            const line = taskLine(task);
            return row(line.title, line.meta);
          }),
          note.dueTodayHidden,
        )
      : "";

  const laterBlock =
    note.overdue.length > 0
      ? section(
          "Later",
          note.overdue.map((task) => {
            const line = overdueLine(task);
            return row(line.title, line.meta);
          }),
          note.overdueHidden,
        )
      : "";

  const meeting = note.meeting
    ? `<p style="margin:20px 0 0;color:#25221e;font-size:15px">${escape(note.meeting.boardName)} · today, ${escape(note.meeting.when)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;background:#fefdfc;color:#25221e;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fefdfc">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px">
          <tr>
            <td>
              <p style="margin:0 0 4px;color:#6e6b68;font-size:13px">${escape(APP_NAME)}</p>
              <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em">${escape(note.heading)}</h1>
              ${toward}
              ${todayBlock}
              ${laterBlock}
              ${meeting}
              <p style="margin:28px 0 0">
                <a href="${href}" style="display:inline-block;background:#1f4e79;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px">Open the dashboard</a>
              </p>
              <p style="margin:28px 0 0;color:#6e6b68;font-size:12px">
                Morning note · <a href="${profileUrl()}#morning-note" style="color:#1f4e79">turn this off in Profile</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function joinAnd(names: string[]) {
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function section(title: string, rows: string[], hidden: number) {
  const extra =
    hidden > 0
      ? `<p style="margin:8px 0 0;color:#6e6b68;font-size:13px">and ${hidden} more</p>`
      : "";
  return `<h2 style="margin:24px 0 8px;font-size:14px;font-weight:600">${title}</h2>${rows.join("")}${extra}`;
}

function row(title: string, meta: string) {
  return `<p style="margin:0 0 10px;font-size:15px;line-height:1.4">${escape(title)}${
    meta
      ? `<br><span style="color:#6e6b68;font-size:13px">${escape(meta)}</span>`
      : ""
  }</p>`;
}
