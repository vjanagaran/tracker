import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { CompanyRow } from "@/features/companies/company-card";
import { loadCompaniesOf } from "@/features/companies/load";
import { requireUser } from "@/lib/auth/require-user";

export default async function CompaniesPage() {
  const { supabase, user } = await requireUser();
  const companies = await loadCompaniesOf(supabase, user.id);

  return (
    <section className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <p className="max-w-prose text-sm text-muted-foreground">
          Keep a profile for each company you run. People on your boards can read it, with its
          GST number, address, contact, purpose and brochure. You choose which ones they see.
        </p>
        <Link
          href="/profile/companies/new"
          className={cn(buttonVariants(), "min-h-11 px-4")}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add company
        </Link>
      </div>

      {companies.length === 0 ? (
        <EmptyState>
          No companies yet. Add one so your boards see what you are building.
        </EmptyState>
      ) : (
        <ul className="border-t border-border">
          {companies.map((company) => (
            <CompanyRow key={company.id} company={company} isOwn />
          ))}
        </ul>
      )}
    </section>
  );
}
