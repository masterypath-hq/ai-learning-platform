import Link from "next/link";

const LINKS = {
  Product: [
    { label: "How it works",        href: "#how-it-works" },
    { label: "Features tracks",     href: "#tracks" },
    { label: "Programming tracks",  href: "#tracks" },
    { label: "Pricing",             href: "#pricing" },
  ],
  Company: [
    { label: "About",    href: "/about" },
    { label: "Careers",  href: "/careers" },
    { label: "Blog",     href: "/blog" },
    { label: "Contact",  href: "/contact" },
  ],
  Legal: [
    { label: "Privacy policy",  href: "/privacy" },
    { label: "Terms of service",href: "/terms" },
    { label: "Cookie policy",   href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="py-20 bg-cream">
      <div className="mx-auto max-w-315.5 px-6 flex flex-col gap-12">

        {/* Main row */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start gap-x-[50.5px]">

          {/* Brand */}
          <div className="flex flex-col flex-1 gap-6 pt-[50.5px]">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-md font-syne font-semibold text-white shrink-0 w-[29px] h-[29px] bg-teal text-[13px]">
                M
              </span>
              <span className="font-syne font-semibold text-base text-[#111111]">
                MasteryPath
              </span>
            </div>
            <p className="font-syne font-normal text-lg text-[#030303] max-w-[424px] leading-6">
              From zero to mastery — one AI, one platform, every subject that matters
              for your career and wealth.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 shrink-0 gap-8">
            {Object.entries(LINKS).map(([col, items]) => (
              <div key={col} className="flex flex-col gap-4">
                <p className="font-cormorant text-2xl font-semibold text-black">
                  {col}
                </p>
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="font-syne font-normal text-sm text-charcoal transition-colors hover:text-teal"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t-[0.5px] border-silver pt-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start gap-x-12">
            <div className="flex-1">
              <p className="font-syne font-normal text-xs text-stone">
                © 2026 MasteryPath. All rights reserved.
              </p>
            </div>
            <div className="shrink-0">
              <p className="font-syne font-normal text-xs leading-relaxed text-stone">
                Finance content is for educational purposes only and does not constitute financial advice.
                Trading involves risk. Past performance is not indicative of future results.
              </p>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
