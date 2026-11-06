export const compareColors = [
  "var(--compare-1)",
  "var(--compare-2)",
  "var(--compare-3)",
  "var(--compare-4)",
  "var(--compare-5)",
  "var(--compare-6)",
] as const;

export function compareColor(index: number) {
  return compareColors[index % compareColors.length];
}