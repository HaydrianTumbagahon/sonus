import { HomeClient } from "@/components/home/HomeClient";
import { getAllBrands, getAllIEMs, getAllTargets, getIEMListingData } from "@/lib/data";

export default function Home() {
  const iems = getAllIEMs();
  const heroIems = iems.filter((iem) => Boolean(iem.images.hero));
  const topFiveIems = iems.filter((iem) => Boolean(iem.images.hero) && Boolean(iem.ratings));
  const graphIem = iems
    .filter((iem) => iem.frData && iem.frData.length > 0)
    .sort((left, right) => {
      const leftValues = ["build", "sound", "value"].map((key) => left.ratings?.[key]).filter((value): value is number => typeof value === "number");
      const rightValues = ["build", "sound", "value"].map((key) => right.ratings?.[key]).filter((value): value is number => typeof value === "number");
      const leftRating = leftValues.length > 0
        ? leftValues.reduce((sum, value) => sum + value, 0) / leftValues.length
        : left.ratings?.overall ?? 0;
      const rightRating = rightValues.length > 0
        ? rightValues.reduce((sum, value) => sum + value, 0) / rightValues.length
        : right.ratings?.overall ?? 0;
      return rightRating - leftRating;
    })[0];

  return (
    <HomeClient
      brands={getAllBrands()}
      graphIem={graphIem}
      targets={getAllTargets()}
      heroIems={getIEMListingData(heroIems)}
      topFiveIems={getIEMListingData(topFiveIems)}
    />
  );
}
