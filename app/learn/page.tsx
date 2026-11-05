import { GlossaryClient } from "@/components/glossary/GlossaryClient";
import { glossaryTerms } from "@/data/glossary";
import { getAllIEMs } from "@/lib/data";

export default function LearnPage() {
  return <GlossaryClient terms={glossaryTerms} iems={getAllIEMs()} />;
}