import Link from "next/link";

export default function LandingHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          className="text-lg font-semibold text-zinc-900 dark:text-white"
          href="/"
        >
          LaunchStencil
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            href="/pricing"
          >
            Pricing
          </Link>
          <Link
            className="rounded-full bg-zinc-900 px-4 py-2 text-white transition hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href="/start"
          >
            Start
          </Link>
        </nav>
      </div>
    </header>
  );
}
