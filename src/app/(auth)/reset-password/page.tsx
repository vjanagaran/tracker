import { redirect } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { AuthLinkContinue } from "@/features/auth/auth-link-continue";
import { authLinkErrorMessage } from "@/features/auth/auth-link-error";
import { HashSessionCatcher } from "@/features/auth/hash-session";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  if (params.code) {
    const next = encodeURIComponent("/reset-password");
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=${next}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const linkError = authLinkErrorMessage(params.error_code ?? params.error, params.error_description);
  const pendingHash = Boolean(params.token_hash) && !user && !linkError;

  return (
    <div className="pb-card p-6">
      <HashSessionCatcher next="/reset-password" />
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {user
          ? "Choose a new password for your account."
          : linkError
            ? "This reset link cannot be used."
            : pendingHash
              ? "Continue to confirm this reset link, then choose a new password."
              : "Open the reset link from your email to continue."}
      </p>
      {user ? (
        <ResetPasswordForm />
      ) : pendingHash && params.token_hash ? (
        <AuthLinkContinue
          tokenHash={params.token_hash}
          type="recovery"
          label="Continue"
        />
      ) : (
        <>
          <EmptyState>{linkError ?? "The form stays closed until the reset link from the email is opened."}</EmptyState>
          <p className="mt-6 text-sm">
            <Link href="/forgot-password" className="text-primary">
              Send another link
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
