"use client";

import { Building2, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  removeCompanyBrochure,
  removeCompanyLogo,
  saveCompanyBrochure,
  saveCompanyLogo,
} from "./actions";
import {
  BROCHURE_BUCKET,
  BROCHURE_MAX_BYTES,
  BROCHURE_MIME_TYPE,
  LOGO_BUCKET,
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
  brochureObjectPath,
  logoObjectPath,
} from "./schema";
import { fileSize } from "./format";

type CompanyFilesProps = {
  companyId: string;
  initialLogoUrl: string | null;
  initialBrochure: { name: string; size: number } | null;
};

/** Logo and brochure go straight to storage from the browser, then the server records them. */
export function CompanyFiles({ companyId, initialLogoUrl, initialBrochure }: CompanyFilesProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [brochure, setBrochure] = useState(initialBrochure);
  const [logoBusy, setLogoBusy] = useState(false);
  const [brochureBusy, setBrochureBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [brochureError, setBrochureError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const brochureInput = useRef<HTMLInputElement>(null);

  async function sessionUserId() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, userId: user?.id ?? null };
  }

  async function chooseLogo(file: File) {
    setLogoError(null);
    if (!LOGO_MIME_TYPES.includes(file.type as (typeof LOGO_MIME_TYPES)[number])) {
      setLogoError("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError("Keep the logo under 5 MB.");
      return;
    }
    setLogoBusy(true);
    try {
      const { supabase, userId } = await sessionUserId();
      if (!userId) {
        setLogoError("Your session ended. Sign in again.");
        return;
      }
      const path = logoObjectPath(userId, companyId);
      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) {
        setLogoError(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      const result = await saveCompanyLogo(companyId, `${data.publicUrl}?v=${Date.now()}`);
      if ("error" in result) {
        setLogoError(result.error);
        return;
      }
      setLogoUrl(result.logoUrl);
      toast.success("Logo updated.");
    } catch {
      setLogoError("The logo could not be uploaded. Try again.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function dropLogo() {
    setLogoError(null);
    setLogoBusy(true);
    try {
      const result = await removeCompanyLogo(companyId);
      if ("error" in result) {
        setLogoError(result.error);
        return;
      }
      setLogoUrl(null);
      toast.success("Logo removed.");
    } catch {
      setLogoError("The logo could not be removed. Try again.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function chooseBrochure(file: File) {
    setBrochureError(null);
    if (file.type !== BROCHURE_MIME_TYPE) {
      setBrochureError("Use a PDF.");
      return;
    }
    if (file.size > BROCHURE_MAX_BYTES) {
      setBrochureError("Keep the brochure under 10 MB.");
      return;
    }
    setBrochureBusy(true);
    try {
      const { supabase, userId } = await sessionUserId();
      if (!userId) {
        setBrochureError("Your session ended. Sign in again.");
        return;
      }
      const { error: uploadError } = await supabase.storage
        .from(BROCHURE_BUCKET)
        .upload(brochureObjectPath(userId, companyId), file, {
          upsert: true,
          contentType: BROCHURE_MIME_TYPE,
        });
      if (uploadError) {
        setBrochureError(uploadError.message);
        return;
      }
      const result = await saveCompanyBrochure(companyId, { name: file.name, size: file.size });
      if ("error" in result) {
        setBrochureError(result.error);
        return;
      }
      setBrochure(result.brochure);
      toast.success("Brochure uploaded.");
    } catch {
      setBrochureError("The brochure could not be uploaded. Try again.");
    } finally {
      setBrochureBusy(false);
    }
  }

  async function dropBrochure() {
    setBrochureError(null);
    setBrochureBusy(true);
    try {
      const result = await removeCompanyBrochure(companyId);
      if ("error" in result) {
        setBrochureError(result.error);
        return;
      }
      setBrochure(null);
      toast.success("Brochure removed.");
    } catch {
      setBrochureError("The brochure could not be removed. Try again.");
    } finally {
      setBrochureBusy(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-full object-contain" />
            ) : (
              <Building2 className="size-8 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-3"
                disabled={logoBusy}
                onClick={() => logoInput.current?.click()}
              >
                {logoBusy ? "Uploading" : logoUrl ? "Change logo" : "Upload logo"}
              </Button>
              {logoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 px-3 text-destructive"
                  disabled={logoBusy}
                  onClick={() => void dropLogo()}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <input
              ref={logoInput}
              type="file"
              accept={LOGO_MIME_TYPES.join(",")}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void chooseLogo(file);
              }}
            />
            <p className="text-xs text-muted-foreground">PNG, JPEG or WebP, up to 5 MB.</p>
          </div>
        </div>
        {logoError ? <p className="text-sm text-destructive">{logoError}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Brochure</Label>
        <div className="flex items-start gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
            <FileText className="size-8 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            {brochure ? (
              <p className="min-w-0 text-sm">
                <span className="block break-words">{brochure.name}</span>
                <span className="text-xs text-muted-foreground">{fileSize(brochure.size)}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-3"
                disabled={brochureBusy}
                onClick={() => brochureInput.current?.click()}
              >
                {brochureBusy ? "Uploading" : brochure ? "Replace brochure" : "Upload brochure"}
              </Button>
              {brochure ? (
                <>
                  <a
                    href={`/companies/${companyId}/brochure`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center px-2 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Open
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 px-3 text-destructive"
                    disabled={brochureBusy}
                    onClick={() => void dropBrochure()}
                  >
                    Remove
                  </Button>
                </>
              ) : null}
            </div>
            <input
              ref={brochureInput}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void chooseBrochure(file);
              }}
            />
            <p className="text-xs text-muted-foreground">PDF, up to 10 MB.</p>
          </div>
        </div>
        {brochureError ? <p className="text-sm text-destructive">{brochureError}</p> : null}
      </div>
    </div>
  );
}
