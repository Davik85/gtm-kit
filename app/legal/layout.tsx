import type { ReactNode } from "react";
import LegalContainer from "@/components/LegalContainer";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <LegalContainer>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Legal
        </p>
        <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
      </header>
      <section className="space-y-6">{children}</section>
    </LegalContainer>
  );
}
