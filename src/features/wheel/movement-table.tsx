import Link from "next/link";
import { formatMove } from "@/features/wheel/labels";
import type { ComparisonAxis } from "@/features/wheel/types";

type MovementTableProps = {
  axes: ComparisonAxis[];
  earlierLabel: string;
  laterLabel: string;
};

export function MovementTable({
  axes,
  earlierLabel,
  laterLabel,
}: MovementTableProps) {
  if (axes.length === 0) {
    return null;
  }

  return (
    <div>
      <table className="hidden w-full border-collapse md:table">
        <caption className="sr-only">
          Score movement from {earlierLabel} to {laterLabel}
        </caption>
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground">
            <th className="py-2 pr-3 text-left font-semibold">Spoke</th>
            <th className="px-2 py-2 text-center font-semibold">{earlierLabel}</th>
            <th className="px-2 py-2 text-center font-semibold">{laterLabel}</th>
            <th className="py-2 pl-2 text-center font-semibold">Move</th>
          </tr>
        </thead>
        <tbody>
          {axes.map((axis) => {
            const move = formatMove(axis.earlier, axis.later);
            return (
              <tr key={axis.id} className="border-b border-border/70 last:border-b-0">
                <td className="py-3 pr-3 text-sm">
                  <Link
                    href={`/spoke/${axis.id}`}
                    className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline"
                  >
                    {axis.name}
                  </Link>
                </td>
                <td className="px-2 py-3 text-center text-sm">
                  {axis.earlier ?? "—"}
                </td>
                <td className="px-2 py-3 text-center text-sm">
                  {axis.later ?? "—"}
                </td>
                <td
                  className={`py-3 pl-2 text-center text-sm font-medium ${moveClass(move.tone)}`}
                >
                  {move.label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y md:hidden">
        {axes.map((axis) => {
          const move = formatMove(axis.earlier, axis.later);
          return (
            <li key={axis.id} className="px-4 py-4">
              <Link
                href={`/spoke/${axis.id}`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
              >
                {axis.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {earlierLabel} {axis.earlier ?? "—"} · {laterLabel}{" "}
                {axis.later ?? "—"} ·{" "}
                <span className={moveClass(move.tone)}>{move.label}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function moveClass(tone: "up" | "down" | "flat" | "none") {
  if (tone === "up") {
    return "text-primary";
  }
  if (tone === "down") {
    return "text-foreground";
  }
  return "text-muted-foreground";
}
