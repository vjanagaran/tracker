function authMethods(amr: unknown): string[] {
  if (!Array.isArray(amr)) {
    return [];
  }
  return amr.flatMap((entry) => {
    if (typeof entry === "string") {
      return [entry];
    }
    if (entry && typeof entry === "object" && "method" in entry) {
      return [String((entry as { method: unknown }).method)];
    }
    return [];
  });
}

export function isInviteSetupSession(amr: unknown, boardName?: string) {
  const methods = authMethods(amr);
  if (methods.includes("password")) {
    return false;
  }
  if (methods.some((method) => method === "invite" || method === "otp" || method === "magiclink")) {
    return true;
  }
  return Boolean(boardName);
}
