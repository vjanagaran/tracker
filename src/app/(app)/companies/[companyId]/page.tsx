import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyView } from "@/features/companies/company-view";
import { loadCompany } from "@/features/companies/load";
import { requireUser } from "@/lib/auth/require-user";

type CompanyPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { companyId } = await params;
  const { supabase, user } = await requireUser();
  // Row-level security returns nothing unless this is yours or a shared one on a board you are on.
  const company = await loadCompany(supabase, companyId);

  if (!company) {
    notFound();
  }

  return (
    <>
      <p className="mb-6">
        <Link
          href={`/people/${company.userId}`}
          className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          {company.userId === user.id ? "Your profile" : "Owner’s profile"}
        </Link>
      </p>
      <CompanyView company={company} isOwn={company.userId === user.id} />
    </>
  );
}
