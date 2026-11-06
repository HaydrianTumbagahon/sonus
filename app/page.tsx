import { HomeClient } from "@/components/home/HomeClient";
import { getAllBrands, getAllIEMs, getAllTargets } from "@/lib/data";

export default function Home() {
  const iems = getAllIEMs();
  const heroIems = iems.filter((iem) => Boolean(iem.images.hero));
  const topFiveIems = iems.filter((iem) => Boolean(iem.images.hero) && Boolean(iem.ratings));
  return <HomeClient brands={getAllBrands()} iems={iems} targets={getAllTargets()} heroIems={heroIems} topFiveIems={topFiveIems} />;
}
