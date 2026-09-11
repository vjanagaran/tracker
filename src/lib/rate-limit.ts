type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

const buckets = new Map<string, number[]>();

export const INVITE_RATE_LIMIT = 5;
export const INVITE_RATE_WINDOW_MS = 10 * 60 * 1000;

export function takeRateLimit(
  key: string,
  limit = INVITE_RATE_LIMIT,
  windowMs = INVITE_RATE_WINDOW_MS,
  now = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const recent = (buckets.get(key) ?? []).filter((stamp) => stamp > cutoff);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return { ok: false, retryAfterMs: recent[0] + windowMs - now };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { ok: true };
}

export function resetRateLimit(key?: string) {
  if (key) {
    buckets.delete(key);
    return;
  }
  buckets.clear();
}

export function inviteRateLimitKey(userId: string) {
  return `invite:${userId}`;
}

export function inviteRateLimitedMessage() {
  return "Too many invites in a short time. Wait a few minutes and try again.";
}

export function passwordResetRateLimitKey(email: string) {
  return `password-reset:${email.trim().toLowerCase()}`;
}

export function passwordResetRateLimitedMessage() {
  return "Too many reset attempts. Wait a few minutes and try again.";
}
