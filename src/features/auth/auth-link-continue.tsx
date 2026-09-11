"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { consumeAuthLink } from "./actions";
import type { EmailOtpType } from "@supabase/supabase-js";

export function AuthLinkContinue({
  tokenHash,
  type,
  label,
}: {
  tokenHash: string;
  type: EmailOtpType;
  label: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onContinue() {
    setError(null);
    setPending(true);
    try {
      const result = await consumeAuthLink(tokenHash, type);
      if (result?.error) {
        setError(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" className="min-h-11 px-4" disabled={pending} onClick={() => void onContinue()}>
        {pending ? "Opening link" : label}
      </Button>
    </div>
  );
}
