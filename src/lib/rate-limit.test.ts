import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  INVITE_RATE_LIMIT,
  inviteRateLimitKey,
  resetRateLimit,
  takeRateLimit,
} from "./rate-limit.ts";

describe("takeRateLimit", () => {
  const key = inviteRateLimitKey("superadmin-test");

  beforeEach(() => {
    resetRateLimit();
  });

  it("allows the first invites inside the window", () => {
    for (let i = 0; i < INVITE_RATE_LIMIT; i += 1) {
      const result = takeRateLimit(key, INVITE_RATE_LIMIT, 60_000, 1_000 + i);
      assert.equal(result.ok, true);
    }
  });

  it("blocks the next invite in the same window", () => {
    const windowMs = 60_000;
    for (let i = 0; i < INVITE_RATE_LIMIT; i += 1) {
      takeRateLimit(key, INVITE_RATE_LIMIT, windowMs, 1_000);
    }
    const blocked = takeRateLimit(key, INVITE_RATE_LIMIT, windowMs, 1_500);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.ok(blocked.retryAfterMs > 0);
    }
  });

  it("allows another invite after the window", () => {
    const windowMs = 60_000;
    for (let i = 0; i < INVITE_RATE_LIMIT; i += 1) {
      takeRateLimit(key, INVITE_RATE_LIMIT, windowMs, 1_000);
    }
    const later = takeRateLimit(key, INVITE_RATE_LIMIT, windowMs, 1_000 + windowMs + 1);
    assert.equal(later.ok, true);
  });

  it("keeps keys separate", () => {
    const windowMs = 60_000;
    for (let i = 0; i < INVITE_RATE_LIMIT; i += 1) {
      takeRateLimit(key, INVITE_RATE_LIMIT, windowMs, 1_000);
    }
    const other = takeRateLimit(
      inviteRateLimitKey("other-admin"),
      INVITE_RATE_LIMIT,
      windowMs,
      1_000,
    );
    assert.equal(other.ok, true);
  });
});
