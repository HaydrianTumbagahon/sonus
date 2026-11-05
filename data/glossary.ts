// TODO: Replace lorem content with real copy
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
};

const shortLorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const longLorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vitae sem at justo luctus posuere. Integer posuere, lacus sit amet commodo consequat, sapien neque tempor erat, vitae consequat nisl mi sed justo.";

const glossaryMetadata = [
  { slug: "dynamic-driver", term: "Dynamic Driver", category: "Hardware & Design", visual: "diagram", related: ["hybrid", "sub-bass", "dynamics"] },
  { slug: "balanced-armature", term: "Balanced Armature", category: "Hardware & Design", visual: "diagram", related: ["hybrid", "midrange", "resolution"] },
  { slug: "planar-magnetic", term: "Planar Magnetic", category: "Hardware & Design", visual: "diagram", related: ["resolution", "separation", "dynamics"] },
  { slug: "electrostatic", term: "Electrostatic", category: "Hardware & Design", visual: "diagram", related: ["treble", "detail-retrieval", "resolution"] },
  { slug: "hybrid", term: "Hybrid", category: "Hardware & Design", visual: "diagram", related: ["dynamic-driver", "balanced-armature", "separation"] },
  { slug: "shell", term: "Shell", category: "Hardware & Design", visual: "diagram", related: ["nozzle", "eartips", "faceplate"] },
  { slug: "nozzle", term: "Nozzle", category: "Hardware & Design", visual: "diagram", related: ["eartips", "treble", "shell"] },
  { slug: "eartips", term: "Eartips", category: "Hardware & Design", visual: "diagram", related: ["nozzle", "sub-bass", "sibilance"] },
  { slug: "2-pin-mmcx", term: "2-Pin / MMCX", category: "Hardware & Design", visual: "diagram", related: ["cable", "shell"] },
  { slug: "impedance", term: "Impedance", category: "Hardware & Design", visual: "none", related: ["sensitivity", "dynamic-driver"] },
  { slug: "sensitivity", term: "Sensitivity", category: "Hardware & Design", visual: "none", related: ["impedance", "dynamics"] },

  { slug: "sub-bass", term: "Sub-bass", category: "Sound Frequencies & Tuning", visual: "frequency-zone", related: ["mid-bass", "dynamic-driver", "harman-curve"] },
  { slug: "mid-bass", term: "Mid-bass", category: "Sound Frequencies & Tuning", visual: "frequency-zone", related: ["sub-bass", "midrange", "v-shape"] },
  { slug: "midrange", term: "Midrange", category: "Sound Frequencies & Tuning", visual: "frequency-zone", related: ["upper-mids", "balanced-armature", "neutral"] },
  { slug: "upper-mids", term: "Upper Mids", category: "Sound Frequencies & Tuning", visual: "frequency-zone", related: ["midrange", "peak", "harman-curve"] },
  { slug: "treble", term: "Treble", category: "Sound Frequencies & Tuning", visual: "frequency-zone", related: ["sibilance", "detail-retrieval", "electrostatic"] },
  { slug: "peak", term: "Peak", category: "Sound Frequencies & Tuning", visual: "waveform", related: ["dip", "upper-mids", "sibilance"] },
  { slug: "dip", term: "Dip", category: "Sound Frequencies & Tuning", visual: "waveform", related: ["peak", "midrange", "neutral"] },
  { slug: "harman-curve", term: "Harman Curve", category: "Sound Frequencies & Tuning", visual: "diagram", related: ["sub-bass", "upper-mids", "neutral"] },
  { slug: "v-shape", term: "V-shape", category: "Sound Frequencies & Tuning", visual: "diagram", related: ["sub-bass", "treble", "midrange"] },
  { slug: "neutral", term: "Neutral", category: "Sound Frequencies & Tuning", visual: "diagram", related: ["midrange", "harman-curve", "v-shape"] },

  { slug: "soundstage", term: "Soundstage", category: "Audio Quality & Performance", visual: "diagram", related: ["imaging", "separation", "planar-magnetic"] },
  { slug: "imaging", term: "Imaging", category: "Audio Quality & Performance", visual: "diagram", related: ["soundstage", "separation", "resolution"] },
  { slug: "resolution", term: "Resolution", category: "Audio Quality & Performance", visual: "none", related: ["detail-retrieval", "separation", "planar-magnetic"] },
  { slug: "detail-retrieval", term: "Detail Retrieval", category: "Audio Quality & Performance", visual: "none", related: ["resolution", "treble", "electrostatic"] },
  { slug: "timbre", term: "Timbre", category: "Audio Quality & Performance", visual: "waveform", related: ["dynamics", "neutral", "dynamic-driver"] },
  { slug: "dynamics", term: "Dynamics", category: "Audio Quality & Performance", visual: "waveform", related: ["sensitivity", "timbre", "dynamic-driver"] },
  { slug: "separation", term: "Separation", category: "Audio Quality & Performance", visual: "diagram", related: ["imaging", "resolution", "soundstage"] },
  { slug: "sibilance", term: "Sibilance", category: "Audio Quality & Performance", visual: "frequency-zone", related: ["treble", "peak", "eartips"] },
 ] satisfies Omit<GlossaryTerm, "shortDefinition" | "explanation" | "exampleIEMs">[];

export const glossaryTerms: GlossaryTerm[] = glossaryMetadata.map((term) => ({
  ...term,
  shortDefinition: shortLorem,
  explanation: longLorem,
  exampleIEMs: [],
}));

export const glossaryCategories: GlossaryCategory[] = [
  "Hardware & Design",
  "Sound Frequencies & Tuning",
  "Audio Quality & Performance",
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((item) => item.slug === slug);
}