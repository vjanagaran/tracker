import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next =
    type === "invite"
      ? "/invite/accept"
      : type === "recovery"
        ? "/reset-password"
        : "/tasks";

  if (tokenHash && type) {
    const supabase = await createClient();
    if (type === "invite" || type === "recovery") {
      await supabase.auth.signOut({ scope: "local" });
    }
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
