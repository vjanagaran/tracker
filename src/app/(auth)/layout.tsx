export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="main"
      className="flex min-h-dvh items-center justify-center bg-background px-4 py-10"
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
