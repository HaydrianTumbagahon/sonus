import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageBand } from "@/components/layout/PageBand";
import en from "@/messages/en.json";
import jp from "@/messages/jp.json";
import cn from "@/messages/cn.json";

type LegalDictionary = { legal: { privacy: { title: string; sections: { title: string; paragraphs: string[]; bullets?: string[]; tailParagraph?: string }[] } } };
const dictionaries = { en: en as LegalDictionary, jp: jp as LegalDictionary, cn: cn as LegalDictionary };

async function getLanguage(): Promise<"en" | "jp" | "cn"> {
  const value = (await cookies()).get("sonus-lang")?.value;
  return value === "jp" || value === "cn" ? value : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLanguage();
  const title = dictionaries[lang].legal.privacy.title;
  return { title: `${title} | Sonus`, description: dictionaries[lang].legal.privacy.sections[0].paragraphs[0] };
}

export default async function PrivacyPage() {
  const lang = await getLanguage();
  const page = dictionaries[lang].legal.privacy;

  return (
    <>
      <PageBand size="compact" outlineWord="PRIVACY">
        <h1 className="origin-left text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.9] text-primary [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--brand-text)_60%,transparent)]">
          {page.title}
        </h1>
      </PageBand>
      <article className="mx-auto max-w-[720px] px-4 pb-[calc(128px+env(safe-area-inset-bottom))] pt-10 sm:px-6">
        {page.sections.map((section) => (
          <section key={section.title} className="mb-8">
            <h2 className="mb-3 text-xl text-primary sm:text-2xl">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-3 leading-relaxed text-secondary">{paragraph}</p>
            ))}
            {section.bullets && (
              <ul className="mb-3 list-disc space-y-2 pl-5 leading-relaxed text-secondary">
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            )}
            {section.tailParagraph && (
              <p className="mb-3 leading-relaxed text-secondary">{section.tailParagraph}</p>
            )}
          </section>
        ))}
      </article>
    </>
  );
}
