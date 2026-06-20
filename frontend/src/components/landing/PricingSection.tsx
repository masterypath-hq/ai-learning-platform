import Link from "next/link";
import { cn } from "@/lib/utils";

type Feature = { text: string; included: boolean };

const PLANS: {
  id: string;
  name: string;
  badge: string;
  price: string;
  period: string;
  features: Feature[];
  cta: string;
  href: string;
  highlight: boolean;
}[] = [
  {
    id: "starter",
    name: "Starter",
    badge: "FREE",
    price: "$0",
    period: "Forever free",
    features: [
      { text: "5 AI messages per day",    included: true },
      { text: "1 preview course",         included: true },
      { text: "Knowledge checks",         included: true },
      { text: "Basic progress tracking",  included: true },
      { text: "AI memory",                included: false },
      { text: "Module quizzes & finals",  included: false },
      { text: "Certificates",             included: false },
    ],
    cta: "Get started free",
    href: "/sign-up",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "MOST POPULAR",
    price: "$19",
    period: "per month · cancel anytime",
    features: [
      { text: "Unlimited AI message",        included: true },
      { text: "Unlimited course generation", included: true },
      { text: "Full AI memory system",       included: true },
      { text: "Module quizzes & finals",     included: true },
      { text: "Branded PDF certificates",    included: true },
      { text: "AI voice calls",              included: true },
      { text: "Spaced repetition engine",    included: true },
    ],
    cta: "Start with pro",
    href: "/sign-up?plan=pro",
    highlight: true,
  },
  {
    id: "teams",
    name: "Teams",
    badge: "INSTITUTIONS",
    price: "$99",
    period: "per month · up to 30 users",
    features: [
      { text: "Everything in Pro",              included: true },
      { text: "Up to 30 learner seats",         included: true },
      { text: "Admin dashboard",                included: true },
      { text: "Per-learner progress report",    included: true },
      { text: "Custom syllabuses",              included: true },
      { text: "Institution-branded certs",      included: true },
      { text: "Dedicated Slack support",        included: true },
    ],
    cta: "Contact us",
    href: "/contact",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-[#EBE1CF]">
      <div className="mx-auto max-w-315.5 px-6 flex flex-col gap-20">

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center mx-auto max-w-[488px]">
          <p className="font-syne font-normal text-2xl uppercase tracking-widest text-teal">
            Pricing
          </p>
          <h2 className="font-cormorant text-[52px] font-medium leading-[1.08] text-black">
            Simple{" "}
            <span className="font-cormorant italic text-teal">
              pricing.
            </span>
            <br />
            No surprises.
          </h2>
        </div>

        {/* Plans grid */}
        <div className="mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1081px]">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-[20px] px-5 py-10",
                plan.highlight
                  ? "bg-teal"
                  : "bg-white border border-[#E2DDD4]"
              )}
            >
              {/* Badge */}
              <div className="mb-5">
                <span className={cn(
                  "font-syne font-normal rounded-full inline-flex items-center px-4 h-9.25 text-[11px] tracking-[0.08em]",
                  plan.highlight
                    ? "bg-off-white/50 text-white/85"
                    : "bg-off-white text-[#6B7280] border border-[#E2DDD4]"
                )}>
                  {plan.badge}
                </span>
              </div>

              {/* Plan name */}
              <p className={cn(
                "font-syne font-normal mb-2 text-base",
                plan.highlight ? "text-white/70" : "text-stone"
              )}>
                {plan.name}
              </p>

              {/* Price */}
              <p className={cn(
                "font-cormorant font-semibold leading-none mb-1 text-[52px]",
                plan.highlight ? "text-white" : "text-black"
              )}>
                {plan.price}
              </p>

              {/* Period */}
              <p className={cn(
                "font-syne font-normal mb-6 text-[13px]",
                plan.highlight ? "text-white/55" : "text-stone"
              )}>
                {plan.period}
              </p>

              {/* Divider */}
              <div className={cn(
                "mb-5 border-t-[0.5px]",
                plan.highlight ? "border-white/20" : "border-[#E2DDD4]"
              )} />

              {/* Features */}
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5">
                    <span className={cn(
                      "font-syne font-normal shrink-0 text-[13px]",
                      f.included
                        ? (plan.highlight ? "text-teal-light" : "text-teal")
                        : (plan.highlight ? "text-white/30" : "text-silver")
                    )}>
                      {f.included ? "✓" : "✗"}
                    </span>
                    <span className={cn(
                      "font-syne font-normal text-sm",
                      f.included
                        ? (plan.highlight ? "text-white/90" : "text-charcoal")
                        : (plan.highlight ? "text-white/30" : "text-silver")
                    )}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={cn(
                  "block font-syne font-normal text-center transition-colors text-base py-3 px-6",
                  plan.highlight ? "bg-white text-teal" : "bg-teal text-blush"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
