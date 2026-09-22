import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main
      id="main"
      className="flex min-h-dvh items-center justify-center bg-background px-4 py-10"
    >
      <div className="w-full max-w-md">
        <p className="mb-1 text-xs text-muted-foreground">{APP_NAME}</p>
        <h1 className="text-[1.75rem] font-semibold tracking-tight">You are offline</h1>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Wheels, scores, tasks and boards need a connection. They are not kept
          on this device, so a list from an earlier session is not shown.
        </p>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          This screen still works. When the connection returns, open Life,
          Business, Tasks or Board again.
        </p>
      </div>
    </main>
  );
}
