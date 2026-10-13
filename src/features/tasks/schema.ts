import { z } from "zod";

const dateOnly = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date."), z.literal(""), z.null()])
  .optional();

const timeOnly = z
  .union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time."), z.literal(""), z.null()])
  .optional();

const taskFields = {
  title: z.string().trim().min(1, "Name what you are doing."),
  description: z.string().trim().max(4000, "Keep the description under 4,000 characters.").nullable().optional(),
  priority: z.enum(["high", "medium", "low", "flexi"]).optional(),
  tag: z.enum(["WOL", "WOB", "OPEN"]).nullable().optional(),
  status: z.enum([
    "Not Started",
    "Work in Progress",
    "Postponed",
    "Hold Now",
    "Completed",
    "Cancelled",
  ]),
  plannedStartOn: dateOnly,
  plannedStartTime: timeOnly,
  targetOn: dateOnly,
  targetTime: timeOnly,
  repeatEvery: z.enum(["daily", "weekly", "fortnightly", "monthly"]).nullable().optional(),
  repeatUntil: dateOnly,
  planIds: z.array(z.string().uuid()).optional(),
};

function withRepeatRule<T extends z.ZodType>(schema: T) {
  return schema.superRefine((value: z.infer<T>, ctx) => {
    const data = value as {
      repeatEvery?: string | null;
      targetOn?: string | null;
      targetTime?: string | null;
      plannedStartOn?: string | null;
      plannedStartTime?: string | null;
    };
    if (data.targetTime && !data.targetOn) {
      ctx.addIssue({
        code: "custom",
        path: ["targetTime"],
        message: "Choose a finish-by day to go with that time.",
      });
    }
    if (data.plannedStartTime && !data.plannedStartOn) {
      ctx.addIssue({
        code: "custom",
        path: ["plannedStartTime"],
        message: "Choose a start day to go with that time.",
      });
    }
    if (data.repeatEvery && !data.targetOn) {
      ctx.addIssue({
        code: "custom",
        path: ["targetOn"],
        message: "A repeating task needs a finish-by date.",
      });
    }
  });
}

export const createTaskSchema = withRepeatRule(z.object(taskFields));

export const updateTaskSchema = withRepeatRule(
  z.object({
    id: z.string().uuid(),
    ...taskFields,
  }),
);

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: taskFields.status,
});

export const updateTaskTargetSchema = z.object({
  id: z.string().uuid(),
  targetOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a day."),
});

export const deleteTaskSchema = z.object({ id: z.string().uuid() });

export const addTaskNoteSchema = z.object({
  taskId: z.string().uuid(),
  note: z.string().trim().min(1, "Write a note."),
});

export type TaskFormInput = z.infer<typeof createTaskSchema>;
