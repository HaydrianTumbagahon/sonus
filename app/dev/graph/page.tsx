import { FrequencyGraphDemo } from "@/components/iem/FrequencyGraphDemo";
import { getAllIEMs, getAllTargets } from "@/lib/data";

export default function FrequencyGraphDevPage() {
  const firstIem = getAllIEMs()[0];
  const iemSeries = firstIem ? [
    ...(firstIem.frDataL?.length ? [{
      id: `${firstIem.slug}-L`,
      label: `${firstIem.brand} ${firstIem.name} (L)`,
      color: "var(--graph-1)",
      data: firstIem.frDataL,
    }] : []),
    ...(firstIem.frDataR?.length ? [{
      id: `${firstIem.slug}-R`,
      label: `${firstIem.brand} ${firstIem.name} (R)`,
      color: "var(--graph-1)",
      data: firstIem.frDataR,
    }] : []),
    ...(!firstIem.frDataL?.length && !firstIem.frDataR?.length && firstIem.frData?.length ? [{
      id: firstIem.slug,
      label: `${firstIem.brand} ${firstIem.name}`,
      color: "var(--graph-1)",
      data: firstIem.frData,
    }] : []),
  ] : [];
  const targetSeries = getAllTargets().slice(0, 2).map((target) => ({
    id: `target-${target.slug}`,
    label: target.name,
    color: "var(--text-tertiary)",
    data: target.data,
    strokeWidth: 1.75,
    dashed: true,
    isTarget: true,
  }));

  return (
    <FrequencyGraphDemo
      iemSeries={iemSeries}
      targetSeries={targetSeries}
      measuredBy={firstIem?.measuredBy}
      measuredOn={firstIem?.measuredOn}
    />
  );
}