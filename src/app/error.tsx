"use client";

import { RouteError } from "@/components/route-error";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <RouteError retry={retry} />
      </div>
    </main>
  );
}
