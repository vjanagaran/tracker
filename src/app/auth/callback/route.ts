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
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/tasks";
  const safeNext = next.startsWith("/") ? next : "/tasks";

  if (code) {
    const supabase = await createClient();
    // Do not sign out first. PKCE recovery stores the code verifier in
    // cookies; clearing the session would throw that away and the exchange
    // would fail, sending the person to sign-in.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    return NextResponse.redirect(failedLinkUrl(origin, safeNext, error));
  }

  return NextResponse.redirect(failedLinkUrl(origin, safeNext, { code: "access_denied" }));
}
