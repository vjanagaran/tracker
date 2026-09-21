import { Resend } from "resend";
import { renderHtml, renderText } from "./render";
import { subjectLine } from "./compose";
import type { MorningNote } from "./types";

export function morningNoteConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MORNING_NOTE_FROM);
}

export async function sendMorningNote(to: string, note: MorningNote) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MORNING_NOTE_FROM;
  if (!key || !from) {
    throw new Error("Morning note is not configured. Set RESEND_API_KEY and MORNING_NOTE_FROM.");
  }

  const subject = subjectLine(
    note.dayShort,
    note.toward,
    note.dueToday.length > 0,
    note.meeting != null,
    note.overdue.length > 0,
  );

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text: renderText(note),
    html: renderHtml(note),
  });

  if (error) {
    throw new Error(error.message);
  }
}
