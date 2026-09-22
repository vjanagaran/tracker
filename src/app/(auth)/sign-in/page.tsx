import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/sign-in-form";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div>
      <p className="mb-8 text-sm font-medium tracking-tight">{APP_NAME}</p>
      <h1 className="mb-1 text-[1.75rem] font-semibold tracking-tight">Sign in</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Use the email you were invited with.
      </p>
      <SignInForm />
    </div>
  );
}
