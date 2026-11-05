import { HomeClient } from "@/components/home/HomeClient";
import { getAllBrands, getAllIEMs } from "@/lib/data";

export default function Home() {
  return <HomeClient brands={getAllBrands()} iems={getAllIEMs()} />;
}

