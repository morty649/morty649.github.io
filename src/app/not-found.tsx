import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-[70svh] place-items-center py-20 text-center">
      <div className="glass-card hero-glass p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">404 / Not found</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em]">This route did not make the build.</h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted-foreground">
          The project may have moved, or the address may be incomplete.
        </p>
        <Link className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" href="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Return home
        </Link>
      </div>
    </main>
  );
}
