import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Name the board."),
  description: z.string().trim().optional(),
  cadenceDays: z.coerce
    .number()
    .int()
    .min(1, "Cadence must be at least one day.")
    .max(60, "Cadence must be 60 days or fewer."),
  meetingWeekday: z.union([
    z.literal(""),
    z.coerce.number().int().min(0).max(6),
  ]),
});

export const updateMemberSchema = z.object({
  membershipId: z.string().uuid(),
  boardId: z.string().uuid(),
  role: z.enum(["chairman", "director"]),
  status: z.enum(["active", "inactive"]),
});

export const addExistingMemberSchema = z.object({
  boardId: z.string().uuid(),
  profileId: z.string().uuid(),
  role: z.enum(["chairman", "director"]),
});

export const inviteMemberSchema = z.object({
  boardId: z.string().uuid(),
  email: z.string().trim().email("Enter an email address."),
  role: z.enum(["chairman", "director"]),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type AddExistingMemberInput = z.infer<typeof addExistingMemberSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
