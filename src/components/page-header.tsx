type PageHeaderProps = {
  title: string;
  description?: string;
  meta?: string;
  eyebrow?: string;
};

export function PageHeader({ title, description, meta, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <p className="mb-1 text-xs text-muted-foreground">{eyebrow}</p>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-[1.75rem] font-semibold tracking-tight md:text-[2rem]">
          {title}
        </h1>
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
      </div>
      {description ? (
        <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
