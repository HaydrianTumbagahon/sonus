import { GlossaryClient } from "@/components/glossary/GlossaryClient";
import { getAllGlossaryTerms, getAllIEMs, getAllTargets } from "@/lib/data";
import { getExampleIEMs } from "@/lib/glossaryExamples";

export default function LearnPage() {
  const iems = getAllIEMs();
  const targets = getAllTargets();
  const terms = getAllGlossaryTerms().map((term) => ({
    ...term,
    exampleIEMs: getExampleIEMs(term, iems, targets).map((iem) => iem.slug),
  }));
  return <GlossaryClient terms={terms} iems={iems} />;
}