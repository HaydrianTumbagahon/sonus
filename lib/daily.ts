import type { IEM } from "@/types/iem";

export type DailySlot = "top-overall" | "best-sound" | "best-build" | "best-value" | "wildcard";

export type DailyPick = {
  slot: DailySlot;
  iem: IEM;
  rating: number;
};

function categoryRating(iem: IEM, category: "build" | "sound" | "value" | "overall"): number | undefined {
  const ratings = iem.ratings;
  if (!ratings) return undefined;
  if (category !== "overall") {
    const value = ratings[category];
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  }
  const values = [ratings.build, ratings.value, ratings.sound].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return values.length === 3 ? values.reduce((total, value) => total + value, 0) / values.length : undefined;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ranked(
  iems: IEM[],
  category: "build" | "sound" | "value" | "overall",
): Array<{ iem: IEM; rating: number }> {
  return iems
    .map((iem) => ({ iem, rating: categoryRating(iem, category) }))
    .filter((entry): entry is { iem: IEM; rating: number } => entry.rating !== undefined)
    .sort((left, right) => right.rating - left.rating || left.iem.name.localeCompare(right.iem.name));
}

function chooseFromTopThree(
  items: Array<{ iem: IEM; rating: number }>,
  used: Set<string>,
  hash: number,
  offset: number,
): { iem: IEM; rating: number } | undefined {
  const available = items.filter((entry) => !used.has(entry.iem.slug));
  if (available.length === 0) return undefined;

  const usedBrands = new Set(
    Array.from(used)
      .map((slug) => items.find((entry) => entry.iem.slug === slug)?.iem.brandSlug)
      .filter((brand): brand is string => Boolean(brand)),
  );
  const differentBrands = available.filter((entry) => !usedBrands.has(entry.iem.brandSlug));
  const pool = (differentBrands.length > 0 ? differentBrands : available).slice(0, 3);
  return pool[(hash + offset) % pool.length];
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyTopFive(iems: IEM[], date = new Date()): DailyPick[] {
  const eligible = iems.filter((iem) => Boolean(iem.images.hero) && Boolean(iem.ratings));
  if (eligible.length === 0) return [];
  const hash = hashString(getLocalDateKey(date));
  const used = new Set<string>();
  const picks: DailyPick[] = [];
  const slots: Array<{ slot: DailySlot; category: "overall" | "sound" | "build" | "value" }> = [
    { slot: "top-overall", category: "overall" },
    { slot: "best-sound", category: "sound" },
    { slot: "best-build", category: "build" },
    { slot: "best-value", category: "value" },
  ];

  slots.forEach(({ slot, category }, index) => {
    const choice = chooseFromTopThree(ranked(eligible, category), used, hash, index);
    if (!choice) return;
    used.add(choice.iem.slug);
    picks.push({ slot, iem: choice.iem, rating: choice.rating });
  });

  const remaining = eligible.filter((iem) => !used.has(iem.slug));
  const overall = ranked(remaining, "overall");
  if (overall.length === 0) return picks.slice(0, 5);

  const allScores = ranked(eligible, "overall")
    .map((entry) => entry.rating)
    .sort((left, right) => left - right);
  const median = allScores[Math.floor(allScores.length / 2)];
  const wildcardPool = overall.filter((entry) => entry.rating >= median);
  const candidates = wildcardPool.length > 0 ? wildcardPool : overall;
  const usedBrands = new Set(picks.map((pick) => pick.iem.brandSlug));
  const differentBrands = candidates.filter((entry) => !usedBrands.has(entry.iem.brandSlug));
  const pool = differentBrands.length > 0 ? differentBrands : candidates;
  const choice = pool[(hash + 9) % pool.length];
  if (choice) picks.push({ slot: "wildcard", iem: choice.iem, rating: choice.rating });

  return picks.slice(0, 5);
}