/**
 * Constants for the RDW MCP Server
 */

// RDW Socrata/SODA API base URL
export const RDW_BASE_URL = "https://opendata.rdw.nl/resource";

// RDW Dataset resource IDs
export const DATASETS = {
  /** Gekentekende voertuigen — main vehicle registration data */
  VEHICLES: "m9d7-ebf2",
  /** Gekentekende voertuigen brandstof — fuel/emission data */
  FUEL: "8ys7-d773",
  /** Gekentekende voertuigen assen — axle data */
  AXLES: "3huj-srit",
  /** Gekentekende voertuigen carrosserie — bodywork data */
  BODYWORK: "vezc-m2t6",
  /** Gekentekende voertuigen carrosserie specifiek — specific bodywork */
  BODYWORK_SPECIFIC: "jhie-znh9",
  /** Gekentekende voertuigen voertuigklasse — vehicle class */
  VEHICLE_CLASS: "kmfi-hrps",
  /** Open Data RDW: Terugroep_actie — recall actions */
  RECALLS: "af5r-44mf",
  /** Open Data RDW: Gebreken — APK inspection defects */
  APK_DEFECTS: "a34c-vvps",
  /** Open Data RDW: Geconstateerde_Gebreken — observed APK defects */
  APK_OBSERVED: "2u8a-sfar",
} as const;

// Maximum response size in characters
export const CHARACTER_LIMIT = 25000;

// API request timeout in milliseconds
export const REQUEST_TIMEOUT = 10000;

// Rate limiting: max concurrent requests to RDW API
export const MAX_CONCURRENT_REQUESTS = 10;

// Cache TTL in milliseconds (1 hour)
export const CACHE_TTL = 60 * 60 * 1000;

// Maximum results from SODA API per query
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 1000;

// Dutch kenteken (license plate) patterns
// Modern formats: XX-999-X, 9-XXX-99, 99-XXX-9, X-999-XX, etc.
export const KENTEKEN_PATTERN = /^[A-Z0-9]{1,3}[-]?[A-Z0-9]{1,4}[-]?[A-Z0-9]{1,3}$/i;

// Common brand name mappings (fuzzy → official RDW name)
export const BRAND_ALIASES: Record<string, string> = {
  "mercedes": "MERCEDES-BENZ",
  "merc": "MERCEDES-BENZ",
  "benz": "MERCEDES-BENZ",
  "bmw": "BMW",
  "vw": "VOLKSWAGEN",
  "volkswagen": "VOLKSWAGEN",
  "audi": "AUDI",
  "tesla": "TESLA",
  "toyota": "TOYOTA",
  "ford": "FORD",
  "opel": "OPEL",
  "peugeot": "PEUGEOT",
  "renault": "RENAULT",
  "citroën": "CITROEN",
  "citroen": "CITROEN",
  "fiat": "FIAT",
  "volvo": "VOLVO",
  "skoda": "SKODA",
  "škoda": "SKODA",
  "seat": "SEAT",
  "hyundai": "HYUNDAI",
  "kia": "KIA",
  "nissan": "NISSAN",
  "honda": "HONDA",
  "mazda": "MAZDA",
  "suzuki": "SUZUKI",
  "mitsubishi": "MITSUBISHI",
  "mini": "MINI",
  "porsche": "PORSCHE",
  "land rover": "LAND ROVER",
  "landrover": "LAND ROVER",
  "range rover": "LAND ROVER",
  "jaguar": "JAGUAR",
  "alfa romeo": "ALFA ROMEO",
  "alfa": "ALFA ROMEO",
  "dacia": "DACIA",
  "jeep": "JEEP",
  "lexus": "LEXUS",
  "subaru": "SUBARU",
  "smart": "SMART",
  "ds": "DS",
  "cupra": "CUPRA",
  "mg": "MG",
  "byd": "BYD",
  "polestar": "POLESTAR",
  "lynk": "LYNK & CO",
  "lynk & co": "LYNK & CO",
};

// Dutch fuel type mappings
export const FUEL_ALIASES: Record<string, string> = {
  "benzine": "Benzine",
  "diesel": "Diesel",
  "elektrisch": "Elektriciteit",
  "electric": "Elektriciteit",
  "elektriciteit": "Elektriciteit",
  "ev": "Elektriciteit",
  "hybride": "Benzine", // will combine with klasse_hybride check
  "hybrid": "Benzine",
  "lpg": "LPG",
  "cng": "CNG",
  "waterstof": "Waterstof",
  "hydrogen": "Waterstof",
};

// Field label translations (API field → Dutch label / English label)
export const FIELD_LABELS: Record<string, { nl: string; en: string }> = {
  kenteken: { nl: "Kenteken", en: "License plate" },
  voertuigsoort: { nl: "Voertuigsoort", en: "Vehicle type" },
  merk: { nl: "Merk", en: "Brand" },
  handelsbenaming: { nl: "Model", en: "Model" },
  vervaldatum_apk: { nl: "APK vervaldatum", en: "MOT expiry date" },
  datum_tenaamstelling: { nl: "Tenaamstelling", en: "Registration date" },
  datum_eerste_toelating: { nl: "Eerste toelating", en: "First admission" },
  datum_eerste_tenaamstelling_in_nederland: { nl: "Eerste tenaamstelling NL", en: "First NL registration" },
  inrichting: { nl: "Inrichting", en: "Body type" },
  aantal_zitplaatsen: { nl: "Zitplaatsen", en: "Seats" },
  eerste_kleur: { nl: "Kleur", en: "Color" },
  tweede_kleur: { nl: "Tweede kleur", en: "Second color" },
  aantal_cilinders: { nl: "Cilinders", en: "Cylinders" },
  cilinderinhoud: { nl: "Cilinderinhoud (cc)", en: "Displacement (cc)" },
  massa_ledig_voertuig: { nl: "Leeg gewicht (kg)", en: "Empty weight (kg)" },
  massa_rijklaar: { nl: "Rijklaar gewicht (kg)", en: "Curb weight (kg)" },
  toegestane_maximum_massa: { nl: "Max. massa (kg)", en: "Max. weight (kg)" },
  lengte: { nl: "Lengte (cm)", en: "Length (cm)" },
  breedte: { nl: "Breedte (cm)", en: "Width (cm)" },
  catalogusprijs: { nl: "Catalogusprijs (€)", en: "Catalog price (€)" },
  zuinigheidslabel: { nl: "Energielabel", en: "Energy label" },
  wam_verzekerd: { nl: "WAM verzekerd", en: "Insurance (WAM)" },
  export_indicator: { nl: "Geëxporteerd", en: "Exported" },
  openstaande_terugroepactie_indicator: { nl: "Openstaande terugroepactie", en: "Open recall" },
  taxi_indicator: { nl: "Taxi", en: "Taxi" },
  maximum_snelheid: { nl: "Max. snelheid (km/h)", en: "Max. speed (km/h)" },
  europese_voertuigcategorie: { nl: "EU voertuigcategorie", en: "EU vehicle category" },
  type: { nl: "Type", en: "Type" },
  typegoedkeuringsnummer: { nl: "Typegoedkeuringsnr.", en: "Type approval nr." },
  vermogen_massarijklaar: { nl: "Vermogen/massa", en: "Power/mass ratio" },
  wielbasis: { nl: "Wielbasis (cm)", en: "Wheelbase (cm)" },
  aantal_wielen: { nl: "Aantal wielen", en: "Number of wheels" },
  brandstof_omschrijving: { nl: "Brandstof", en: "Fuel type" },
  co2_uitstoot_gecombineerd: { nl: "CO₂ uitstoot (g/km)", en: "CO₂ emissions (g/km)" },
  emissieklasse: { nl: "Emissieklasse", en: "Emission class" },
  nettomaximumvermogen: { nl: "Vermogen (kW)", en: "Power (kW)" },
  brandstofverbruik_gecombineerd: { nl: "Verbruik gecombineerd (l/100km)", en: "Fuel consumption combined (l/100km)" },
  brandstofverbruik_stad: { nl: "Verbruik stad (l/100km)", en: "Fuel consumption city (l/100km)" },
  brandstofverbruik_buiten: { nl: "Verbruik buiten (l/100km)", en: "Fuel consumption highway (l/100km)" },
};
