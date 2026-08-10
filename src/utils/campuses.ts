export type CampusId = "montreal" | "kinshasa";

export type CampusPhone = {
  display: string;
  tel: string;
  whatsapp?: string;
};

export type CampusSchemaAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry: string;
};

export type CampusConfig = {
  id: CampusId;
  address: string;
  phones: CampusPhone[];
  socialHandle?: string;
  schema: {
    address: CampusSchemaAddress;
    telephone: string;
  };
};

export const CAMPUS_STORAGE_KEY = "cdd-campus";

export const CAMPUSES: Record<CampusId, CampusConfig> = {
  montreal: {
    id: "montreal",
    address: "6506 Av. Papineau, Montréal, QC H2G 2X2",
    phones: [
      {
        display: "(514) 712-2927",
        tel: "+15147122927",
      },
    ],
    schema: {
      address: {
        streetAddress: "6506 Av. Papineau",
        addressLocality: "Montréal",
        addressRegion: "QC",
        postalCode: "H2G 2X2",
        addressCountry: "CA",
      },
      telephone: "+1-514-712-2927",
    },
  },
  kinshasa: {
    id: "kinshasa",
    address: "Avenue Bisengemana / Avenue Okapi, Kinshasa",
    phones: [
      {
        display: "+243 825 074 025",
        tel: "+243825074025",
        whatsapp: "243825074025",
      },
      {
        display: "+243 984 593 924",
        tel: "+243984593924",
        whatsapp: "243984593924",
      },
    ],
    socialHandle: "Cité de David Kinshasa",
    schema: {
      address: {
        streetAddress: "Avenue Bisengemana / Avenue Okapi",
        addressLocality: "Kinshasa",
        addressCountry: "CD",
      },
      telephone: "+243-825-074-025",
    },
  },
};

export const DEFAULT_CAMPUS: CampusId = "montreal";

export const isCampusId = (value: string | null | undefined): value is CampusId =>
  value === "montreal" || value === "kinshasa";

export const getCampusConfig = (id: CampusId): CampusConfig => CAMPUSES[id];
