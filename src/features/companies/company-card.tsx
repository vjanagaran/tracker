import Link from "next/link";
import { CompanyLogo, companyMeta } from "./company-view";
import type { Company } from "./types";

/** One company as a hairline row: logo, name, a line of facts, and where it leads. */
export function CompanyRow({
  company,
  isOwn = false,
}: {
  company: Company;
  isOwn?: boolean;
}) {
  const meta = companyMeta(company);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border py-4 last:border-b-0">
      <CompanyLogo company={company} size="sm" />
      <div className="min-w-0 flex-1 basis-56">
        <Link
          href={`/companies/${company.id}`}
          className="text-[15px] font-medium text-primary underline-offset-4 hover:underline"
        >
          {company.name}
        </Link>
        {company.tagline ? (
          <p className="mt-0.5 text-sm break-words text-muted-foreground">{company.tagline}</p>
        ) : null}
        {meta.length > 0 ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.join(" · ")}</p>
        ) : null}
      </div>
      {isOwn ? (
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {company.isShared ? "Visible to your boards" : "Only you"}
          </span>
          <Link
            href={`/profile/companies/${company.id}`}
            className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
          >
            Edit
          </Link>
        </div>
      ) : null}
    </li>
  );
}
