import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { AcceptInviteForm } from "@/features/auth/accept-invite-form";
import { HashSessionCatcher } from "@/features/auth/hash-session";
import { createClient } from "@/lib/supabase/server";

type AcceptInvitePageProps = {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
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

  if (params.token_hash) {
    const type = params.type ?? "invite";
    redirect(
      `/auth/confirm?token_hash=${encodeURIComponent(params.token_hash)}&type=${encodeURIComponent(type)}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return (
    <div className="pb-card p-6">
      <HashSessionCatcher />
      <h1 className="mb-1 text-xl font-semibold tracking-tight">
        {boardName ? `You have been invited to ${boardName}` : "You have been invited"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {user
          ? "Set a password and a short profile. Your life and business wheels are already in place."
          : "Open the invite link from your email to continue."}
      </p>
      {user ? (
        <AcceptInviteForm defaultName={defaultName} />
      ) : (
        <EmptyState>
          The form stays closed until the invite link from the email is opened.
        </EmptyState>
      )}
    </div>
  );
}
