import Link from "next/link";
import { User } from "lucide-react";
import { ChairmanIcon } from "./chairman-icon";
import type { VelocityRow } from "./types";

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

function MemberIdentity({ row }: { row: VelocityRow }) {
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

export function VelocityTable({ rows }: { rows: VelocityRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="max-w-prose text-sm text-muted-foreground">
        Counts start once a meeting is on the calendar.
      </p>
    );
  }

  return (
    <section className="mb-10">
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-3">Member</th>
              <th className="w-[180px] px-3 py-3">Finished this fortnight</th>
              <th className="w-[110px] px-3 py-3">Open now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-border last:border-b-0">
                <td className="px-3 py-3">
                  <MemberIdentity row={row} />
                </td>
                <td className="px-3 py-4 text-base font-medium">{row.completedCount}</td>
                <td className="px-3 py-4 text-sm">{row.openCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <li key={row.userId} className="px-4 py-4">
            <MemberIdentity row={row} />
            <p className="mt-2 text-sm text-muted-foreground">
              Finished this fortnight {row.completedCount} · Open now {row.openCount}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        Counts only. Task titles stay private to each member.
      </p>
    </section>
  );
}
