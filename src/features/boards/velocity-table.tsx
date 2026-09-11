import { User } from "lucide-react";
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
      <div className="pb-card hidden overflow-hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-3">Member</th>
              <th className="w-[180px] px-3 py-3">Finished this fortnight</th>
              <th className="w-[110px] px-3 py-3">Open now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const name = row.fullName || "Unnamed";
              return (
                <tr key={row.userId} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-3">
                      <MemberAvatar photoUrl={row.photoUrl} />
                      <span className="text-sm">{name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-4 text-base font-medium">{row.completedCount}</td>
                  <td className="px-3 py-4 text-sm">{row.openCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="pb-card divide-y divide-border overflow-hidden md:hidden">
        {rows.map((row) => {
          const name = row.fullName || "Unnamed";
          return (
            <li key={row.userId} className="flex items-center gap-3 px-4 py-4">
              <MemberAvatar photoUrl={row.photoUrl} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finished this fortnight {row.completedCount} · Open now {row.openCount}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        Counts only. Task titles stay private to each member.
      </p>
    </section>
  );
}
