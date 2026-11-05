import { ShowroomClient } from "@/components/iem/ShowroomClient";
import { getAllBrands, getAllIEMs } from "@/lib/data";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ShowroomPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") initialSearchParams.set(key, value);
    else if (Array.isArray(value)) value.forEach((entry) => initialSearchParams.append(key, entry));
  }

  return (
    <ShowroomClient
      iems={getAllIEMs()}
      brands={getAllBrands()}
      initialSearch={initialSearchParams.toString()}
    />
  );
}