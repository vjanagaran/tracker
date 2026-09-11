import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function failedLinkUrl(origin: string, next: string, error: { code?: string; message?: string }) {
  if (next === "/reset-password" || next === "/invite/accept") {
    const url = new URL(next, origin);
    url.searchParams.set("error_code", error.code ?? "access_denied");
    url.searchParams.set(
      "error_description",
      error.message ?? "This link could not be used.",
    );
    return url.toString();
  }
  return `${origin}/sign-in`;
}

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
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(failedLinkUrl(origin, next, error));
  }

  return NextResponse.redirect(failedLinkUrl(origin, next, { code: "access_denied" }));
}
