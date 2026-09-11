import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="pb-card p-6">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Forgot password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter the email you sign in with. We will send a link to set a new
        password.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm">
        <Link href="/sign-in" className="text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
