import { HomeClient } from "@/components/home/HomeClient";
import { getAllBrands, getAllIEMs } from "@/lib/data";

export default function Home() {
  const iems = getAllIEMs();
  const heroIems = iems.filter((iem) => Boolean(iem.images.hero));
  return <HomeClient brands={getAllBrands()} iems={iems} heroIems={heroIems} />;
}

