import type { VelocityRow } from "./types";

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
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-border last:border-b-0">
                <td className="px-3 py-4 text-sm">{row.fullName || "Unnamed"}</td>
                <td className="px-3 py-4 text-base font-medium">{row.completedCount}</td>
                <td className="px-3 py-4 text-sm">{row.openCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="pb-card divide-y divide-border overflow-hidden md:hidden">
        {rows.map((row) => (
          <li key={row.userId} className="px-4 py-4">
            <p className="text-sm font-medium">{row.fullName || "Unnamed"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
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
