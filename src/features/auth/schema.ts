import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const acceptInviteSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name."),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
