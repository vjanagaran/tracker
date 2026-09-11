import { z } from "zod";

export const addFocusAreaSchema = z.object({
  spokeId: z.string().uuid(),
  currentIssue: z.string().trim().min(1, "Name the issue as it stands today."),
  goal1y: z.string().trim().optional(),
  goal5y: z.string().trim().optional(),
});

export const updateFocusAreaSchema = z.object({
  focusAreaId: z.string().uuid(),
  currentIssue: z.string().trim().min(1, "Name the issue as it stands today."),
  goal1y: z.string().trim().optional(),
  goal5y: z.string().trim().optional(),
});

export const addActionPlanSchema = z.object({
  focusAreaId: z.string().uuid(),
  description: z.string().trim().min(1, "Describe the action plan."),
  challenge: z.string().trim().optional(),
});

export const updateActionPlanSchema = z.object({
  planId: z.string().uuid(),
  description: z.string().trim().min(1, "Describe the action plan."),
  challenge: z.string().trim().optional(),
  status: z.enum(["Active", "Completed", "Dropped"]),
});

export const idSchema = z.object({
  id: z.string().uuid(),
});
