import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div>
      <p className="mb-8 text-sm font-medium tracking-tight">Personal Board</p>
      <h1 className="mb-1 text-[1.75rem] font-semibold tracking-tight">Sign in</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Use the email you were invited with.
      </p>
      <SignInForm />
    </div>
  );
}
