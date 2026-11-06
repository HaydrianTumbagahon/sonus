import Link from "next/link";
import { cookies } from "next/headers";
import { FooterReveal } from "@/components/layout/FooterReveal";
import { WaveEdge } from "@/components/home/WaveEdge";
import { WaveLines } from "@/components/layout/WaveLines";
import { getAllBrands, getAllIEMs } from "@/lib/data";
import en from "@/messages/en.json";
import jp from "@/messages/jp.json";
import cn from "@/messages/cn.json";

type FooterMessages = {
  footer: Record<string, string>;
  nav: Record<string, string>;
};

const dictionaries = { en: en as FooterMessages, jp: jp as FooterMessages, cn: cn as FooterMessages };

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-11 w-fit items-center text-sm transition-colors [color:color-mix(in_srgb,var(--on-brand)_85%,transparent)] hover:[color:var(--on-brand)] focus-visible:outline-[var(--on-brand)] focus-visible:outline-offset-4"
    >
      <span className="relative">
        {children}
        <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-on-brand transition-transform duration-200 group-hover:scale-x-100 motion-reduce:transition-none" />
      </span>
    </Link>
  );
}

export async function Footer() {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("sonus-lang")?.value;
  const lang = langCookie === "jp" || langCookie === "cn" ? langCookie : "en";
  const footer = dictionaries[lang].footer;
  const nav = dictionaries[lang].nav;

  const iems = getAllIEMs();
  const liveBrands = getAllBrands().filter((brand) => brand.status === "live");
  const graphCount = iems.filter((iem) => iem.frData && iem.frData.length > 0).length;
  const year = new Date().getFullYear();

  return (
    <footer aria-label={footer.about} className="relative isolate pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-6" style={{ background: "var(--brand)", border: 0, boxShadow: "none", margin: 0 }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <WaveLines variant="footer" />
      </div>
      <WaveEdge position="top" variant={1} />

      <div className="relative z-[1] mx-auto max-w-[1280px] px-4 sm:px-6">
        <FooterReveal index={0} className="pt-10">
          <h2 className="text-[clamp(40px,6vw,72px)] uppercase leading-[0.9] [transform:skewX(-12deg)] [font-family:var(--font-anton),var(--font-family-sans)]" style={{ color: "var(--on-brand)", textShadow: "4px 4px 0 color-mix(in srgb, var(--on-brand) 25%, transparent)" }}>
            {footer.title}
          </h2>
        </FooterReveal>

        <FooterReveal index={1} className="mt-8 grid grid-cols-3 border-y py-6" style={{ borderColor: "color-mix(in srgb, var(--on-brand) 25%, transparent)" }}>
          {[
            { value: iems.length, label: footer.statIems },
            { value: liveBrands.length, label: footer.statBrands },
            { value: graphCount, label: footer.statGraphs },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center" style={index > 0 ? { borderLeft: "1px solid color-mix(in srgb, var(--on-brand) 25%, transparent)" } : undefined}>
              <p className="text-[clamp(2rem,5vw,4rem)] leading-none [font-family:var(--font-anton),var(--font-family-sans)]" style={{ color: "var(--on-brand)" }}>{stat.value}</p>
              <p className="mt-2 text-xs sm:text-sm" style={{ color: "color-mix(in srgb, var(--on-brand) 80%, transparent)" }}>{stat.label}</p>
            </div>
          ))}
        </FooterReveal>

        <FooterReveal index={2} className="grid grid-cols-2 gap-x-6 gap-y-8 py-8 md:grid-cols-4">
          <nav aria-label={footer.explore} className="flex flex-col items-start">
            <h3 className="mb-2 text-xs uppercase" style={{ color: "color-mix(in srgb, var(--on-brand) 75%, transparent)" }}>{footer.explore}</h3>
            <FooterLink href="/">{nav.home}</FooterLink>
            <FooterLink href="/learn">{nav.learn}</FooterLink>
            <FooterLink href="/showroom">{nav.showroom}</FooterLink>
            <FooterLink href="/compare">{nav.compare}</FooterLink>
          </nav>

          <nav aria-label={footer.brands} className="flex flex-col items-start">
            <h3 className="mb-2 text-xs uppercase" style={{ color: "color-mix(in srgb, var(--on-brand) 75%, transparent)" }}>{footer.brands}</h3>
            {liveBrands.map((brand) => (
              <FooterLink key={brand.slug} href={`/brand/${brand.slug}`}>
                {brand.name} <span className="ml-1" style={{ color: "color-mix(in srgb, var(--on-brand) 70%, transparent)" }}>({iems.filter((iem) => iem.brandSlug === brand.slug).length})</span>
              </FooterLink>
            ))}
            <FooterLink href="/showroom">{footer.allBrands}</FooterLink>
          </nav>

          <nav aria-label={footer.aboutLink} className="col-span-2 flex flex-col items-start md:col-span-2">
            <span aria-hidden="true" className="mb-2 hidden h-[1rem] md:block" />
            <FooterLink href="/about">{footer.aboutLink}</FooterLink>
            <FooterLink href="/terms">{footer.termsLink}</FooterLink>
            <FooterLink href="/privacy">{footer.privacyLink}</FooterLink>
          </nav>
        </FooterReveal>

        <div className="flex items-center justify-between border-t pt-5 text-xs" style={{ borderColor: "color-mix(in srgb, var(--on-brand) 25%, transparent)", color: "color-mix(in srgb, var(--on-brand) 80%, transparent)" }}>
          <p>{footer.copyright.replace("{year}", String(year))}</p>
          <p>{footer.createdBy}</p>
        </div>
      </div>
    </footer>
  );
}
