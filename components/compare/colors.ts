export const compareColors = [
  "var(--graph-1)",
  "var(--graph-2)",
  "var(--graph-3)",
  "var(--graph-4)",
  "var(--graph-5)",
  "var(--graph-6)",
] as const;

export function compareColor(index: number) {
  return compareColors[index % compareColors.length];
}