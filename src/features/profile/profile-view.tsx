import Link from "next/link";
import { User } from "lucide-react";
import type { PublicProfile } from "./types";

function displayUrl(value: string) {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.host}${path}`;
  } catch {
    return value;
  }
}

function MetaLine({ profile }: { profile: PublicProfile }) {
  const parts = [
    profile.designation,
    profile.company
      ? profile.companyFoundedYear
        ? `${profile.company}, ${profile.companyFoundedYear}`
        : profile.company
      : null,
    profile.industry,
    profile.city,
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return null;
  }

  return <p className="mt-2 text-sm text-muted-foreground">{parts.join(" · ")}</p>;
}

export function ProfileView({
  profile,
  isOwn,
}: {
  profile: PublicProfile;
  isOwn: boolean;
}) {
  const name = profile.fullName || "Unnamed";
  const hasCompany =
    Boolean(profile.aboutCompany) || Boolean(profile.website) || Boolean(profile.linkedin);
  const hasReach = Boolean(profile.email) || Boolean(profile.phone);

  return (
    <article className="max-w-2xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <User className="size-10 text-muted-foreground" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold tracking-tight md:text-[2rem]">
            {name}
          </h1>
          <MetaLine profile={profile} />
          {isOwn ? (
            <p className="mt-3">
              <Link
                href="/profile"
                className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
              >
                Edit profile
              </Link>
            </p>
          ) : null}
        </div>
      </header>

      {profile.about ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium">About</h2>
          <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-relaxed">
            {profile.about}
          </p>
        </section>
      ) : null}

      {hasCompany ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium">Company</h2>
          {profile.aboutCompany ? (
            <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-relaxed">
              {profile.aboutCompany}
            </p>
          ) : null}
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {profile.website ? (
              <li>
                <a
                  href={profile.website}
                  className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline md:min-h-0"
                  rel="noreferrer"
                  target="_blank"
                >
                  {displayUrl(profile.website)}
                </a>
              </li>
            ) : null}
            {profile.linkedin ? (
              <li>
                <a
                  href={profile.linkedin}
                  className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline md:min-h-0"
                  rel="noreferrer"
                  target="_blank"
                >
                  {displayUrl(profile.linkedin)}
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {hasReach ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium">Reach</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {profile.email ? (
              <li>
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex min-h-11 items-center break-all text-muted-foreground hover:text-foreground md:min-h-0"
                >
                  {profile.email}
                </a>
              </li>
            ) : null}
            {profile.phone ? (
              <li>
                <a
                  href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                  className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground md:min-h-0"
                >
                  {profile.phone}
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
