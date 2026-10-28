export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A readable form of a web address: no scheme, no trailing slash. */
export function displayUrl(value: string) {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.host}${path}`;
  } catch {
    return value;
  }
}

/** Address lines as one block: street, then "city, state pincode". */
export function addressLines(parts: {
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}) {
  const place = [parts.city, [parts.state, parts.pincode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [parts.address, place].filter((line): line is string => Boolean(line));
}
