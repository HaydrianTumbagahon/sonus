PROJECT
"Sonus" is a free, independent educational and discovery site for in-ear monitors (IEMs).
Audience: beginners and enthusiasts. It teaches (Learn glossary), showcases (Showroom), and
compares IEMs with accurate squig.link-style frequency graphs. It is not a store. Created by
Hades.

STACK (approved only)
Next.js 15 App Router (never upgrade past 15), React 19, TypeScript strict, Tailwind CSS v4
with CSS variables via @theme (no tailwind.config), shadcn/ui, Radix, Framer Motion, GSAP
(ScrollTrigger, ScrollToPlugin), Lenis, Zustand, Fuse.js, next-themes, Lucide React, clsx,
tailwind-merge, class-variance-authority, tsx (dev). Fonts: Geist Sans, Geist Mono, Noto Sans
JP/SC fallbacks, Anton (weight "400" only), Caveat (weight 700). No chart library: the
frequency graph is a custom SVG. USD prices only. No runtime API calls, with ONE exception:
Learn diagram images may load from upload.wikimedia.org / commons.wikimedia.org.

DESIGN SYSTEM
- Modern, minimal, premium. Light and dark themes via next-themes, switched live.
- Core tokens (use the real values in app/globals.css): --background, --surface,
  --surface-subtle, --border, --text-primary, --text-secondary, --text-tertiary, --accent,
  --accent-hover, --accent-muted. Brand tokens: --brand (light #60A5FA, dark #1D4ED8),
  --brand-hover, --brand-text, --on-brand (dark navy in light mode, white in dark mode),
  --brand-outline. Others: --compare-1..6, --graph-1..6, --graph-line-on-brand, --logo-tile
  (#FFFFFF both themes), --header-offset, --wave-h (48px mobile, 96px from 768px).
- Signature look: solid blue sections with curved blue edges (WaveEdge), slanted uppercase
  Anton headings (skewX(-12deg), line-height 0.9, offset text-shadow), Caveat script accents
  where they still exist, big hollow outlined words (transparent fill, 2px stroke) behind
  banner titles, plain arrow icons with NO circle behind them, hidden native scrollbars with
  a top progress bar and a right scroll thumb (ScrollIndicators), ScrollToTop button, bounce
  scroll (lib/scroll.ts), ScrollReset so every navigation opens at the top.
- Mobile-first, touch targets >= 44px, prefers-reduced-motion respected everywhere.

CONTENT PIPELINE (never alter its behavior)
- I author content/. The site only reads generated/iems.json, brands.json, targets.json and
  glossary.json produced by scripts/build-content.ts (npm "build-content", also run as
  predev and prebuild).
- content/brand-roster.json: 11 brands, ALL "live": 7Hz, Dunu, FiiO, Kinera, Kiwi Ears, KZ,
  Moondrop, Simgot, Tanchjim, Tangzu, Truthear. Each brand: content/<slug>/brand.json,
  logo.*, and IEM folders with info.json, images and two .txt files. slug =
  <brand-slug>-<folder>. Folder names lowercase-with-hyphens.
- Graph data: the .txt with "(1)" is LEFT, "(2)" is RIGHT, resampled to 480 log-spaced points
  20 Hz to 20 kHz; frData is the L/R average. content/targets/*.txt become targets.json.
- Glossary: content/glossary.json becomes generated/glossary.json. Online diagrams come from
  data/glossaryImages.ts (Wikimedia, credited). My own images live in
  content/glossary-images/ named <term-slug>.<ext> (extra: <term-slug>-2.<ext>) and are copied
  to public/glossary/. Own images win over Wikimedia and show no credit line.
- Ratings (build, value, sound) are decimals 0 to 10.

PROTECTED BUILD (do not change unless a task names the exact area)
- HEADER: floating pill island with sliding hover highlight, magnetic hover, press ripple,
  custom logo; collapses into a half-circle chevron tab (iOS-style suck-in), reopens on hover
  or click (desktop) or swipe down at top (mobile) with a springy bounce. Mobile floating
  bottom dock. Settings panel: language EN/JP/CN, currency USD, theme.
- HOME (top to bottom): Hero (black/white left, big blue blob with wavy S-curve on the right,
  Caveat "Find your", huge slanted "SOUND", "one earphone at a time" directly under SOUND
  left-aligned, "View catalog" pill to /showroom, random 5-IEM slider with no container, ONLY
  a thin ring circle behind the IEM, price callout with curved arrow raised, outline slide
  counter, centered on mobile). TOP 5 TODAY (solid --brand, no script line, one IEM per slide
  with scroll-snap, mouse drag and dots, no blobs or number behind IEMs, curved edges top and
  bottom, daily lineup from lib/daily.ts). THE BRANDS (circle logo tiles in a seamless
  looping drag carousel that does not pause on hover, no script line). READ THE CURVE (solid
  --brand, no script line, no paragraph, white graph lines with dark labels via
  FrequencyGraph variant="onBrand", three call-outs that highlight a zone on hover, "Learn
  more" button to /learn). "Ready to hear what fits" call-to-action band. Footer.
- FOOTER: solid --brand, diagonal WaveLines texture, slanted "SONUS" title, stats strip,
  columns Explore and Brands plus three links About / Terms & Conditions / Privacy (no
  heading, no blurb), bottom bar "© {year} Sonus" and "Created by Hades". No circles, no
  settings buttons, no back-to-top link.
- BANNERS on /learn, /showroom, /compare: PageBand tone="brand", flat solid blue box with the
  title (Anton, slanted, text on --on-brand), hollow outlined word behind it (LEARN,
  SHOWROOM, COMPARE), and a blue curve that hangs OUTSIDE the box below it; first content
  below has padding-top var(--wave-h). Other pages use PageBand tone="plain".
- SHOWROOM: title only, no container around filters, four custom dropdowns (Brand with logo,
  name and count; Price; Driver type; Tier), random default order per visit, filters synced
  to the URL. IEM card: image, name, brand, price, small centered "View details" button;
  only the image zooms on hover; details popup is centered, fixed size, blurred backdrop,
  locks page scroll, plain X, morph animation.
- COMPARE: two plus-icon slots (no VS, no labels), picker popup, text-only "Compare" button,
  side-by-side results for 2 to 6 IEMs, swipeable details, one shared graph with legend and
  Add IEM, caption "Normalized to 60 dB at 1 kHz" shown once, mobile single-container layout.
- GRAPH: custom SVG, always normalized to 60 dB at 1 kHz (no toggle), zones, left-to-right
  draw-in, complete axis numbers, L darker than R.
- LEARN: PageBand banner, non-sticky category buttons, one card opens at a time (grid
  items-start), no empty "Related terms" block, example IEMs picked automatically, faint
  WaveLines textures behind the three category sections.
- BRAND PAGES: name, description, count, then the IEM grid (no logo tile).
- ABOUT, TERMS, PRIVACY pages with the final text; ratings shown as numbers "8.5 /10"; all 11
  brands live.