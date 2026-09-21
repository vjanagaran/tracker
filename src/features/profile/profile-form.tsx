"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { removeProfilePhoto, saveProfilePhotoUrl, updateProfile } from "./actions";
import {
  AVATAR_BUCKET,
  PHOTO_MAX_BYTES,
  PHOTO_MIME_TYPES,
  avatarObjectPath,
  profileSchema,
  type ProfileInput,
} from "./schema";

type ProfileFormProps = {
  defaultValues: ProfileInput;
  initialPhotoUrl: string | null;
  email: string;
};

export function ProfileForm({ defaultValues, initialPhotoUrl, email }: ProfileFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });
  const morningNoteOn = watch("morningNoteOn");
  const timezone = watch("timezone");
  const timeZones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? Intl.supportedValuesOf("timeZone")
      : ["Asia/Kolkata", "UTC"];

  async function onSubmit(values: ProfileInput) {
    setFormError(null);
    setSaved(false);
    const result = await updateProfile(values);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setSaved(true);
  }

  async function onFileChosen(file: File) {
    setPhotoError(null);
    if (!PHOTO_MIME_TYPES.includes(file.type as (typeof PHOTO_MIME_TYPES)[number])) {
      setPhotoError("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError("Keep the photo under 5 MB.");
      return;
    }

    setPhotoBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhotoError("Your session ended. Sign in again.");
        return;
      }

      const path = avatarObjectPath(user.id);
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) {
        setPhotoError(uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const nextUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
      const result = await saveProfilePhotoUrl(nextUrl);
      if ("error" in result) {
        setPhotoError(result.error);
        return;
      }
      setPhotoUrl(result.photoUrl);
      toast.success("Photo updated.");
    } catch {
      setPhotoError("The photo could not be uploaded. Try again.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemovePhoto() {
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const result = await removeProfilePhoto();
      if ("error" in result) {
        setPhotoError(result.error);
        return;
      }
      setPhotoUrl(null);
      toast.success("Photo removed.");
    } catch {
      setPhotoError("The photo could not be removed. Try again.");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-7 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-3"
                disabled={photoBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                {photoBusy ? "Uploading" : photoUrl ? "Change photo" : "Upload photo"}
              </Button>
              {photoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 px-3 text-destructive"
                  disabled={photoBusy}
                  onClick={() => void onRemovePhoto()}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={PHOTO_MIME_TYPES.join(",")}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void onFileChosen(file);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">PNG, JPEG or WebP, up to 5 MB.</p>
          </div>
        </div>
        {photoError ? <p className="text-sm text-destructive">{photoError}</p> : null}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="fullName" label="Name" error={errors.fullName?.message}>
            <Input id="fullName" autoComplete="name" className="min-h-11" {...register("fullName")} />
          </Field>
          <Field id="designation" label="Designation" error={errors.designation?.message}>
            <Input
              id="designation"
              autoComplete="organization-title"
              className="min-h-11"
              {...register("designation")}
            />
          </Field>
          <Field id="company" label="Company" error={errors.company?.message}>
            <Input
              id="company"
              autoComplete="organization"
              className="min-h-11"
              {...register("company")}
            />
          </Field>
          <Field id="companyFoundedYear" label="Founded" error={errors.companyFoundedYear?.message}>
            <Input
              id="companyFoundedYear"
              inputMode="numeric"
              className="min-h-11"
              {...register("companyFoundedYear")}
            />
          </Field>
          <Field id="industry" label="Industry" error={errors.industry?.message}>
            <Input id="industry" className="min-h-11" {...register("industry")} />
          </Field>
          <Field id="city" label="City" error={errors.city?.message}>
            <Input id="city" autoComplete="address-level2" className="min-h-11" {...register("city")} />
          </Field>
        </div>

        <Field id="aboutCompany" label="About the company" error={errors.aboutCompany?.message}>
          <Textarea
            id="aboutCompany"
            rows={4}
            className="min-h-24"
            {...register("aboutCompany")}
          />
        </Field>
        <Field id="about" label="About you" error={errors.about?.message}>
          <Textarea id="about" rows={4} className="min-h-24" {...register("about")} />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field id="website" label="Website" error={errors.website?.message}>
            <Input id="website" inputMode="url" className="min-h-11" {...register("website")} />
          </Field>
          <Field id="linkedin" label="LinkedIn" error={errors.linkedin?.message}>
            <Input id="linkedin" inputMode="url" className="min-h-11" {...register("linkedin")} />
          </Field>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="min-h-11 bg-muted"
            />
          </div>
          <Field id="phone" label="Phone" error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="min-h-11"
              {...register("phone")}
            />
          </Field>
        </div>

        <section id="morning-note" className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="text-sm font-medium tracking-tight">Morning note</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            A short mail at 7:00 in your timezone when something is due today, overdue, or the
            board meets today. Off until you turn it on. The board does not see this.
          </p>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={morningNoteOn}
              onChange={(event) => {
                const on = event.target.checked;
                setValue("morningNoteOn", on, { shouldValidate: true });
                if (on && !timezone) {
                  setValue("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone, {
                    shouldValidate: true,
                  });
                }
              }}
            />
            Send the morning note
          </label>
          <Field id="timezone" label="Timezone" error={errors.timezone?.message}>
            <select
              id="timezone"
              className="h-11 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={timezone}
              onChange={(event) =>
                setValue("timezone", event.target.value, { shouldValidate: true })
              }
            >
              <option value="">Choose your timezone</option>
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </Field>
        </section>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        {saved ? <p className="text-sm text-muted-foreground">Profile saved.</p> : null}
        <Button type="submit" className="min-h-11 w-fit px-4" disabled={isSubmitting}>
          {isSubmitting ? "Saving profile" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
