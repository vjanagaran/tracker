import { redirect } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { HashSessionCatcher } from "@/features/auth/hash-session";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
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

  if (params.token_hash) {
    const type = params.type ?? "recovery";
    redirect(
      `/auth/confirm?token_hash=${encodeURIComponent(params.token_hash)}&type=${encodeURIComponent(type)}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="pb-card p-6">
      <HashSessionCatcher next="/reset-password" />
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {user
          ? "Choose a new password for your account."
          : "Open the reset link from your email to continue."}
      </p>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <>
          <EmptyState>
            The form stays closed until the reset link from the email is opened.
          </EmptyState>
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
