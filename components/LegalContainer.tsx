import type { ReactNode } from "react";

type LegalContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function LegalContainer({
  children,
  className,
}: LegalContainerProps) {
  const baseClassName =
    "mx-auto max-w-3xl space-y-8 px-4 py-10 text-zinc-700 dark:text-zinc-300 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-zinc-900 dark:[&_h1]:text-white [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-900 dark:[&_h3]:text-white [&_p]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:leading-7";
  const resolvedClassName = className
    ? `${baseClassName} ${className}`
    : baseClassName;

  return <main className={resolvedClassName}>{children}</main>;
}
