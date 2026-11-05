## Sonus

Sonus is an educational and discovery platform for in-ear monitors (IEMs). It helps listeners understand audio terminology, explore products across brands, and compare specifications and measured frequency responses.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Product Focus

- Beginner-friendly guides to IEM design, fit, and sound.
- A multi-brand showroom with filtering, search, and product details.
- Product and side-by-side comparison views with custom SVG frequency-response graphs.
- Curated ratings, specifications, images, and measurement credits.
- English, Japanese, and Simplified Chinese interface translations.

## Technology

- Next.js 15 App Router, React 19, and strict TypeScript.
- Tailwind CSS v4 with theme tokens and customized shadcn/ui and Radix components.
- Framer Motion, GSAP with ScrollTrigger and ScrollToPlugin, and Lenis for intentional interface motion and scrolling.
- Zustand for shared interface state, Fuse.js for search, and next-themes for theme management.
- Lucide React for interface icons.

## Content and Data

Product and brand information is maintained as local structured content and processed by the content builder into generated JSON. The application reads generated data and local image assets; it does not depend on external runtime APIs. Frequency responses are parsed, resampled, and displayed with Sonus's custom SVG graph implementation.

All product prices are stored and displayed in USD.
