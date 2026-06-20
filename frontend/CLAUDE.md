# MasteryPath — CLAUDE.md

> Living knowledge base. Update after every meaningful task. Keep under 200 lines.

## Vision
AI-driven adaptive learning platform. 4 fixed tracks → AI-generated curriculum → interactive session with streaming AI tutor + visual curriculum map.

## Stack
Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · Supabase Auth (`@supabase/ssr`) · Zustand (UI/session state) · TanStack Query v5 (server state) · React Hook Form + Zod v4 · SSE streaming (EventSource) · Lucide React · Sonner

## The 4 MVP Tracks (Fixed — Never Change Without Explicit Instruction)
`python` · `ai-engineering` · `forex` · `stocks`
Every Zod schema touching track selection must use exactly these 4 IDs.

---

## What's Been Built (Session 1)
Full scaffold from empty directory. All files listed below exist and type-check clean.

**Config:** `package.json`, `tsconfig.json`, `next.config.ts` (`outputFileTracingRoot` set), `postcss.config.mjs`, `.env.local` (placeholders), `.gitignore`

**Core:** `src/app/globals.css` (Tailwind v4 `@theme` tokens + landing palette) · `src/lib/utils.ts` · `src/types/learning.ts` + `api.ts` + `global.d.ts` (CSS module declaration) · `src/app/layout.tsx` (Inter + Lora fonts) · `providers.tsx` · `page.tsx` (landing page)

**Supabase:** `src/lib/supabase/client.ts` · `server.ts` · `middleware.ts` · root `middleware.ts` (protects /dashboard, /session, /new-journey)

**API client:** `src/lib/api/client.ts` — typed fetch wrapper, `getLearningPaths`, `getSession`, `generateCurriculum`, `buildChatStreamUrl`

**Stores:** `ui-store.ts` (sidebar) · `chat-store.ts` (SSE stream buffer) · `session-store.ts` (progress markers)

**Hooks:** `use-learning-paths` · `use-session` · `use-generate-curriculum` · `use-chat-stream` (EventSource, streams to chat-store)

**Auth:** `SignInForm.tsx` · `SignUpForm.tsx` · `/sign-in` · `/sign-up` pages

**Dashboard:** `(dashboard)/layout.tsx` · `dashboard/page.tsx` + `DashboardClient.tsx` · `PathCard.tsx` · `Sidebar.tsx` (collapsible)

**New Journey:** `JourneyWizard.tsx` (3-step stepper) · `TrackSelector.tsx` · `GoalForm.tsx` · `ScheduleForm.tsx` · `/new-journey/page.tsx`

**Session:** `session/[sessionId]/page.tsx` · `SessionLayout.tsx` · `CurriculumMap.tsx` · `ChatPanel.tsx` · `ChatMessage.tsx` + `StreamingMessage.tsx`

---

## Architectural Rules

**State split:** Zustand = sidebar, chat buffer, SSE stream, optimistic progress. TanStack Query = paths list, session data, mutations. Never mix.

**Dashboard UI (light theme, brand palette — NOT the dark `--color-*` vars):** Rebuilt from Figma on the cream/teal palette. All dark-green surfaces (sidebar, hero, "Done" module cards) are `bg-teal` (#21494A — Figma "primary"). Sidebar (per Figma): `w-[266px]`, `border border-[#DFE3FF]`, `py-6`, vertical `justify-between` (logo+nav top, user card bottom). Components in `src/components/dashboard/`: `Sidebar` (nav sections Overview/Review/Settings + Log out + user card; no collapse yet), `DashboardTopbar` (search + bell/mail + user — in the layout, persistent), `WelcomeHero` (forest card + 3 stat tiles), `ActiveTrackBar`, `ModuleCard` (done/in-progress/locked states) + grid, `RecentActivity` (timeline). Layout = `bg-cream`, sidebar + (topbar + scrollable `<main>`). All data is static placeholder pending the dashboard-flow endpoint. Old `DashboardClient.tsx` + `PathCard.tsx` + `use-learning-paths` are now orphaned (unused) — remove when wiring real data. The abandoned dark-theme `--color-background/surface/accent` (purple) tokens in globals are unused by the dashboard now.

**Auth guard (NOT Supabase/middleware):** Protected routes are guarded client-side by `src/components/auth/AuthGuard.tsx` — it checks `localStorage.access_token` and redirects to `/sign-in` if missing. The root `middleware.ts` and all Supabase auth calls were REMOVED from the dashboard group (they can't read a localStorage JWT). Sign-out clears the tokens. The `src/lib/supabase/*` files still exist but are unused. ⚠️ `session/[sessionId]/page.tsx` still imports Supabase server + does server-side token fetch — it 500s if visited; deferred until the session feature is rebuilt from Figma.

**SSE pattern:** One EventSource per submission. Tokens → `appendStreamToken()`. On `[DONE]` or error → `finalizeStream()` → persists as ChatMessage.

**Zod v4:** Use `message:` not `required_error:` — the latter no longer exists in Zod v4.

**Tailwind v4 canonical classes:** `@theme` tokens auto-generate utilities. Always use `bg-accent`, `text-text-primary`, `border-border`, `bg-surface`, `bg-surface-raised`. Never use `bg-[var(--color-accent)]` etc. — redundant and triggers IDE warnings.

**Button + links:** `Button` has no `asChild`. For link-buttons: `className={buttonVariants({ variant, size })}` on `<Link>`.

**Routes:** `/` → landing page (public) · `/sign-in` · `/sign-up` · `/forgot-password` · `/auth/callback/[provider]` (OAuth) · `/onboarding` (post-signup subject selection) · `/dashboard` · `/new-journey` · `/session/[id]`

**Onboarding flow:** After sign-up the user goes to `/onboarding` (NOT straight to dashboard) — `useSignUp` redirects there. A single client flow `src/components/onboarding/OnboardingFlow.tsx` manages step state + selections and swaps BOTH panels per step. Steps: subject → level → building → `/dashboard`.
- **subject** (`SubjectSelection.tsx`): 2 category cards → dynamic course list → "Choose this track". Left = `auth2.png`, "One track. Full mastery.", Step 2 of 4.
- **level** (`SkillLevel.tsx`): 2×2 skill-level cards + "Quick calibration" quiz card → "Build my curriculum". Left = `auth1.png`, "Your AI will adapt to you.", Step 3 of 4.
- **building** (`BuildingCurriculum.tsx`): centered spinner + "Building your curriculum……" + 4-item checklist; auto-advances to `/dashboard` after a simulated 3.8s timeout.
- Shared `RadioDot.tsx` selection indicator.
⚠️ Placeholders pending backend/Figma confirmation: course set is broader than the 4 MVP tracks; the skill-level + calibration question are static (calibration should be subject-driven); build steps are hardcoded (should stream from the build endpoint); the 3.8s timeout stands in for the real build call. Figma's step-3 header/button still said "Choose your subject"/"Choose this track" (leftovers) — replaced with fitting copy ("How well do you know it?" / "Build my curriculum"). Steps 3–4 left image assumed `auth1.png` (matches sign-in visual + "Your AI" headline).

**Auth API (custom backend, NOT Supabase):** All auth goes through `src/lib/api/auth.ts` (axios) → `https://masterypath-auth-service.onrender.com`, prefix `/api/v1/auth/...`. Endpoints: `sign-up`, `sign-in`, `forgot-password`, `reset-password`, `{provider}/exchange` (OAuth). Tokens stored in `localStorage` (`access_token` / `refresh_token`); axios request interceptor attaches the Bearer token. Each endpoint has a TanStack Query mutation hook in `src/hooks/use-*.ts`. The old Supabase auth calls in the forms were replaced — Supabase scaffolding still exists for the dashboard but is unused/placeholder.

**Landing page palette** (light theme — separate from app dark theme):
- BG: `#EDE8DC` · Green: `#1B3829` · Text: `#111111` · Muted: `#6B7280` · Card: `#FFFFFF` · Border: `#E2DDD4`
- Lora italic via `.lp-serif` utility class — used for decorative heading words (Zero, broken, mastery.)
- Landing uses arbitrary Tailwind values (`bg-[#EDE8DC]`) — `@theme` canonical classes are for the app dark theme only

**Landing page tracks vs MVP:** Landing page shows 6 demo tracks for marketing. The real app enforces only 4 MVP tracks (`python`, `ai-engineering`, `forex`, `stocks`).

## What's Been Built (Session 2)
Landing page (`src/components/landing/`): `Navbar.tsx` (sticky, scroll-aware, mobile menu) · `HeroSection.tsx` (badge, clamp headline, product mockup, floating cards) · `StatsBar.tsx` (dark green, 4 stats) · `ProblemSection.tsx` (6 comparison cards, MasteryPath highlighted) · `HowItWorksSection.tsx` (4 step cards) · `TracksSection.tsx` (client — filter tabs + 6 track cards) · `MemorySection.tsx` (split layout + memory card mockup) · `PricingSection.tsx` (3 tiers, dark bg, radial glow) · `CTABanner.tsx` · `Footer.tsx` (4-col, disclaimer)

---

## Auth Page Design Specs (`/sign-up`, `/sign-in`)

**Left panel image:** Must fill full height. Use `h-screen overflow-hidden` on `<main>` and no explicit `h-full` on the panel — flex stretching handles it. Add `overflow-y-auto` to the right/form panel so the form scrolls on short viewports.

**"Back to website" button:** `w-[168px] h-[46px] bg-charcoal` (`#3B3B3B`), no border, no rounded corners (`rounded-none`), no backdrop blur. White text `text-sm`. Size is Figma "168 Hug × 46".

**"Create your account" heading:** Cormorant Garamond (`font-cormorant`), `font-semibold`, `text-[28px]`, `text-teal` (`#21494A`). NOT Inter/Syne, NOT `text-[#111111]`.

**"Already have an account?" subtext:** Syne (default body font — no extra class needed), `font-normal`, `text-base` (16px), `text-charcoal` (`#3B3B3B`). NOT `text-sm`, NOT `text-[#6B7280]`.

**OAuth buttons ("Continue with Google/Github"):** `text-sm font-normal text-black`. NOT `text-[#111111]` — color is pure `#000000` = `text-black`.

**"or continue with email" divider:** `<span>` element (plain text, NOT a button), `text-sm font-normal text-stone tracking-[0.04em]`. Color is `#8B8B8B` = `text-stone`. Letter-spacing 4% = `tracking-[0.04em]` (0.04em at 14px = 0.56px).

**"Log in" inline link:** Same font/size, `text-teal-dark` (`#084243`). NOT `text-[#111111]`.

**Right panel background:** Both the right panel AND the form card use `bg-cream` (`#F4F0E9`). There is NO separate white card — the form area shares the same background as the panel. The Input components' `--color-surface` override stays `#FFFFFF` so input fields appear white against the cream background. The form card has NO padding (`px-10 py-10` removed) — all spacing comes from the outer centering wrapper (`pt-[44px] pb-[120px] px-6 lg:px-[64px]`).

**X / close button:** `h-8 w-8 rounded-full bg-[#F5F5F5]` (circle always visible, NOT just on hover). X icon: `text-charcoal` (`#3B3B3B`), `h-4 w-4`. Positioned `absolute top-0 right-0` on the form card. Header div needs `pr-10` so the heading text doesn't overlap the absolute X button.

**Right panel spacing (Figma exact):** The right panel must be a bare `flex-1 overflow-y-auto bg-cream` scroll container wrapping an inner `flex min-h-full items-center justify-center pt-[44px] pb-[120px] px-6 lg:px-[64px]` centering div. The 44px top / 120px bottom come directly from Figma. Never collapse these two divs into one — `items-center` on an `overflow-y-auto` container clips the top when content overflows.

**Color canonical classes:** `#21494A` → `text-teal` / `bg-teal` · `#084243` → `text-teal-dark` · `#3B3B3B` → `text-charcoal`. Always prefer canonical class over arbitrary hex. The IDE linter (`suggestCanonicalClasses`) will warn if you use arbitrary hex values for colors already in `@theme`.

---

## Design & UI Rules

**Screenshot comparison (mandatory):** When building or updating any UI component from a Figma screenshot, keep iterating and comparing until the implementation is **≥90% visually accurate** to the reference. Do not mark UI work done below this threshold.

**No creative liberty:** Follow Figma exactly. Only deviate to fix a functional UX flaw.

**Fluid design:** Use `clamp()` for all font sizes and spacing. Audit at 768px, 1024px, 1440px. Target <3px variance from Figma at each breakpoint.

**Responsive by default (ENFORCED — every screen, every new feature):** Build mobile-first. Base classes target mobile; layer `sm: md: lg: xl:` to scale up. Verify at 375px, 768px, 1024px, 1440px before marking UI done.
- **Padding:** responsive, never a single fixed value on page containers — `px-4 sm:px-6 lg:px-8`.
- **Grids reflow:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 …`. Never a fixed `grid-cols-N` that overflows narrow screens. Drop fixed `min-w` that causes horizontal overflow on mobile (gate it behind `lg:` if needed).
- **No horizontal scroll** on the page at any width. Use `flex-wrap` on rows that would overflow.
- **Two-panel layouts** (auth, onboarding): hide the decorative left panel on mobile (`hidden lg:flex`); the form/content panel is full-width.
- **Dashboard nav:** fixed rail on `md+` (`hidden md:flex`); off-canvas **drawer** on mobile (hamburger in `DashboardTopbar` → `useUIStore.mobileNavOpen`, backdrop + slide-in `aside`, links close the drawer via `onNavigate`). `Sidebar` shares one `SidebarContent` between rail and drawer.
- Hide non-essential topbar items on small screens (`hidden sm:flex` / `hidden sm:inline`).

**Component states:** Every interactive element must implement Hover, Active, Focus, and Loading. Use `tailwindcss-animate` for transitions.

**Session page:** AI Chat is the primary focal point. Curriculum map is secondary. On mobile, curriculum map is hidden (`hidden md:flex`) or behind a toggle.

**Overflow:** Code snippets and financial data strings (e.g. `EUR/USD 1.08432`) must not break layout — handle horizontal overflow cleanly.

---

## Coding Standards (Enforced — Never Violate)

**No inline styles:** NEVER use `style={{...}}` for static values. Every style must be a Tailwind class. The only exception is truly dynamic runtime values (e.g. `style={{ width: \`${pct}%\` }}` for a progress bar).

**Auth theme override pattern:** Auth forms need light-theme CSS tokens. Do NOT use `style={{ "--color-border": "..." } as React.CSSProperties}`. Instead, add a `data-theme="auth"` attribute on the wrapper and define the overrides in `globals.css` under `[data-theme="auth"]`. This is already set up — just use `data-theme="auth"`.

**Complex multi-gradient backgrounds:** Cannot be expressed as a single Tailwind utility. Add named utility classes (e.g. `.cta-glow-1`) to `globals.css` under `@layer utilities`. Use modern `rgb(r g b / a%)` syntax instead of `rgba()`.

**Tailwind opacity modifiers:** Use `text-white/75` not `rgba(255,255,255,0.75)`. Use `bg-white/15` not `rgba(255,255,255,0.15)`. Always prefer opacity modifier shorthand.

**Tailwind scale over arbitrary values:** Use scale equivalents where they exist exactly — `min-h-5` (20px), `w-8 h-8` (32px), `p-6` (24px), `text-sm` (14px), `text-xl` (20px), `text-2xl` (24px), `text-5xl` (48px), `min-h-48` (192px). Use `text-[52px]` only when no scale match exists.

**WebkitLineClamp:** Never use `style={{ WebkitLineClamp: 3 }}`. Use Tailwind's `line-clamp-3` utility instead.

**React keys:** Never use array index as a React `key`. Static placeholder arrays use stable string keys (e.g. `["sk-a", "sk-b", "sk-c"]`). Data arrays must have an `id` field on every object and use `key={item.id}`.

**Static data:** All static arrays and config objects (STEPS, PLANS, TRACKS, STATS, etc.) must be declared at module level — never inside a component function body.

**Semantic HTML:** Use `<section>`, `<ul>/<li>`, `<nav>`, `<header>`, `<footer>` over generic `<div>` stacks.

**Conditional classes:** Use `cn()` from `@/lib/utils` for conditional className logic. Never compute class strings with template literals or ternaries directly on the className prop without `cn`.

**`h-auto` on Next.js Image:** Never use `style={{ height: "auto" }}` on `<Image>`. Use `className="h-auto"` instead.

---

## Pending / Deferred

| Item | Blocked by |
|---|---|
| Landing page pixel-perfect refinement pass | Needs user to view at http://localhost:3001 and compare |
| App dark theme color tokens, typography, spacing | Figma screenshots for dashboard/session pages |
| Remaining API endpoints (course, session, etc.) | Co-founder's API — auth service done |
| SSE auth mechanism (query param vs header) | Co-founder's API spec |
| Visual curriculum map design | Figma |
| `tailwindcss-animate` transitions | Design pass |
| Fluid `clamp()` typography pass | Figma screenshots |
| Mobile curriculum map toggle | Design pass |

---

## Known Issues
- **Port 3001:** Port 3000 is occupied on this machine. Dev server auto-selects 3001.
- **Parent lockfile:** `C:\Users\pc\package-lock.json` belongs to a different project — do not delete. `outputFileTracingRoot` in `next.config.ts` suppresses the Next.js warning.
- **Manual scaffold:** `create-next-app` rejected the folder name (capital letters). Project was scaffolded by hand — intentional.
