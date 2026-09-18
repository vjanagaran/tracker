"use client";

import Link from "next/link";
import { cn } from "cn";
import type { WheelSlug } from "@/features/wheel/types";

export function WheelKindSwitch({ slug }: { slug: WheelSlug }) {
  return (
    <div className="mb-4 flex gap-1 md:hidden" role="tablist" aria-label="Wheel">
      <Link
        href="/wheel/life"
        role="tab"
        aria-selected={slug === "life"}
        className={cn(
          "min-h-11 px-3 text-sm",
          slug === "life"
            ? "border-b-2 border-foreground font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Life
      </Link>
      <Link
        href="/wheel/business"
        role="tab"
        aria-selected={slug === "business"}
        className={cn(
          "min-h-11 px-3 text-sm",
          slug === "business"
            ? "border-b-2 border-foreground font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Business
      </Link>
    </div>
  );
}
