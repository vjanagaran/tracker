import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyDelete } from "@/features/companies/company-delete";
import { CompanyFiles } from "@/features/companies/company-files";
import { CompanyForm } from "@/features/companies/company-form";
import { loadCompany } from "@/features/companies/load";
import { emptyCompanyInput, type CompanyInput } from "@/features/companies/schema";
import { SOCIAL_KEYS } from "@/features/companies/socials";
import { requireUser } from "@/lib/auth/require-user";

type EditCompanyPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { companyId } = await params;
  const { supabase, user } = await requireUser();
  const company = await loadCompany(supabase, companyId);

  // Another member's company is readable here but never editable.
  if (!company || company.userId !== user.id) {
    notFound();
  }

  const empty = emptyCompanyInput();
  const defaults: CompanyInput = {
    ...empty,
    name: company.name,
    tagline: company.tagline ?? "",
    industry: company.industry ?? "",
    foundedYear: company.foundedYear ? String(company.foundedYear) : "",
    about: company.about ?? "",
    website: company.website ?? "",
    gstNumber: company.gstNumber ?? "",
    address: company.address ?? "",
    city: company.city ?? "",
    state: company.state ?? "",
    pincode: company.pincode ?? "",
    contactName: company.contactName ?? "",
    contactEmail: company.contactEmail ?? "",
    contactPhone: company.contactPhone ?? "",
    purpose: company.purpose ?? "",
    vision: company.vision ?? "",
    mission: company.mission ?? "",
    coreValues: company.coreValues,
    socials: Object.fromEntries(
      SOCIAL_KEYS.map((key) => [key, company.socials[key] ?? ""]),
    ) as CompanyInput["socials"],
    isShared: company.isShared,
  };

  return (
    <section className="max-w-3xl">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight break-words">{company.name}</h2>
        <Link
          href={`/companies/${company.id}`}
          className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          See how it appears
        </Link>
      </div>

      <div className="mb-10">
        <CompanyFiles
          companyId={company.id}
          initialLogoUrl={company.logoUrl}
          initialBrochure={company.brochure}
        />
      </div>

      <CompanyForm key={company.id} companyId={company.id} defaultValues={defaults} />
      <CompanyDelete companyId={company.id} name={company.name} />
    </section>
  );
}
