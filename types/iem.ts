export type BrandStatus = "live" | "coming-soon";

export type FrequencyPoint = {
  frequency: number;
  db: number;
};

export type IEMImageSet = {
  hero?: string;
  gallery: string[];
};

export type IEMBuildDetails = {
  shell?: string;
  faceplate?: string;
  nozzle?: string;
  cable?: string;
  connector?: string;
  [field: string]: unknown;
};

export type IEMTier = "entry" | "mid" | "flagship";

export type IEM = {
  id: string;
  slug: string;
  brand: string;
  brandSlug: string;
  name: string;
  driverType?: string;
  tags?: string[];
  materials?: string[] | Record<string, string>;
  releaseDate?: string;
  description?: string;
  personalInsight?: string;
  build?: IEMBuildDetails;
  specs?: Record<string, string | number>;
  inTheBox?: string[];
  pros?: string[];
  cons?: string[];
  priceUSD?: number;
  tier?: IEMTier;
  driverConfiguration?: string;
  impedance?: string | number;
  sensitivity?: string | number;
  frequencyResponse?: string;
  weight?: string | number;
  connector?: string;
  ratings?: Record<string, number>;
  measuredBy?: string;
  measuredOn?: string;
  images: IEMImageSet;
  frData?: FrequencyPoint[];
  frDataL?: FrequencyPoint[];
  frDataR?: FrequencyPoint[];
  [field: string]: unknown;
};

export type FrequencyTarget = {
  slug: string;
  name: string;
  data: FrequencyPoint[];
};

export type Brand = {
  name: string;
  slug: string;
  status: BrandStatus;
  description?: string;
  logo?: string;
  iemCount: number;
};

export type BrandRosterEntry = Pick<Brand, "name" | "slug" | "status">;