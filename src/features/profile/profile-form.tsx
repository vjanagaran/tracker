"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeProfilePhoto, updateProfile, uploadProfilePhoto } from "./actions";
import {
  PHOTO_MAX_BYTES,
  PHOTO_MIME_TYPES,
  profileSchema,
  type ProfileInput,
} from "./schema";

type ProfileFormProps = {
  defaultValues: ProfileInput;
  initialPhotoUrl: string | null;
};

export function ProfileForm({ defaultValues, initialPhotoUrl }: ProfileFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

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
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProfilePhoto(formData);
    setPhotoBusy(false);
    if ("error" in result) {
      setPhotoError(result.error);
      return;
    }
    setPhotoUrl(result.photoUrl);
    toast.success("Photo updated.");
  }

  async function onRemovePhoto() {
    setPhotoError(null);
    setPhotoBusy(true);
    const result = await removeProfilePhoto();
    setPhotoBusy(false);
    if ("error" in result) {
      setPhotoError(result.error);
      return;
    }
    setPhotoUrl(null);
    toast.success("Photo removed.");
  }

  return (
    <div className="flex max-w-md flex-col gap-8">
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            className="min-h-11"
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="min-h-11"
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          ) : null}
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        {saved ? <p className="text-sm text-muted-foreground">Profile saved.</p> : null}
        <Button type="submit" className="min-h-11 px-4" disabled={isSubmitting}>
          {isSubmitting ? "Saving profile" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
