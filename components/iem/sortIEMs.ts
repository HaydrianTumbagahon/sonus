import type { IEM } from "@/types/iem";
import type { SortOption } from "@/components/iem/filter-types";

function ratingAverage(iem: IEM): number {
  const ratings = iem.ratings;
  if (!ratings) return Number.NEGATIVE_INFINITY;
  const values = [ratings.build, ratings.value, ratings.sound].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return values.length === 3
    ? values.reduce((total, value) => total + value, 0) / values.length
    : Number.NEGATIVE_INFINITY;
}

export function sortIEMs(items: IEM[], sort: SortOption): IEM[] {
  return [...items].sort((left, right) => {
    if (sort === "price-up" || sort === "price-down") {
      const leftPrice = left.priceUSD;
      const rightPrice = right.priceUSD;
      if (typeof leftPrice !== "number") return typeof rightPrice === "number" ? 1 : 0;
      if (typeof rightPrice !== "number") return -1;
      return sort === "price-up" ? leftPrice - rightPrice : rightPrice - leftPrice;
    }
    if (sort === "rating") {
      const leftRating = ratingAverage(left);
      const rightRating = ratingAverage(right);
      if (!Number.isFinite(leftRating)) return Number.isFinite(rightRating) ? 1 : 0;
      if (!Number.isFinite(rightRating)) return -1;
      return rightRating - leftRating;
    }
    if (sort === "newest") {
      const leftDate = Date.parse(left.releaseDate ?? "");
      const rightDate = Date.parse(right.releaseDate ?? "");
      if (!Number.isFinite(leftDate)) return Number.isFinite(rightDate) ? 1 : 0;
      if (!Number.isFinite(rightDate)) return -1;
      return rightDate - leftDate;
    }
    return 0;
  });
}