"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";
import { profileSchema, type ProfileInput } from "./schema";

type ProfileFormProps = {
  defaultValues: ProfileInput;
};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-5">
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="photoUrl">Photo</Label>
        <Input
          id="photoUrl"
          type="url"
          placeholder="https://"
          className="min-h-11"
          {...register("photoUrl")}
        />
        {errors.photoUrl ? (
          <p className="text-sm text-destructive">{errors.photoUrl.message}</p>
        ) : null}
      </div>
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">Profile saved.</p> : null}
      <Button type="submit" className="min-h-11 px-4" disabled={isSubmitting}>
        {isSubmitting ? "Saving profile" : "Save profile"}
      </Button>
    </form>
  );
}
