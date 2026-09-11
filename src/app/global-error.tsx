"use client";

import { RouteError } from "@/components/route-error";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <main
          id="main"
          className="flex min-h-dvh items-center justify-center px-4 py-10"
        >
          <div className="w-full max-w-md">
            <RouteError retry={retry} />
          </div>
        </main>
      </body>
    </html>
  );
}
