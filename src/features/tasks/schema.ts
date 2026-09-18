import { z } from "zod";

const dateOnly = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date."), z.literal(""), z.null()])
  .optional();

const taskFields = {
  title: z.string().trim().min(1, "Name what you are doing."),
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
  targetOn: dateOnly,
  repeatEvery: z.enum(["daily", "weekly", "fortnightly", "monthly"]).nullable().optional(),
  repeatUntil: dateOnly,
  planIds: z.array(z.string().uuid()).optional(),
};

function withRepeatRule<T extends z.ZodType>(schema: T) {
  return schema.superRefine((value: z.infer<T>, ctx) => {
    const data = value as {
      repeatEvery?: string | null;
      targetOn?: string | null;
    };
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

export const addTaskNoteSchema = z.object({
  taskId: z.string().uuid(),
  note: z.string().trim().min(1, "Write a note."),
});

export type TaskFormInput = z.infer<typeof createTaskSchema>;
