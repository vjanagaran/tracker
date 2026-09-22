import { z } from "zod";

export const inviteFriendSchema = z.object({
  email: z.string().trim().email("Enter an email address."),
});

export type InviteFriendInput = z.infer<typeof inviteFriendSchema>;
export type InviteFriendResult = { error: string } | { ok: true; message: string };
