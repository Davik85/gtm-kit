import Link from "next/link";
import LandingHeader from "@/components/LandingHeader";

export const metadata = {
  title: "LaunchStencil — GTM plan for Europe",
  description: "Generate a practical go-to-market plan for Europe in minutes.",
};

const pricingTiers = [
  {
    name: "Base",
    price: "€50",
    detail: "Typical delivery: ~10 minutes",
    extra: null,
    cta: "Start Base",
  },
  {
    name: "Plus",
    price: "€200",
    detail: "Typical delivery: ~10 minutes",
    extra: "Includes follow-up Q&A",
    cta: "Start Plus",
  },
  {
    name: "Pro",
    price: "€500",
    detail: "Delivery: agreed individually",
    extra: "Human review + extended plan",
    cta: "Start Pro",
  },
];

const examples = [
  {
    title: "B2B SaaS for HR teams",
    text: "Positioning: reduce time-to-hire with automated screening. Channels: LinkedIn outbound + partners. First 30 days: build ICP list, run 2 messaging tests, launch 10-customer interviews.",
  },
  {
    title: "Consumer subscription product",
    text: "Segments: busy professionals in major EU cities. Channels: creator partnerships + search. Messaging: 'save time' and 'simple routine'.",
  },
  {
    title: "Marketplace",
    text: "Cold start: supply-first in one city, incentives, and local partnerships. KPI focus: activation and repeat usage.",
  },
];

const faqs = [
  {
    question: "How fast do I get the plan?",
    answer: "Base and Plus are typically ready in about 10 minutes. Pro is agreed individually.",
  },
  {
    question: "Is my result public?",
    answer: "No. We use private access links and technical protection to restrict access.",
  },
  {
    question: "Where is data stored?",
    answer: "Core application data is stored in the EU.",
  },
  {
    question: "Do you store card details?",
    answer:
      "No. Payments are handled by the payment provider. We store only transaction identifiers and status.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-zinc-50">
      <LandingHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6">
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              LaunchStencil
            </p>
            <div className="flex max-w-3xl flex-col gap-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Launch a go-to-market plan for Europe in minutes
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                Answer a short brief. We generate a practical GTM plan you can
                execute — positioning, audience, channels, messaging, and a
                30-day action plan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                href="/start"
              >
                Create my GTM plan
              </Link>
              <Link
                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                href="/pricing"
              >
                See pricing
              </Link>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Built for founders shipping in EU/EEA/UK. No fluff. Actionable steps.
          </p>
        </section>

        <section className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Who this is for</h2>
            <ul className="mt-4 space-y-3 text-zinc-600 dark:text-zinc-300">
              <li>Solo founders and small teams preparing to launch in Europe</li>
              <li>B2B and B2C products that need clear positioning and channels</li>
              <li>Teams that want a plan they can execute this week</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">What you get</h2>
            <ul className="mt-4 space-y-3 text-zinc-600 dark:text-zinc-300">
              <li>Positioning and a clear value proposition</li>
              <li>Target segments and early adopter profile</li>
              <li>Channel strategy (what to test first, and why)</li>
              <li>Messaging angles and offer ideas</li>
              <li>30-day execution plan (week-by-week)</li>
              <li>A private result link + email delivery</li>
            </ul>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Output is generated with the help of automated systems and may
              require human judgement before execution.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              "Choose a plan and submit a short brief",
              "We generate your GTM plan",
              "You get an email with a private access link",
            ].map((step, index) => (
              <li
                key={step}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-300"
              >
                <span className="text-base font-semibold text-zinc-900 dark:text-white">
                  Step {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">Simple pricing</h2>
            <Link
              className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              href="/pricing"
            >
              Full details
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex h-full flex-col justify-between rounded-3xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800"
              >
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {tier.name}
                  </p>
                  <p className="text-3xl font-semibold">{tier.price}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {tier.detail}
                  </p>
                  {tier.extra ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {tier.extra}
                    </p>
                  ) : null}
                </div>
                <Link
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                  href="/start"
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6">
          <h2 className="text-2xl font-semibold">Example outputs (illustrative)</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {examples.map((example) => (
              <div
                key={example.title}
                className="rounded-3xl border border-zinc-200 p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:text-zinc-300"
              >
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {example.title}
                </h3>
                <p className="mt-3">{example.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-2xl font-semibold">FAQ</h2>
            <dl className="mt-6 space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Trust & compliance
            </h2>
            <ul className="mt-4 space-y-3">
              <li>EU data storage for core application data.</li>
              <li>Token-protected access for each result link.</li>
              <li>Email delivery with private access details.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-3xl font-semibold">
            Ready to get your GTM plan?
          </h2>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              href="/start"
            >
              Start the brief
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Questions: support@launchstencil.com
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
