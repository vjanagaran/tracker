import Link from "next/link";
import { User } from "lucide-react";
import { ChairmanIcon } from "./chairman-icon";
import type { RosterMember } from "./types";

function MemberAvatar({ photoUrl }: { photoUrl: string | null }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
      aria-hidden="true"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <User className="size-4 text-muted-foreground" />
      )}
    </span>
  );
}

function MemberIdentity({ row }: { row: RosterMember }) {
  const name = row.fullName || "Unnamed";
  return (
    <span className="flex items-center gap-3">
      <MemberAvatar photoUrl={row.photoUrl} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <Link
            href={`/people/${row.userId}`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {name}
          </Link>
          {row.role === "chairman" ? (
            <span className="inline-flex text-primary" title="Chairman">
              <ChairmanIcon className="size-4 shrink-0" />
              <span className="sr-only">Chairman</span>
            </span>
          ) : null}
        </span>
        {row.companies.length > 0 ? (
          <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {row.companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="inline-flex min-h-11 items-center hover:text-foreground md:min-h-0"
              >
                {company.name}
              </Link>
            ))}
          </span>
        ) : null}
        <MemberContact email={row.email} phone={row.phone} />
      </span>
    </span>
  );
}

function MemberContact({
  email,
  phone,
}: {
  email: string | null;
  phone: string | null;
}) {
  if (!email && !phone) {
    return null;
  }

  return (
    <span className="mt-1 flex flex-col items-start gap-0.5 text-xs text-muted-foreground">
      {email ? (
        <a
          href={`mailto:${email}`}
          className="inline-flex min-h-11 items-center break-all hover:text-foreground md:min-h-0"
        >
          {email}
        </a>
      ) : null}
      {phone ? (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="inline-flex min-h-11 items-center hover:text-foreground md:min-h-0"
        >
          {phone}
        </a>
      ) : null}
    </span>
  );
}

export function MembersTable({ rows }: { rows: RosterMember[] }) {
  if (rows.length === 0) {
    return (
      <p className="max-w-prose text-sm text-muted-foreground">
        No members yet. A superadmin adds members from the board admin screen.
      </p>
    );
  }

  return (
    <section>
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-3">Member</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-border last:border-b-0">
                <td className="px-3 py-3">
                  <MemberIdentity row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <li key={row.userId} className="px-4 py-4">
            <MemberIdentity row={row} />
          </li>
        ))}
      </ul>
    </section>
  );
}
