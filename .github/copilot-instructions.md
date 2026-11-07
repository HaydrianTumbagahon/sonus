# RULES FOR EVERY TASK IN THIS PROJECT (save them, see Step 1)
- Never ask me questions. If something is unclear, use what is written in the task; if it is
	not covered, choose the simplest option that matches the existing design and mention it in
	one line at the end.
- Do exactly what a task says and nothing more. Never refactor, rename, reformat, restyle,
	reorder or delete anything outside the task. Never delete a file unless I name it.
- Edit files in place and reuse existing components, tokens, fonts and helpers.
- Never edit anything inside content/ (info.json files, images, .txt files, glossary.json,
	glossary-images) unless a task says so. Never edit generated/ by hand.
- Do not run npm run build, npm run lint or the dev server. Allowed: `npm run build-content`
	when a task says so, and `npx tsc --noEmit` once at the end of a task.
- Install nothing without asking. Every import must be present. Any file using hooks, Framer
	Motion, event handlers or browser APIs starts with "use client". app/error.tsx,
	app/global-error.tsx and route error.tsx files must be Client Components. Pages
	default-export a component.
- Colors: CSS tokens only, never hardcoded colors, never className="dark" wrappers. Anton font
	is weight 400 only, never font-bold or font-semibold on Anton text.
- All UI text goes through t() with entries in messages/en.json, jp.json, cn.json. Delete
	translation keys that become unused.
- Reply with the file list only, plus one-line notes.

Read docs/CONTEXT.md before every task. Everything listed under PROTECTED BUILD must not change unless the task names that exact area.

# Sonus Project Instructions

- Approved stack only: Next.js 15 (App Router), TypeScript strict, React 19, Tailwind CSS v4 (CSS variables mapped via `@theme`, no `tailwind.config`), customized shadcn/ui, Vaul, Radix primitives, Framer Motion, GSAP + ScrollTrigger, Lenis, Zustand, Fuse.js, next-themes, Lucide React, clsx, tailwind-merge, class-variance-authority, and tsx (dev). Use Zustand for UI state and `compareList`; use React Context for Language, Currency, and Theme. Do not install any other library without asking first.
- Do not upgrade Next.js beyond 15.
- No external APIs or network calls at runtime in v1. Prices are USD only.
- The frequency graph is a custom SVG component. Do not use Recharts or D3.
- Fonts: Geist Sans (primary), Geist Mono (specs and numbers), with Noto Sans JP and Noto Sans SC fallbacks for Japanese and Chinese.
- Design: modern, slick, minimal, and premium. Use a high-contrast black/white foundation with dark gray and dark blue accents. Motion is intentional and fluid, never decorative. Never hardcode colors in UI; use CSS-variable tokens only.
- Color tokens: Light: `--background: #FFFFFF`, `--surface: #F7F7F8`, `--surface-subtle: #F0F0F2`, `--border: #E4E4E7`, `--text-primary: #09090B`, `--text-secondary: #52525B`, `--text-tertiary: #71717A`, `--accent: #1E3A5F`, `--accent-hover: #172554`, `--accent-muted: #EFF6FF`. Dark: `--background: #0A0A0B`, `--surface: #141416`, `--surface-subtle: #1C1C1F`, `--border: #27272A`, `--text-primary: #FAFAFA`, `--text-secondary: #A1A1AA`, `--text-tertiary: #71717A`, `--accent: #3B82F6`, `--accent-hover: #60A5FA`, `--accent-muted: #1E3A5F`. Provide readable `--graph-1` through `--graph-6` line colors in both themes.
- Mobile-first, responsive from 320px to 4K; touch targets must be at least 44px. Respect `prefers-reduced-motion` everywhere.
- All UI strings must go through the translation function `t()` (`en`/`jp`/`cn`).
- Store all prices in USD and display them only via `formatPrice()` from CurrencyProvider.
- Prefer Server Components; add `"use client"` only when needed.
- Accessibility: semantic HTML, ARIA, keyboard navigation, visible focus states, and WCAG AA contrast.
- Settings cover Language (EN/JP/CN), Currency (USD), and Theme (Light/Dark). Present Settings as a desktop slide-over and a mobile bottom sheet; persist choices in localStorage and a cookie.
- Routes: `/`, `/learn`, `/learn/[slug]`, `/showroom`, `/iem/[slug]`, `/brand/[slug]`, `/compare`, and `/settings`.
- The site only reads `generated/iems.json` and `generated/brands.json`, produced from `content/` by `scripts/build-content.ts` (run via `build-content`, `predev`, and `prebuild`). Never read `content/` directly from the site.
- Content pipeline: `content/brand-roster.json` lists 11 brands: 7Hz (`7hz`, live), then Dunu, FiiO, Kinera, Kiwi Ears, KZ, Moondrop, Simgot, Tanchjim, Tangzu, and Truthear (coming soon). Letshuoer is not part of the site. Process only live brands. Coming-soon brands have placeholder cards and brand pages with skeleton IEM cards, ready to use real content when their folder is added and status changes to live.
- Content folders: `content/<brand-slug>/brand.json`, optional `logo.*`, and `content/<brand-slug>/<iem-folder>/` with `info.json`, images, and two `.txt` frequency files. `info.json` must not define `id`, `slug`, or `brand`; the builder sets `slug` to `<brand-slug>-<iem-folder>`.
- The builder copies images to `public/iems/<brand-slug>/<iem-folder>/`. Use `hero.*` as hero when present, otherwise the alphabetically first image; remaining images form the gallery.
- Frequency files use squig.link text data. `(1)` marks LEFT and `(2)` marks RIGHT. Parse tabs, commas, or spaces; skip headers and non-numeric lines. Resample each channel to 200 logarithmically spaced points from 20 Hz to 20 kHz using linear interpolation in log-frequency, average left and right dB, then round frequency to 1 decimal and dB to 2. Do not normalize stored data; graph normalization is a UI toggle defaulting to the 1 kHz reference. `measuredBy` credit is optional per IEM.
- Missing hero, missing frequency data, bad ratings, and duplicate slugs are warnings and must not fail the build; unparseable JSON does fail it.
- Runtime exception: Learn page visual containers may load freely licensed diagram images from `upload.wikimedia.org` and `commons.wikimedia.org`.
- Work in small steps. After each task, list files created/changed and wait. Do not add features that were not asked for.
- Read `docs/SPEC.md` before starting any task.