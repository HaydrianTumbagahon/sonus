export type GlossaryImage = {
  url: string;
  alt: string;
  credit: string;
  sourcePage: string;
};

export const glossaryImages: Record<string, GlossaryImage> = {
  "dynamic-driver": {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Dynamischer_Tiefton-Lautsprecher_(geschnittenes_Original).jpg?width=900",
    alt: "Cutaway diagram of a dynamic low-frequency loudspeaker driver",
    credit: "Journey234, public domain",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Dynamischer_Tiefton-Lautsprecher_(geschnittenes_Original).jpg",
  },
};
