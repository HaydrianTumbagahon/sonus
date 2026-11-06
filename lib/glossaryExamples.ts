import type { GlossaryTerm } from "@/data/glossary";
import type { FrequencyPoint, FrequencyTarget, IEM } from "@/types/iem";

function averageRating(iem: IEM): number {
  const ratings = Object.values(iem.ratings ?? {}).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return ratings.length > 0 ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
}

function parseNumber(value: string | number | undefined): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const match = value?.match(/[\d.]+/);
  return match ? Number(match[0]) : undefined;
}

function matchesName(term: GlossaryTerm, names: string[]): boolean {
  const normalized = term.term.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const slug = term.slug.toLowerCase();
  return names.some((name) => {
    const nameNormalized = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return slug.includes(nameNormalized.replaceAll(" ", "-")) || normalized.includes(nameNormalized);
  });
}

function interpolate(points: FrequencyPoint[], frequency: number): number | undefined {
  if (points.length === 0) return undefined;
  const exact = points.find((point) => point.frequency === frequency);
  if (exact) return exact.db;
  const lower = [...points].reverse().find((point) => point.frequency < frequency);
  const upper = points.find((point) => point.frequency > frequency);
  if (!lower || !upper) return undefined;
  const ratio = (Math.log(frequency) - Math.log(lower.frequency)) /
    (Math.log(upper.frequency) - Math.log(lower.frequency));
  return lower.db + (upper.db - lower.db) * ratio;
}

function shiftCurve(points: FrequencyPoint[]): FrequencyPoint[] {
  const reference = interpolate(points, 1000);
  return reference === undefined ? points : points.map((point) => ({ ...point, db: point.db - reference }));
}

function curveAverage(points: FrequencyPoint[], low: number, high: number): number {
  const shifted = shiftCurve(points);
  const samples = shifted.filter((point) => point.frequency >= low && point.frequency <= high);
  if (samples.length === 0) return -Infinity;
  return samples.reduce((sum, point) => sum + point.db, 0) / samples.length;
}

function highestDifferentBrands(items: IEM[], limit = 4): IEM[] {
  const picked: IEM[] = [];
  const usedBrands = new Set<string>();
  const sorted = [...items].sort((left, right) =>
    averageRating(right) - averageRating(left) ||
    left.name.localeCompare(right.name),
  );
  for (const item of sorted) {
    if (!picked.includes(item) && !usedBrands.has(item.brandSlug)) {
      picked.push(item);
      usedBrands.add(item.brandSlug);
      if (picked.length === limit) return picked;
    }
  }
  for (const item of sorted) {
    if (!picked.includes(item)) {
      picked.push(item);
      if (picked.length === limit) break;
    }
  }
  return picked.slice(0, limit);
}

export function getExampleIEMs(
  term: GlossaryTerm,
  allIems: IEM[],
  targets: FrequencyTarget[] = [],
): IEM[] {
  const explicit = term.exampleIEMs.flatMap((value) => {
    const normalized = value.toLowerCase();
    const match = allIems.find((iem) =>
      iem.slug.toLowerCase() === normalized ||
      iem.name.toLowerCase() === normalized ||
      `${iem.brand} ${iem.name}`.toLowerCase() === normalized,
    );
    return match ? [match] : [];
  });
  const picked = [...explicit];

  const add = (items: IEM[]) => {
    for (const item of highestDifferentBrands(items, 4)) {
      if (!picked.some((existing) => existing.slug === item.slug)) picked.push(item);
      if (picked.length >= 4) break;
    }
  };

  const driver = (term.slug + " " + term.term).toLowerCase();
  if (matchesName(term, ["Dynamic Driver"])) add(allIems.filter((iem) => iem.driverType?.toUpperCase() === "DD"));
  else if (matchesName(term, ["Balanced Armature"])) add(allIems.filter((iem) =>
    iem.driverType?.toUpperCase() === "BA" || String(iem.driverConfiguration ?? "").toUpperCase().includes("BA")));
  else if (matchesName(term, ["Planar Magnetic"])) add(allIems.filter((iem) => String(iem.driverType ?? iem.driverConfiguration ?? "").toLowerCase().includes("planar")));
  else if (matchesName(term, ["Electrostatic"])) add(allIems.filter((iem) => String(iem.driverType ?? iem.driverConfiguration ?? "").toUpperCase().includes("EST")));
  else if (matchesName(term, ["Hybrid"])) add(allIems.filter((iem) => String(iem.driverType ?? iem.driverConfiguration ?? "").toLowerCase().includes("hybrid")));
  else if (driver.includes("bone conduction")) add(allIems.filter((iem) => String(iem.driverType ?? iem.driverConfiguration ?? "").toLowerCase().includes("bone conduction")));
  else if (matchesName(term, ["2-Pin", "MMCX"])) {
    const twoPin = allIems.filter((iem) => String((iem.materials as Record<string, string> | undefined)?.connector ?? iem.connector ?? "").toUpperCase().includes("2-PIN"));
    const mmcx = allIems.filter((iem) => String((iem.materials as Record<string, string> | undefined)?.connector ?? iem.connector ?? "").toUpperCase().includes("MMCX"));
    add([...twoPin, ...mmcx]);
  } else if (matchesName(term, ["Impedance", "Sensitivity"])) {
    const parsed = allIems
      .map((iem) => ({ iem, value: parseNumber(iem.impedance) }))
      .filter((entry): entry is { iem: IEM; value: number } => entry.value !== undefined)
      .sort((left, right) => left.value - right.value);
    add(driver.includes("sensitivity")
      ? allIems.map((iem) => ({ iem, value: parseNumber(iem.sensitivity) })).filter((entry): entry is { iem: IEM; value: number } => entry.value !== undefined).sort((left, right) => right.value - left.value).map((entry) => entry.iem)
      : [...parsed.slice(0, 2).map((entry) => entry.iem), ...parsed.slice(-2).map((entry) => entry.iem)]);
  } else if (matchesName(term, ["Shell", "Nozzle"])) {
    const groups = new Map<string, IEM[]>();
    for (const iem of allIems) {
      const materials = iem.materials;
      const value = typeof materials === "object" && !Array.isArray(materials)
        ? String(matchesName(term, ["Shell"]) ? materials.shell : materials.nozzle ?? "")
        : "";
      if (value) groups.set(value.toLowerCase(), [...(groups.get(value.toLowerCase()) ?? []), iem]);
    }
    add([...groups.values()].flatMap((items) => highestDifferentBrands(items, 1)));
  } else if (matchesName(term, ["Eartips", "Ear Tips", "Timbre", "Dynamics", "Detail Retrieval", "Resolution", "Separation", "Imaging", "Soundstage"])) {
    add([...allIems].sort((left, right) => (right.ratings?.sound ?? 0) - (left.ratings?.sound ?? 0)));
  } else if (matchesName(term, ["Sub-bass", "Mid-bass", "Midrange", "Upper Mids", "Treble", "Peak", "Dip", "Sibilance", "V-shape", "V-Shaped", "Neutral", "Harman Curve"])) {
    const ranked = [...allIems].filter((iem) => iem.frData?.length).sort((left, right) => {
      const leftCurve = left.frData ?? [];
      const rightCurve = right.frData ?? [];
      let leftScore = 0;
      let rightScore = 0;
      if (matchesName(term, ["Sub-bass"])) { leftScore = curveAverage(leftCurve, 20, 60); rightScore = curveAverage(rightCurve, 20, 60); }
      else if (matchesName(term, ["Mid-bass"])) { leftScore = curveAverage(leftCurve, 60, 250); rightScore = curveAverage(rightCurve, 60, 250); }
      else if (matchesName(term, ["Upper Mids"])) { leftScore = curveAverage(leftCurve, 2000, 6000); rightScore = curveAverage(rightCurve, 2000, 6000); }
      else if (matchesName(term, ["Treble", "Sibilance"])) { leftScore = curveAverage(leftCurve, matchesName(term, ["Sibilance"]) ? 5000 : 6000, matchesName(term, ["Sibilance"]) ? 9000 : 12000); rightScore = curveAverage(rightCurve, matchesName(term, ["Sibilance"]) ? 5000 : 6000, matchesName(term, ["Sibilance"]) ? 9000 : 12000); }
      else if (matchesName(term, ["Neutral"])) {
        const deviation = (points: FrequencyPoint[]) => {
          const shifted = shiftCurve(points);
          return Math.sqrt(shifted.reduce((sum, point) => sum + point.db ** 2, 0) / shifted.length);
        };
        leftScore = -deviation(leftCurve);
        rightScore = -deviation(rightCurve);
      }
      else if (matchesName(term, ["Harman Curve"])) {
        const target = targets.find((item) => item.slug.includes("harman"))?.data;
        if (target?.length) {
          const rms = (points: FrequencyPoint[]) => {
            const curve = shiftCurve(points);
            const targetCurve = shiftCurve(target);
            const values = curve.filter((point) => targetCurve.some((targetPoint) => targetPoint.frequency === point.frequency)).map((point) => {
              const targetPoint = targetCurve.find((item) => item.frequency === point.frequency);
              return targetPoint ? (point.db - targetPoint.db) ** 2 : 0;
            });
            return values.length ? Math.sqrt(values.reduce((sum, value) => sum + value, 0) / values.length) : Infinity;
          };
          leftScore = -rms(leftCurve);
          rightScore = -rms(rightCurve);
        }
      }
      return rightScore - leftScore;
    });
    add(ranked);
  } else {
    add([...allIems].sort((left, right) => averageRating(right) - averageRating(left)));
  }

  return picked.slice(0, 4);
}
