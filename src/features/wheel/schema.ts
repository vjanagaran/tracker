import { z } from "zod";

const scoreValue = z.number().int().min(0).max(10).nullable();

export const saveScoresSchema = z.object({
  cycleId: z.string().uuid(),
  scores: z.array(
    z.object({
      spokeId: z.string().uuid(),
      scoreNow: scoreValue,
      target1y: scoreValue,
      target5y: scoreValue,
    }),
  ),
});

export const createCycleSchema = z.object({
  wheelId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}-01$/, "Period must be the first of a month."),
  slug: z.enum(["life", "business"]),
});

export const addSpokeSchema = z.object({
  wheelId: z.string().uuid(),
  name: z.string().trim().min(1, "Name the function this spoke is for."),
});

export const renameSpokeSchema = z.object({
  spokeId: z.string().uuid(),
  name: z.string().trim().min(1, "Enter a spoke name."),
});

export const reorderSpokesSchema = z.object({
  wheelId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});

export const spokeIdSchema = z.object({
  spokeId: z.string().uuid(),
});
