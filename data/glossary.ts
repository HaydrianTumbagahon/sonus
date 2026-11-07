export type GlossaryCategory =
  | "Hardware & Design"
  | "Sound Frequencies & Tuning"
  | "Audio Quality & Performance";

export type GlossaryVisual = "diagram" | "frequency-zone" | "waveform" | "none";

export type GlossaryTerm = {
  slug: string;
  term: string;
  category: GlossaryCategory;
  shortDefinition: string;
  explanation: string;
  visual: GlossaryVisual;
  related: string[];
  exampleIEMs: string[];
  images?: string[];
};

export const glossaryCategories: GlossaryCategory[] = [
  "Hardware & Design",
  "Sound Frequencies & Tuning",
  "Audio Quality & Performance",
];