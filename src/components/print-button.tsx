"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/55 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary print:hidden"
      type="button"
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden="true" />
      Print / save as PDF
    </button>
  );
}
