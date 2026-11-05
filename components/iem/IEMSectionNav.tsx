"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const sections = [
  { id: "insight", key: "product.sections.insight" },
  { id: "build", key: "product.sections.build" },
  { id: "in-the-box", key: "product.sections.inTheBox" },
  { id: "specs", key: "product.sections.specs" },
  { id: "graph", key: "product.sections.graph" },
  { id: "pros-cons", key: "product.sections.prosCons" },
  { id: "ratings", key: "product.sections.ratings" },
] as const;

export function IEMSectionNav() {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<string>(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label={t("product.sectionNavigation")} className="sticky top-24 hidden border-l border-border pl-4 lg:block">
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={activeId === section.id ? "location" : undefined}
              className={`flex min-h-10 items-center text-sm transition-colors ${activeId === section.id ? "border-l-2 border-accent -ml-[1.0625rem] pl-[0.9375rem] text-primary" : "text-secondary hover:text-primary"}`}
            >
              {t(section.key)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}