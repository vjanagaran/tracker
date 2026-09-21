import { createAdminClient } from "@/lib/supabase/admin";
import { isSendHour, isTimeZone, localNow } from "./clock";
import { shouldSend } from "./compose";
import { loadMorningNote, loadRecipients, markSent } from "./load";
import { morningNoteConfigured, sendMorningNote } from "./send";

export type MorningNoteRun = {
  considered: number;
  sent: number;
  skipped: number;
  errors: string[];
};

export async function runMorningNote(at = new Date()): Promise<MorningNoteRun> {
  if (!morningNoteConfigured()) {
    throw new Error("Morning note is not configured. Set RESEND_API_KEY and MORNING_NOTE_FROM.");
  }

  const supabase = createAdminClient();
  const recipients = await loadRecipients(supabase);
  const result: MorningNoteRun = {
    considered: recipients.length,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  for (const recipient of recipients) {
    if (!isTimeZone(recipient.timezone) || !isSendHour(recipient.timezone, at)) {
      result.skipped += 1;
      continue;
    }

    const { isoDay } = localNow(recipient.timezone, at);
    if (recipient.sentOn === isoDay) {
      result.skipped += 1;
      continue;
    }

    try {
      const note = await loadMorningNote(supabase, recipient.userId, recipient.timezone, at);
      if (!shouldSend(note)) {
        result.skipped += 1;
        continue;
      }
      await sendMorningNote(recipient.email, note);
      await markSent(supabase, recipient.userId, isoDay);
      result.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "The morning note could not be sent.";
      result.errors.push(`${recipient.email}: ${message}`);
    }
  }

  return result;
}
