export function ChairmanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 13.5V4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V13.5" />
      <circle cx="12" cy="6.6" r="1.85" />
      <path d="M12 8.45v1.05" />
      <path d="M9.15 13.5c.35-2.05 1.45-3.05 2.85-3.05s2.5 1 2.85 3.05" />
      <path d="M12 9.7 12.7 12h-1.4z" fill="currentColor" stroke="none" />
      <rect x="3.5" y="13.5" width="17" height="6.25" rx="1.1" />
      <path d="M8.25 16.05h7.5M9.5 17.85h5" />
      <path d="M8 21.75h2.75M13.25 21.75h2.75" />
    </svg>
  );
}
