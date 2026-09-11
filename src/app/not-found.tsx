import { NotFoundState } from "@/components/not-found-state";

export default function NotFoundPage() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <NotFoundState />
      </div>
    </main>
  );
}
