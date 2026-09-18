import Link from "next/link";

type DashboardCardProps = {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
};

export function DashboardCard({ title, action, children }: DashboardCardProps) {
  return (
    <section className="pb-card flex flex-col p-4 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight">{title}</h2>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 text-xs text-primary underline-offset-4 hover:underline"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
