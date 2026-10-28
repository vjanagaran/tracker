"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCompany, updateCompany } from "./actions";
import {
  CORE_VALUE_MAX_LENGTH,
  MAX_CORE_VALUES,
  cleanCoreValues,
  companySchema,
  type CompanyInput,
} from "./schema";
import { SOCIAL_PLATFORMS } from "./socials";

type CompanyFormProps = {
  /** Present when editing; absent when adding. */
  companyId?: string;
  defaultValues: CompanyInput;
};

export function CompanyForm({ companyId, defaultValues }: CompanyFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [valueDraft, setValueDraft] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({ resolver: zodResolver(companySchema), defaultValues });
  const coreValues = watch("coreValues");
  const isShared = watch("isShared");

  function addValue() {
    const next = cleanCoreValues([...coreValues, valueDraft]);
    if (next.length === coreValues.length || next.length > MAX_CORE_VALUES) {
      setValueDraft("");
      return;
    }
    setValue("coreValues", next, { shouldValidate: true });
    setValueDraft("");
  }

  function removeValue(value: string) {
    setValue(
      "coreValues",
      coreValues.filter((item) => item !== value),
      { shouldValidate: true },
    );
  }

  async function onSubmit(values: CompanyInput) {
    setFormError(null);
    // A value typed but not yet added still counts.
    const withDraft = valueDraft.trim()
      ? { ...values, coreValues: cleanCoreValues([...values.coreValues, valueDraft]) }
      : values;

    if (!companyId) {
      const result = await createCompany(withDraft);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      toast.success("Company added. Add a logo and brochure next.");
      router.push(`/profile/companies/${result.company.id}`);
      return;
    }

    const result = await updateCompany(companyId, withDraft);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setValueDraft("");
    setValue("coreValues", result.company.coreValues);
    toast.success("Company saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
      <Section title="The company">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="name" label="Company name" error={errors.name?.message}>
            <Input id="name" autoComplete="organization" className="min-h-11" {...register("name")} />
          </Field>
          <Field id="tagline" label="Tagline" error={errors.tagline?.message}>
            <Input id="tagline" className="min-h-11" {...register("tagline")} />
          </Field>
          <Field id="industry" label="Industry" error={errors.industry?.message}>
            <Input id="industry" className="min-h-11" {...register("industry")} />
          </Field>
          <Field id="foundedYear" label="Founded" error={errors.foundedYear?.message}>
            <Input
              id="foundedYear"
              inputMode="numeric"
              placeholder="2022"
              className="min-h-11"
              {...register("foundedYear")}
            />
          </Field>
          <Field id="website" label="Website" error={errors.website?.message}>
            <Input id="website" inputMode="url" className="min-h-11" {...register("website")} />
          </Field>
          <Field id="gstNumber" label="GST number" error={errors.gstNumber?.message}>
            <Input
              id="gstNumber"
              autoCapitalize="characters"
              placeholder="33ABCDE1234F1Z5"
              className="min-h-11 uppercase"
              {...register("gstNumber")}
            />
          </Field>
        </div>
        <Field id="about" label="About the company" error={errors.about?.message}>
          <Textarea id="about" rows={5} className="min-h-28" {...register("about")} />
        </Field>
      </Section>

      <Section title="Address">
        <Field id="address" label="Street address" error={errors.address?.message}>
          <Textarea
            id="address"
            rows={3}
            autoComplete="street-address"
            className="min-h-20"
            {...register("address")}
          />
        </Field>
        <div className="grid gap-5 md:grid-cols-3">
          <Field id="city" label="City" error={errors.city?.message}>
            <Input id="city" autoComplete="address-level2" className="min-h-11" {...register("city")} />
          </Field>
          <Field id="state" label="State" error={errors.state?.message}>
            <Input id="state" autoComplete="address-level1" className="min-h-11" {...register("state")} />
          </Field>
          <Field id="pincode" label="Pincode" error={errors.pincode?.message}>
            <Input
              id="pincode"
              inputMode="numeric"
              autoComplete="postal-code"
              className="min-h-11"
              {...register("pincode")}
            />
          </Field>
        </div>
      </Section>

      <Section title="Contact" note="Who to reach about this company.">
        <div className="grid gap-5 md:grid-cols-3">
          <Field id="contactName" label="Contact person" error={errors.contactName?.message}>
            <Input id="contactName" className="min-h-11" {...register("contactName")} />
          </Field>
          <Field id="contactEmail" label="Email" error={errors.contactEmail?.message}>
            <Input
              id="contactEmail"
              type="email"
              inputMode="email"
              className="min-h-11"
              {...register("contactEmail")}
            />
          </Field>
          <Field id="contactPhone" label="Phone" error={errors.contactPhone?.message}>
            <Input id="contactPhone" type="tel" className="min-h-11" {...register("contactPhone")} />
          </Field>
        </div>
      </Section>

      <Section title="Purpose and direction">
        <Field id="purpose" label="Purpose" error={errors.purpose?.message}>
          <Textarea id="purpose" rows={3} className="min-h-20" {...register("purpose")} />
          <p className="text-xs text-muted-foreground">Why the company exists.</p>
        </Field>
        <Field id="vision" label="Vision" error={errors.vision?.message}>
          <Textarea id="vision" rows={3} className="min-h-20" {...register("vision")} />
          <p className="text-xs text-muted-foreground">What it looks like when it has succeeded.</p>
        </Field>
        <Field id="mission" label="Mission" error={errors.mission?.message}>
          <Textarea id="mission" rows={3} className="min-h-20" {...register("mission")} />
          <p className="text-xs text-muted-foreground">What you do, day to day, to get there.</p>
        </Field>

        <div className="flex flex-col gap-2">
          <Label htmlFor="coreValue">Core values</Label>
          {coreValues.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {coreValues.map((value) => (
                <li
                  key={value}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-muted/50 pr-1 pl-3 text-sm"
                >
                  {value}
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                    aria-label={`Remove ${value}`}
                    onClick={() => removeValue(value)}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex gap-2">
            <Input
              id="coreValue"
              value={valueDraft}
              maxLength={CORE_VALUE_MAX_LENGTH}
              placeholder="One value, such as Integrity"
              className="min-h-11"
              disabled={coreValues.length >= MAX_CORE_VALUES}
              onChange={(event) => setValueDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addValue();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 px-4"
              disabled={!valueDraft.trim() || coreValues.length >= MAX_CORE_VALUES}
              onClick={addValue}
            >
              Add value
            </Button>
          </div>
          {errors.coreValues?.message ? (
            <p className="text-sm text-destructive">{errors.coreValues.message}</p>
          ) : null}
        </div>
      </Section>

      <Section title="Social media" note="Paste the link to each page the company keeps.">
        <div className="grid gap-5 md:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <Field
              key={platform.key}
              id={`social-${platform.key}`}
              label={platform.label}
              error={errors.socials?.[platform.key]?.message}
            >
              <Input
                id={`social-${platform.key}`}
                inputMode="url"
                className="min-h-11"
                {...register(`socials.${platform.key}`)}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Who can see this">
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-primary"
            checked={isShared}
            onChange={(event) => setValue("isShared", event.target.checked)}
          />
          <span>
            Show this company to members of my boards
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {isShared
                ? "Board members see everything on this page, including the brochure."
                : "Only you see this company."}
            </span>
          </span>
        </label>
      </Section>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="min-h-11 px-5" disabled={isSubmitting}>
          {isSubmitting
            ? companyId
              ? "Saving company"
              : "Adding company"
            : companyId
              ? "Save company"
              : "Add company"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 px-4"
          onClick={() => router.push("/profile/companies")}
        >
          {companyId ? "Back to companies" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <div>
        <h2 className="text-sm font-medium tracking-tight">{title}</h2>
        {note ? <p className="mt-1 text-sm text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
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
