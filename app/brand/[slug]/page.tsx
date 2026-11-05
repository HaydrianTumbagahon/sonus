import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPageClient } from "@/components/layout/BrandPageClient";
import { getAllBrands, getBrandBySlug, getIEMsByBrand } from "@/lib/data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllBrands().map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand | Sonus" };

  const title = `${brand.name} | Sonus`;
  const description = brand.description ?? `${brand.name} IEMs`;

  return {
    title,
    ...(description ? { description } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      type: "website",
      ...(brand.logo ? { images: [{ url: brand.logo, alt: brand.name }] } : {}),
    },
  };
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  return <BrandPageClient brand={brand} iems={getIEMsByBrand(brand.slug)} />;
}