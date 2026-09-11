import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { AcceptInviteForm } from "@/features/auth/accept-invite-form";
import { AuthLinkContinue } from "@/features/auth/auth-link-continue";
import { authLinkErrorMessage } from "@/features/auth/auth-link-error";
import { HashSessionCatcher } from "@/features/auth/hash-session";
import { InviteSessionGate } from "@/features/auth/invite-session-gate";
import { isInviteSetupSession } from "@/features/auth/invite-session";
import { createClient } from "@/lib/supabase/server";

type AcceptInvitePageProps = {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>;
};

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const params = await searchParams;

  if (params.code) {
    const next = encodeURIComponent("/invite/accept");
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=${next}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: claimsData } = await supabase.auth.getClaims();

  let defaultName = "";
  let boardName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    defaultName =
      profile?.full_name ||
      (typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : "");
    boardName =
      typeof user.user_metadata.board_name === "string"
        ? user.user_metadata.board_name
        : "";
  }

  const setupSession = isInviteSetupSession(claimsData?.claims?.amr, boardName);
  const linkError = authLinkErrorMessage(params.error_code ?? params.error, params.error_description);
  const pendingHash = Boolean(params.token_hash) && !setupSession && !linkError;

  return (
    <div>
      <HashSessionCatcher />
      {user && !setupSession && !pendingHash ? (
        <InviteSessionGate setupSession={setupSession} />
      ) : null}
      <h1 className="mb-1 text-[1.75rem] font-semibold tracking-tight">
        {boardName ? `You have been invited to ${boardName}` : "You have been invited"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {setupSession
          ? "Set a password and a short profile. Your life and business wheels are already in place."
          : linkError
            ? "This invite link cannot be used."
            : pendingHash
              ? "Continue to confirm this invite, then set a password."
              : "Open the invite link from your email to continue."}
      </p>
      {setupSession && user ? (
        <AcceptInviteForm defaultName={defaultName} />
      ) : pendingHash && params.token_hash ? (
        <AuthLinkContinue tokenHash={params.token_hash} type="invite" label="Continue" />
      ) : (
        <EmptyState>
          {linkError ?? "The form stays closed until the invite link from the email is opened."}
        </EmptyState>
      )}
    </div>
  );
}
