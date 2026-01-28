import Link from "next/link";

const footerLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Refunds", href: "/legal/refunds" },
  { label: "Cookies", href: "/legal/cookies" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-zinc-700 dark:text-zinc-200">
          LaunchStencil
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
