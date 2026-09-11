"use client";

import { RouteError } from "@/components/route-error";

export default function AuthError({ retry }: { retry: () => void }) {
  return <RouteError retry={retry} />;
}
