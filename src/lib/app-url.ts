const PRODUCTION_ORIGIN = "https://tracker.maayasoft.in";

function configuredOrigin() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/$/, "");
}

function isLocalHost(host: string) {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
  );
}

export function appOrigin(headerStore?: Headers) {
  const configured = configuredOrigin();
  if (configured) {
    return configured;
  }

  if (headerStore) {
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    if (host && !isLocalHost(host)) {
      const proto = headerStore.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  }

  return PRODUCTION_ORIGIN;
}

export function inviteAcceptUrl(headerStore?: Headers) {
  return `${appOrigin(headerStore)}/invite/accept`;
}

export function resetPasswordUrl(headerStore?: Headers) {
  return `${appOrigin(headerStore)}/reset-password`;
}

export function dashboardUrl(headerStore?: Headers) {
  return `${appOrigin(headerStore)}/dashboard`;
}

export function profileUrl(headerStore?: Headers) {
  return `${appOrigin(headerStore)}/profile`;
}
