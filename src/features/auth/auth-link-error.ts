export function authLinkErrorMessage(errorCode?: string | null, description?: string | null) {
  const code = errorCode?.trim() ?? "";
  const text = description?.replace(/\+/g, " ").trim() ?? "";

  if (
    code === "otp_expired" ||
    /expired|invalid/i.test(code) ||
    /expired|invalid/i.test(text)
  ) {
    return "This link is no longer valid. It may have expired, already been used, or been opened by your mail app. Send another link and open it once.";
  }

  if (code || text) {
    return text || "This link could not be used. Send another link and open it once.";
  }

  return null;
}
