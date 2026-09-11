"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { acceptInvite } from "./actions";
import { acceptInviteSchema, type AcceptInviteInput } from "./schema";

type AcceptInviteFormProps = {
  defaultName: string;
};

export function AcceptInviteForm({ defaultName }: AcceptInviteFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      fullName: defaultName,
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: AcceptInviteInput) {
    setFormError(null);
    const result = await acceptInvite(values);
    if (result?.error) {
      setFormError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
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
        <Label htmlFor="phone">Mobile</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Your number"
          className="min-h-11"
          {...register("phone")}
        />
        {errors.phone ? (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Set a password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          className="min-h-11"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <Button type="submit" className="min-h-11 px-4" disabled={isSubmitting}>
        {isSubmitting ? "Creating my account" : "Create my account"}
      </Button>
    </form>
  );
}
