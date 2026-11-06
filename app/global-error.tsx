"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-dvh bg-[var(--background)] text-[var(--text-primary)]">
        <main role="alert" className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-[var(--font-anton)] text-4xl uppercase">Something went wrong</h1>
          <p className="text-sm text-[var(--text-secondary)]">{error.message}</p>
          <button type="button" onClick={reset} className="min-h-11 rounded-md bg-brand px-5 text-sm font-medium text-on-brand">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
