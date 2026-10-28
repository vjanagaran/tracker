import { CompanyForm } from "@/features/companies/company-form";
import { emptyCompanyInput } from "@/features/companies/schema";

export default function NewCompanyPage() {
  return (
    <section className="max-w-3xl">
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Add a company</h2>
      <p className="mb-8 max-w-prose text-sm text-muted-foreground">
        A name is enough to start. Add a logo and brochure once it is saved.
      </p>
      <CompanyForm defaultValues={emptyCompanyInput()} />
    </section>
  );
}
