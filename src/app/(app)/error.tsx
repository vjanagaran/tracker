"use client";

import { RouteError } from "@/components/route-error";

export default function AppError({ retry }: { retry: () => void }) {
  return <RouteError retry={retry} />;
}
