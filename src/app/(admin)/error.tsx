"use client";

import { RouteError } from "@/components/route-error";

export default function AdminError({ retry }: { retry: () => void }) {
  return <RouteError retry={retry} />;
}
