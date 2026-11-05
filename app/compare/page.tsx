import { CompareClient } from "@/components/compare/CompareClient";
import { getAllIEMs } from "@/lib/data";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const hasSelection = Object.prototype.hasOwnProperty.call(params, "iems");
  const value = params.iems;
  const initialIems = hasSelection
    ? Array.isArray(value) ? value.join(",") : value ?? ""
    : null;

  return <CompareClient allIems={getAllIEMs()} initialIems={initialIems} />;
}