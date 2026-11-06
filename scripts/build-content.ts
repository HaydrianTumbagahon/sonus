import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Brand, BrandRosterEntry, FrequencyPoint, FrequencyTarget, IEM } from "../types/iem";

const root = process.cwd();
const contentRoot = path.join(root, "content");
const targetRoot = path.join(contentRoot, "targets");
const publicRoot = path.join(root, "public");
const generatedRoot = path.join(root, "generated");
const imageExtensions = new Set([".webp", ".png", ".jpg", ".jpeg"]);
const frequencyPointCount = 480;
const requiredInfoFields = ["name", "priceUSD", "description"];
const warnings: string[] = [];

function warn(message: string) {
  warnings.push(message);
}

function readJson(filePath: string): unknown {
  const source = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(source) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Unparseable JSON in ${path.relative(root, filePath)}: ${error.message}`);
    }
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.trim().replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function normalizeDriverType(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "dd" || normalized.includes("dynamic")) return "DD";
  if (normalized.includes("balanced armature") || normalized === "ba") return "BA";
  if (normalized.includes("planar")) return "Planar";
  if (normalized.includes("electrostatic") || normalized === "est") return "EST";
  if (normalized.includes("bone conduction")) return "Bone Conduction";
  if (normalized.includes("hybrid")) return "Hybrid";
  return value.trim();
}

function normalizeConnector(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("mmcx")) return "MMCX";
  if (normalized.includes("2-pin") || normalized.includes("2pin") || normalized.includes("2 pin")) return "2-Pin";
  return "Other";
}

function normalizeRatings(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined;
  const ratings: Record<string, number> = {};
  for (const [name, rawRating] of Object.entries(value)) {
    const rating = typeof rawRating === "number"
      ? rawRating
      : typeof rawRating === "string"
        ? Number(rawRating.trim())
        : undefined;
    if (rating !== undefined && Number.isFinite(rating) && rating >= 0 && rating <= 10) {
      ratings[name] = rating;
    } else {
      warn(`Rating "${name}" must be a number from 0 to 10 (${String(rawRating)}).`);
    }
  }
  return ratings;
}

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const trimmed = value.trim();
  const isoMatch = /^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$/.exec(trimmed);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, "0");
    const day = (isoMatch[3] ?? "01").padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

function readImageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function publicUrl(...segments: string[]): string {
  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

function parseFrequencyFile(filePath: string): FrequencyPoint[] {
  const rows: FrequencyPoint[] = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const [frequency, db] = line
      .trim()
      .split(/[\t,\s]+/)
      .filter((token) => /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token))
      .slice(0, 2)
      .map(Number);

    if (!Number.isFinite(frequency) || !Number.isFinite(db) || frequency <= 0) {
      continue;
    }

    rows.push({ frequency, db });
  }

  const uniqueRows = new Map<number, number>();
  for (const row of rows) {
    uniqueRows.set(row.frequency, row.db);
  }

  return [...uniqueRows.entries()]
    .map(([frequency, db]) => ({ frequency, db }))
    .sort((left, right) => left.frequency - right.frequency);
}

function interpolateLogFrequency(points: FrequencyPoint[], frequency: number): number {
  if (frequency <= points[0].frequency) return points[0].db;
  if (frequency >= points[points.length - 1].frequency) return points[points.length - 1].db;

  let upperIndex = 1;
  while (points[upperIndex].frequency < frequency) upperIndex += 1;
  const lower = points[upperIndex - 1];
  const upper = points[upperIndex];
  const logFrequency = Math.log(frequency);
  const position = (logFrequency - Math.log(lower.frequency)) /
    (Math.log(upper.frequency) - Math.log(lower.frequency));

  return lower.db + (upper.db - lower.db) * position;
}

function resampleFrequencyResponse(points: FrequencyPoint[]): FrequencyPoint[] | undefined {
  if (points.length === 0) return undefined;

  const pointCount = frequencyPointCount;
  const minFrequency = 20;
  const maxFrequency = 20000;

  return Array.from({ length: pointCount }, (_, index) => {
    const ratio = index / (pointCount - 1);
    const frequency = minFrequency * (maxFrequency / minFrequency) ** ratio;

    return {
      frequency: Math.round(frequency * 10) / 10,
      db: Math.round(interpolateLogFrequency(points, frequency) * 100) / 100,
    };
  });
}

function averageFrequencyResponses(left: FrequencyPoint[], right: FrequencyPoint[]): FrequencyPoint[] | undefined {
  if (left.length === 0 || right.length === 0) return undefined;

  const pointCount = frequencyPointCount;
  const minFrequency = 20;
  const maxFrequency = 20000;

  return Array.from({ length: pointCount }, (_, index) => {
    const ratio = index / (pointCount - 1);
    const frequency = minFrequency * (maxFrequency / minFrequency) ** ratio;
    const db = (interpolateLogFrequency(left, frequency) + interpolateLogFrequency(right, frequency)) / 2;

    return {
      frequency: Math.round(frequency * 10) / 10,
      db: Math.round(db * 100) / 100,
    };
  });
}

type IEMFrequencyData = {
  frData?: FrequencyPoint[];
  frDataL?: FrequencyPoint[];
  frDataR?: FrequencyPoint[];
};

function loadFrequencyData(iemDirectory: string, slug: string): IEMFrequencyData | undefined {
  const txtFiles = readdirSync(iemDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".txt")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (txtFiles.length === 0) return undefined;

  if (txtFiles.length === 1) {
    const points = parseFrequencyFile(path.join(iemDirectory, txtFiles[0]));
    const frData = averageFrequencyResponses(points, points);
    return frData ? { frData } : {};
  }

  let leftFile: string;
  let rightFile: string;
  if (txtFiles.length === 1) {
    leftFile = txtFiles[0];
    rightFile = txtFiles[0];
  } else {
    const markedLeft = txtFiles.find((file) => /[([]\s*1\s*[)\]]/i.test(file));
    const markedRight = txtFiles.find((file) => /[([]\s*2\s*[)\]]/i.test(file));

    if (markedLeft && markedRight) {
      leftFile = markedLeft;
      rightFile = markedRight;
    } else if (txtFiles.length === 2) {
      [leftFile, rightFile] = txtFiles;
      warn(`[${slug}] Frequency filenames lack matching (1)/(2) markers; sorted filenames were used as left/right.`);
    } else {
      warn(`[${slug}] Could not identify left/right frequency files among ${txtFiles.length} text files.`);
      return undefined;
    }
  }

  const left = parseFrequencyFile(path.join(iemDirectory, leftFile));
  const right = leftFile === rightFile
    ? left
    : parseFrequencyFile(path.join(iemDirectory, rightFile));
  const frData = averageFrequencyResponses(left, right);
  const frDataL = resampleFrequencyResponse(left);
  const frDataR = resampleFrequencyResponse(right);

  return {
    ...(frData ? { frData } : {}),
    ...(frDataL ? { frDataL } : {}),
    ...(frDataR ? { frDataR } : {}),
  };
}

const targetDisplayNames: Record<string, string> = {
  "harman-ie-2019": "Harman IE 2019 Target",
  "harman-ie-2019-target": "Harman IE 2019 Target",
  "super-22": "Super 22 Target",
  "super-22-target": "Super 22 Target",
};

function targetName(slug: string): string {
  return targetDisplayNames[slug] ?? slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function loadTargets(): FrequencyTarget[] {
  if (!existsSync(targetRoot)) {
    warn("[targets] Content target directory is missing.");
    return [];
  }

  const files = readdirSync(targetRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".txt")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    warn("[targets] Content target directory is empty.");
    return [];
  }

  return files.map((file) => {
    const slug = path.basename(file, path.extname(file));
    const data = resampleFrequencyResponse(parseFrequencyFile(path.join(targetRoot, file)));
    if (!data) warn(`[targets/${file}] No parseable frequency response data.`);
    return { slug, name: targetName(slug), data: data ?? [] };
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanGlossaryText(value: string): string {
  return value
    .split(/\r?\n/)
    .filter((line) => !/^#/.test(line.trim()) && line.trim() !== "No related terms listed.")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function loadGlossary(): Array<{
  slug: string;
  term: string;
  category: "Hardware & Design" | "Sound Frequencies & Tuning" | "Audio Quality & Performance";
  shortDefinition: string;
  explanation: string;
  visual: "diagram" | "frequency-zone" | "waveform" | "none";
  related: string[];
  exampleIEMs: string[];
}> {
  const filePath = path.join(contentRoot, "glossary.json");
  if (!existsSync(filePath)) {
    warn("[glossary] content/glossary.json is missing.");
    return [];
  }

  const parsed = readJson(filePath);
  if (!isRecord(parsed) || !Array.isArray(parsed.categories)) {
    warn("[glossary] content/glossary.json must contain a categories array.");
    return [];
  }

  const results: Array<{
    slug: string;
    term: string;
    category: "Hardware & Design" | "Sound Frequencies & Tuning" | "Audio Quality & Performance";
    shortDefinition: string;
    explanation: string;
    visual: "diagram" | "frequency-zone" | "waveform" | "none";
    related: string[];
    exampleIEMs: string[];
  }> = [];

  for (const categoryValue of parsed.categories) {
    if (!isRecord(categoryValue) || !Array.isArray(categoryValue.terms)) continue;

    const title = typeof categoryValue.title === "string" ? categoryValue.title.toLowerCase() : "";
    let category: "Hardware & Design" | "Sound Frequencies & Tuning" | "Audio Quality & Performance";
    if (title.includes("hardware") || title.includes("design")) category = "Hardware & Design";
    else if (title.includes("frequency") || title.includes("tuning") || title.includes("sound")) category = "Sound Frequencies & Tuning";
    else category = "Audio Quality & Performance";

    for (const termValue of categoryValue.terms) {
      if (!isRecord(termValue)) {
        warn("[glossary] Term entry must contain an object.");
        continue;
      }

      const termName = typeof termValue.term === "string" ? termValue.term : "";
      const termId = typeof termValue.id === "string" && termValue.id.length > 0 ? termValue.id : slugify(termName);
      const shortDefinition = typeof termValue.short === "string" ? termValue.short : "";
      const explanation = typeof termValue.description === "string"
        ? cleanGlossaryText(termValue.description)
        : "";

      if (!termName) warn(`[glossary/${termId}] Missing term field.`);
      if (!shortDefinition) warn(`[glossary/${termId}] Missing short field.`);
      if (!explanation) warn(`[glossary/${termId}] Missing description field.`);

      let slug = typeof termValue.slug === "string" && termValue.slug.length > 0
        ? termValue.slug
        : termId === "ear-tips" ? "eartips"
          : termId === "v-shaped" ? "v-shape"
            : termId === "2-pin" ? "2-pin-mmcx"
              : termId === "mmcx" ? "mmcx"
                : slugify(termName);

      const legacySlugMap: Record<string, string> = {
        "dynamic-driver-dd": "dynamic-driver",
        "balanced-armature-ba": "balanced-armature",
        "planar-magnetic-driver": "planar-magnetic",
        "electrostatic-driver-est": "electrostatic",
        "hybrid-multi-driver": "hybrid",
      };
      slug = legacySlugMap[slug] ?? slug;

      const visual = category === "Hardware & Design"
        ? "diagram"
        : category === "Sound Frequencies & Tuning"
          ? "frequency-zone"
          : "waveform";

      results.push({
        slug,
        term: termName,
        category,
        shortDefinition,
        explanation,
        visual,
        related: Array.isArray(termValue.related)
          ? termValue.related.filter((item): item is string => typeof item === "string")
          : [],
        exampleIEMs: Array.isArray(termValue.examples)
          ? termValue.examples.filter((item): item is string => typeof item === "string")
          : [],
      });
    }
  }

  const unique = new Set<string>();
  return results.filter((term) => {
    if (unique.has(term.slug)) {
      warn(`[glossary/${term.slug}] Duplicate glossary slug.`);
      return false;
    }
    unique.add(term.slug);
    return true;
  });
}

function copyBrandLogo(brandDirectory: string, slug: string): string | undefined {
  if (!existsSync(brandDirectory)) return undefined;

  const logo = readdirSync(brandDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^logo\./i.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))[0];

  if (!logo) return undefined;

  const extension = path.extname(logo);
  const destination = path.join(publicRoot, "brands", slug, `logo${extension.toLowerCase()}`);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(path.join(brandDirectory, logo), destination);
  return publicUrl("brands", slug, `logo${extension.toLowerCase()}`);
}

function processIem(
  brand: BrandRosterEntry,
  brandName: string,
  folderName: string,
  duplicateSlugs: Set<string>,
): IEM {
  const slug = `${brand.slug}-${folderName}`;
  const iemDirectory = path.join(contentRoot, brand.slug, folderName);
  const infoPath = path.join(iemDirectory, "info.json");
  let info: Record<string, unknown> = {};

  if (existsSync(infoPath)) {
    const parsed = readJson(infoPath);
    if (isRecord(parsed)) {
      info = parsed;
    } else {
      warn(`[${slug}] info.json must contain an object.`);
    }
  } else {
    warn(`[${slug}] Missing info.json.`);
  }

  const priceUSD = parsePrice(info.priceUSD) ?? parsePrice(info.price);
  const normalizedRatings = normalizeRatings(info.ratings);
  info = {
    ...info,
    priceUSD,
    description: info.description ?? info.insight,
    personalInsight: info.personalInsight ?? info.insight,
    driverConfiguration: info.driverConfiguration ?? info.driverConfig,
    inTheBox: info.inTheBox ?? info.accessories,
    driverType: normalizeDriverType(info.driverType),
    connector: normalizeConnector(info.connector ?? (isRecord(info.materials) ? info.materials.connector : undefined)),
    ...(normalizedRatings ? { ratings: normalizedRatings } : {}),
    ...(info.releaseDate !== undefined ? { releaseDate: normalizeDate(info.releaseDate) } : {}),
  };

  const missingFields = requiredInfoFields.filter((field) => {
    const value = info[field];
    return value === undefined || value === null || value === "";
  });
  if (missingFields.length > 0) {
    warn(`[${slug}] Missing required info.json fields: ${missingFields.join(", ")}.`);
  }

  if (duplicateSlugs.has(slug)) {
    warn(`[${slug}] Duplicate IEM slug.`);
  }
  duplicateSlugs.add(slug);

  const images = readImageFiles(iemDirectory);
  const hero = images.find((file) => /^hero\.(webp|png|jpe?g)$/i.test(file)) ?? images[0];
  if (!hero) {
    warn(`[${slug}] Missing hero image.`);
  }

  const imageDirectory = path.join(publicRoot, "iems", brand.slug, folderName);
  mkdirSync(imageDirectory, { recursive: true });
  for (const image of images) {
    copyFileSync(path.join(iemDirectory, image), path.join(imageDirectory, image));
  }

  const heroUrl = hero ? publicUrl("iems", brand.slug, folderName, hero) : undefined;
  const gallery = images
    .filter((image) => image !== hero)
    .map((image) => publicUrl("iems", brand.slug, folderName, image));
  const frequencyData = loadFrequencyData(iemDirectory, slug);
  if (!frequencyData?.frData) {
    warn(`[${slug}] Missing frequency response data.`);
  }

  if (isRecord(info.ratings)) {
    for (const [ratingName, rating] of Object.entries(info.ratings)) {
      if (typeof rating !== "number" || !Number.isFinite(rating) || rating < 0 || rating > 10) {
        warn(`[${slug}] Rating "${ratingName}" must be a number from 0 to 10 (${String(rating)}).`);
      }
    }
  }

  return {
    ...info,
    id: slug,
    slug,
    brand: brandName,
    brandSlug: brand.slug,
    name: typeof info.name === "string" && info.name.length > 0 ? info.name : folderName,
    images: { ...(heroUrl ? { hero: heroUrl } : {}), gallery },
    ...(frequencyData?.frData ? { frData: frequencyData.frData } : {}),
    ...(frequencyData?.frDataL ? { frDataL: frequencyData.frDataL } : {}),
    ...(frequencyData?.frDataR ? { frDataR: frequencyData.frDataR } : {}),
  } as IEM;
}

function main() {
  const rosterPath = path.join(contentRoot, "brand-roster.json");
  const roster = readJson(rosterPath);
  if (!Array.isArray(roster)) {
    throw new Error("content/brand-roster.json must contain an array.");
  }

  const brands: Brand[] = [];
  const iems: IEM[] = [];
  const duplicateSlugs = new Set<string>();

  for (const rosterItem of roster) {
    if (!isRecord(rosterItem)) continue;
    const brand = rosterItem as unknown as BrandRosterEntry;
    let brandName = brand.name;
    let description: string | undefined;
    let logo: string | undefined;
    const brandDirectory = path.join(contentRoot, brand.slug);

    if (brand.status === "live") {
      const brandInfoPath = path.join(brandDirectory, "brand.json");
      if (existsSync(brandInfoPath)) {
        const brandInfo = readJson(brandInfoPath);
        if (isRecord(brandInfo)) {
          if (typeof brandInfo.name === "string" && brandInfo.name.length > 0) {
            brandName = brandInfo.name;
          } else {
            warn(`[${brand.slug}] brand.json is missing a valid name; roster name used.`);
          }
          if (typeof brandInfo.description === "string") {
            description = brandInfo.description;
          } else {
            warn(`[${brand.slug}] brand.json is missing a valid description.`);
          }
        } else {
          warn(`[${brand.slug}] brand.json must contain an object.`);
        }
      } else {
        warn(`[${brand.slug}] Missing brand.json.`);
      }

      logo = copyBrandLogo(brandDirectory, brand.slug);
      if (!existsSync(brandDirectory)) {
        warn(`[${brand.slug}] Live brand content directory not found.`);
      } else {
        const folders = readdirSync(brandDirectory, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort((left, right) => left.localeCompare(right));

        for (const folderName of folders) {
          iems.push(processIem(brand, brandName, folderName, duplicateSlugs));
        }
      }
    }

    const brandIems = iems.filter((iem) => iem.brandSlug === brand.slug);
    brands.push({
      name: brandName,
      slug: brand.slug,
      status: brand.status,
      ...(description !== undefined ? { description } : {}),
      ...(logo ? { logo } : {}),
      iemCount: brandIems.length,
    });
  }

  const targets = loadTargets();
  const glossary = loadGlossary();
  mkdirSync(generatedRoot, { recursive: true });
  writeFileSync(path.join(generatedRoot, "iems.json"), `${JSON.stringify(iems, null, 2)}\n`);
  writeFileSync(path.join(generatedRoot, "brands.json"), `${JSON.stringify(brands, null, 2)}\n`);
  writeFileSync(path.join(generatedRoot, "targets.json"), `${JSON.stringify(targets, null, 2)}\n`);
  writeFileSync(path.join(generatedRoot, "glossary.json"), `${JSON.stringify(glossary, null, 2)}\n`);

  console.log(`Content validation: ${iems.length} IEM(s), ${brands.length} brand(s), ${glossary.length} glossary term(s), ${warnings.length} warning(s).`);
  for (const warning of warnings) {
    console.warn(`WARN ${warning}`);
  }
}

main();