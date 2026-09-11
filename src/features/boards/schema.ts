import { z } from "zod";

const scheduledAt = z
  .string()
  .trim()
  .min(1, "Pick a date and time.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Pick a valid date and time.");

export const addMeetingSchema = z.object({
  boardId: z.string().uuid(),
  scheduledAt,
  agenda: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const moveMeetingSchema = z.object({
  boardId: z.string().uuid(),
  meetingId: z.string().uuid(),
  scheduledAt,
});

export const updateAgendaSchema = z.object({
  boardId: z.string().uuid(),
  meetingId: z.string().uuid(),
  agenda: z.string().trim().optional(),
});

export type AddMeetingInput = z.infer<typeof addMeetingSchema>;
export type MoveMeetingInput = z.infer<typeof moveMeetingSchema>;
export type UpdateAgendaInput = z.infer<typeof updateAgendaSchema>;
