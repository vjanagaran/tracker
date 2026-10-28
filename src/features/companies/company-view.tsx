import Link from "next/link";
import { Building2, FileText } from "lucide-react";
import type { ReactNode } from "react";
import { addressLines, displayUrl, fileSize } from "./format";
import { SOCIAL_PLATFORMS } from "./socials";
import type { Company } from "./types";

const linkClass =
  "inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline md:min-h-0";

export function CompanyLogo({ company, size = "md" }: { company: Company; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-24" : size === "md" ? "size-16" : "size-10";
  const icon = size === "lg" ? "size-10" : size === "md" ? "size-7" : "size-5";
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted`}
    >
      {company.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={company.logoUrl} alt="" className="size-full object-contain" />
      ) : (
        <Building2 className={`${icon} text-muted-foreground`} aria-hidden="true" />
      )}
    </span>
  );
}

export function companyMeta(company: Company) {
  return [
    company.industry,
    company.foundedYear ? `Founded ${company.foundedYear}` : null,
    company.city,
  ].filter((part): part is string => Boolean(part));
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Prose({ children }: { children: string }) {
  return (
    <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed">{children}</p>
  );
}

export function CompanyView({ company, isOwn }: { company: Company; isOwn: boolean }) {
  const meta = companyMeta(company);
  const address = addressLines(company);
  const socials = SOCIAL_PLATFORMS.flatMap((platform) => {
    const url = company.socials[platform.key];
    return url ? [{ ...platform, url }] : [];
  });
  const hasContact = Boolean(company.contactName || company.contactEmail || company.contactPhone);
  const hasDirection = Boolean(company.purpose || company.vision || company.mission);
  const hasDetails = Boolean(company.gstNumber || address.length > 0 || company.website);

  return (
    <article className="max-w-3xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <CompanyLogo company={company} size="lg" />
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold tracking-tight break-words md:text-[2rem]">
            {company.name}
          </h1>
          {company.tagline ? (
            <p className="mt-1.5 max-w-prose text-base text-muted-foreground">{company.tagline}</p>
          ) : null}
          {meta.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{meta.join(" · ")}</p>
          ) : null}
          {isOwn ? (
            <p className="mt-3 flex flex-wrap items-center gap-x-4">
              <Link href={`/profile/companies/${company.id}`} className={linkClass}>
                Edit company
              </Link>
              {!company.isShared ? (
                <span className="text-sm text-muted-foreground">Only you see this company.</span>
              ) : null}
            </p>
          ) : null}
        </div>
      </header>

      {company.about ? (
        <Block title="About">
          <Prose>{company.about}</Prose>
        </Block>
      ) : null}

      {hasDirection ? (
        <section className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { title: "Purpose", text: company.purpose },
            { title: "Vision", text: company.vision },
            { title: "Mission", text: company.mission },
          ].flatMap((item) =>
            item.text
              ? [
                  <div key={item.title}>
                    <h2 className="text-sm font-medium">{item.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{item.text}</p>
                  </div>,
                ]
              : [],
          )}
        </section>
      ) : null}

      {company.coreValues.length > 0 ? (
        <Block title="Core values">
          <ul className="flex flex-wrap gap-2">
            {company.coreValues.map((value) => (
              <li
                key={value}
                className="inline-flex min-h-8 items-center rounded-full border border-border bg-muted/50 px-3 text-sm"
              >
                {value}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {hasDetails ? (
        <Block title="Business details">
          <dl className="grid max-w-prose gap-x-8 gap-y-3 text-sm sm:grid-cols-[8rem_1fr]">
            {company.gstNumber ? (
              <>
                <dt className="text-muted-foreground">GST number</dt>
                <dd className="font-mono tracking-wide">{company.gstNumber}</dd>
              </>
            ) : null}
            {address.length > 0 ? (
              <>
                <dt className="text-muted-foreground">Address</dt>
                <dd>
                  {address.map((line) => (
                    <span key={line} className="block whitespace-pre-line">
                      {line}
                    </span>
                  ))}
                </dd>
              </>
            ) : null}
            {company.website ? (
              <>
                <dt className="text-muted-foreground">Website</dt>
                <dd>
                  <a href={company.website} rel="noreferrer" target="_blank" className={linkClass}>
                    {displayUrl(company.website)}
                  </a>
                </dd>
              </>
            ) : null}
          </dl>
        </Block>
      ) : null}

      {hasContact ? (
        <Block title="Contact">
          <ul className="flex flex-col gap-1 text-sm">
            {company.contactName ? <li>{company.contactName}</li> : null}
            {company.contactEmail ? (
              <li>
                <a
                  href={`mailto:${company.contactEmail}`}
                  className="inline-flex min-h-11 items-center break-all text-muted-foreground hover:text-foreground md:min-h-0"
                >
                  {company.contactEmail}
                </a>
              </li>
            ) : null}
            {company.contactPhone ? (
              <li>
                <a
                  href={`tel:${company.contactPhone.replace(/\s+/g, "")}`}
                  className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground md:min-h-0"
                >
                  {company.contactPhone}
                </a>
              </li>
            ) : null}
          </ul>
        </Block>
      ) : null}

      {socials.length > 0 ? (
        <Block title="Social media">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {socials.map((social) => (
              <li key={social.key}>
                <a href={social.url} rel="noreferrer" target="_blank" className={linkClass}>
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {company.brochure ? (
        <Block title="Brochure">
          <a
            href={`/companies/${company.id}/brochure`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-border px-4 text-sm hover:bg-accent/50"
          >
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 break-words">{company.brochure.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {fileSize(company.brochure.size)}
            </span>
          </a>
        </Block>
      ) : null}
    </article>
  );
}
