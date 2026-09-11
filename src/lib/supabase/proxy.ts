import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/radar") ||
    pathname.startsWith("/offline") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  );
}

function redirectWithCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  supabaseResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    redirectResponse.headers.set(key, value);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;
  const { pathname } = request.nextUrl;

  if (!claims && !isPublicPath(pathname) && pathname !== "/") {
    return redirectWithCookies(request, supabaseResponse, "/sign-in");
  }

  if (claims && pathname.startsWith("/sign-in")) {
    return redirectWithCookies(request, supabaseResponse, "/tasks");
  }

  return supabaseResponse;
}
