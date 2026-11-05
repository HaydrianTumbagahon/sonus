import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IEMDetailClient } from "@/components/iem/IEMDetailClient";
import { getAllIEMs, getIEMBySlug } from "@/lib/data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllIEMs().map((iem) => ({ slug: iem.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const iem = getIEMBySlug(slug);
  if (!iem) return { title: "IEM | Sonus" };

  const title = `${iem.brand} ${iem.name} | Sonus`;
  const description = iem.description ?? `${iem.brand} ${iem.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(iem.images.hero ? { images: [{ url: iem.images.hero, alt: `${iem.brand} ${iem.name}` }] } : {}),
    },
  };
}

export default async function IemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const iem = getIEMBySlug(slug);
  if (!iem) notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: iem.name,
    sku: iem.id,
    description: iem.description,
    image: iem.images.hero,
    brand: {
      "@type": "Brand",
      name: iem.brand,
    },
  };
  const safeJsonLd = JSON.stringify(productJsonLd).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <IEMDetailClient iem={iem} allIems={getAllIEMs()} />
    </>
  );
}