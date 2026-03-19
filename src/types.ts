/**
 * TypeScript type definitions for the RDW MCP Server
 */

/** Raw vehicle record from the RDW Gekentekende_voertuigen dataset */
export interface RdwVehicleRecord {
  kenteken: string;
  voertuigsoort?: string;
  merk?: string;
  handelsbenaming?: string;
  vervaldatum_apk?: string;
  datum_tenaamstelling?: string;
  datum_eerste_toelating?: string;
  datum_eerste_tenaamstelling_in_nederland?: string;
  datum_eerste_afgifte_nederland?: string;
  bruto_bpm?: string;
  inrichting?: string;
  aantal_zitplaatsen?: string;
  eerste_kleur?: string;
  tweede_kleur?: string;
  aantal_cilinders?: string;
  cilinderinhoud?: string;
  massa_ledig_voertuig?: string;
  massa_rijklaar?: string;
  toegestane_maximum_massa?: string;
  maximum_massa_samenstelling?: string;
  lengte?: string;
  breedte?: string;
  europese_voertuigcategorie?: string;
  type?: string;
  typegoedkeuringsnummer?: string;
  variant?: string;
  uitvoering?: string;
  vermogen_massarijklaar?: string;
  wielbasis?: string;
  catalogusprijs?: string;
  zuinigheidslabel?: string;
  wam_verzekerd?: string;
  export_indicator?: string;
  openstaande_terugroepactie_indicator?: string;
  taxi_indicator?: string;
  maximum_snelheid?: string;
  aantal_wielen?: string;
  maximale_constructiesnelheid?: string;
  laadvermogen?: string;
  wacht_op_keuren?: string;
  [key: string]: string | undefined;
}

/** Raw fuel record from the RDW brandstof dataset */
export interface RdwFuelRecord {
  kenteken: string;
  brandstof_volgnummer?: string;
  brandstof_omschrijving?: string;
  brandstofverbruik_buiten?: string;
  brandstofverbruik_gecombineerd?: string;
  brandstofverbruik_stad?: string;
  co2_uitstoot_gecombineerd?: string;
  co2_uitstoot_gewogen?: string;
  emissieklasse?: string;
  geluidsniveau_rijdend?: string;
  geluidsniveau_stationair?: string;
  milieuklasse_eg_goedkeuring_licht?: string;
  nettomaximumvermogen?: string;
  nominaal_continu_maximumvermogen?: string;
  klasse_hybride_elektrisch_voertuig?: string;
  [key: string]: string | undefined;
}

/** Raw recall record from the RDW terugroepacties dataset */
export interface RdwRecallRecord {
  referentiecode_rdw?: string;
  merk?: string;
  type_code?: string;
  code_uitvoering?: string;
  producent_ov_fabrikant?: string;
  omschrijving_defect?: string;
  gevaar_voor_mens_en_milieu?: string;
  maatregel?: string;
  status?: string;
  publicatiedatum?: string;
  referentiecode_fabrikant?: string;
  [key: string]: string | undefined;
}

/** Cache entry with TTL */
export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/** Formatted vehicle summary for LLM output */
export interface VehicleSummary {
  identification: Record<string, string>;
  technical: Record<string, string>;
  environmental: Record<string, string>;
  status: Record<string, string>;
  alerts: string[];
}
