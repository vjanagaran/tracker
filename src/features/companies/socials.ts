export const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "youtube", label: "YouTube" },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export const SOCIAL_KEYS: SocialKey[] = SOCIAL_PLATFORMS.map((platform) => platform.key);
