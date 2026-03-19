/**
 * Response formatting utilities for LLM-friendly output.
 * Provides both structured JSON and human-readable markdown.
 */

import { FIELD_LABELS } from "../constants.js";
import type { RdwVehicleRecord, RdwFuelRecord, VehicleSummary } from "../types.js";

/**
 * Normalize a raw RDW date string (YYYYMMDD) to a readable format.
 */
export function formatRdwDate(raw: string | undefined): string {
  if (!raw || raw.length < 8) return "Onbekend";
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  return `${d}-${m}-${y}`;
}

/**
 * Check if an APK date is expired.
 */
export function isApkExpired(vervaldatum: string | undefined): boolean {
  if (!vervaldatum || vervaldatum.length < 8) return false;
  const y = parseInt(vervaldatum.slice(0, 4), 10);
  const m = parseInt(vervaldatum.slice(4, 6), 10) - 1;
  const d = parseInt(vervaldatum.slice(6, 8), 10);
  const expiry = new Date(y, m, d);
  return expiry < new Date();
}

/**
 * Get a label for a field, with both Dutch and English.
 */
function label(field: string): string {
  const l = FIELD_LABELS[field];
  return l ? l.nl : field;
}

/**
 * Build a structured vehicle summary from raw records.
 */
export function buildVehicleSummary(
  vehicle: RdwVehicleRecord,
  fuel?: RdwFuelRecord[]
): VehicleSummary {
  const alerts: string[] = [];

  // Check APK status
  if (isApkExpired(vehicle.vervaldatum_apk)) {
    alerts.push("⚠️ APK VERLOPEN — dit voertuig heeft een verlopen APK-keuring!");
  }

  // Check recalls
  if (vehicle.openstaande_terugroepactie_indicator === "Ja") {
    alerts.push("⚠️ OPENSTAANDE TERUGROEPACTIE — er loopt een terugroepactie voor dit voertuig!");
  }

  // Check export
  if (vehicle.export_indicator === "Ja") {
    alerts.push("ℹ️ Dit voertuig is geëxporteerd.");
  }

  // Check WAM insurance
  if (vehicle.wam_verzekerd === "Nee") {
    alerts.push("⚠️ NIET WAM-VERZEKERD — dit voertuig is niet WA-verzekerd!");
  }

  const identification: Record<string, string> = {};
  addIfPresent(identification, "kenteken", vehicle.kenteken);
  addIfPresent(identification, "merk", vehicle.merk);
  addIfPresent(identification, "handelsbenaming", vehicle.handelsbenaming);
  addIfPresent(identification, "voertuigsoort", vehicle.voertuigsoort);
  addIfPresent(identification, "inrichting", vehicle.inrichting);
  addIfPresent(identification, "eerste_kleur", vehicle.eerste_kleur);
  if (vehicle.tweede_kleur && vehicle.tweede_kleur !== "Niet geregistreerd") {
    addIfPresent(identification, "tweede_kleur", vehicle.tweede_kleur);
  }
  addIfPresent(identification, "datum_eerste_toelating", formatRdwDate(vehicle.datum_eerste_toelating));
  addIfPresent(identification, "datum_eerste_tenaamstelling_in_nederland", formatRdwDate(vehicle.datum_eerste_tenaamstelling_in_nederland));

  const technical: Record<string, string> = {};
  addIfPresent(technical, "aantal_cilinders", vehicle.aantal_cilinders);
  addIfPresent(technical, "cilinderinhoud", vehicle.cilinderinhoud);
  addIfPresent(technical, "massa_rijklaar", vehicle.massa_rijklaar);
  addIfPresent(technical, "massa_ledig_voertuig", vehicle.massa_ledig_voertuig);
  addIfPresent(technical, "toegestane_maximum_massa", vehicle.toegestane_maximum_massa);
  addIfPresent(technical, "aantal_zitplaatsen", vehicle.aantal_zitplaatsen);
  addIfPresent(technical, "aantal_wielen", vehicle.aantal_wielen);
  addIfPresent(technical, "lengte", vehicle.lengte);
  addIfPresent(technical, "breedte", vehicle.breedte);
  addIfPresent(technical, "wielbasis", vehicle.wielbasis);
  addIfPresent(technical, "maximum_snelheid", vehicle.maximum_snelheid);
  addIfPresent(technical, "catalogusprijs", vehicle.catalogusprijs);
  addIfPresent(technical, "europese_voertuigcategorie", vehicle.europese_voertuigcategorie);

  const environmental: Record<string, string> = {};
  addIfPresent(environmental, "zuinigheidslabel", vehicle.zuinigheidslabel);

  // Add fuel data if available
  if (fuel && fuel.length > 0) {
    const primary = fuel[0];
    addIfPresent(environmental, "brandstof_omschrijving", primary.brandstof_omschrijving);
    addIfPresent(environmental, "co2_uitstoot_gecombineerd", primary.co2_uitstoot_gecombineerd);
    addIfPresent(environmental, "emissieklasse", primary.emissieklasse);
    addIfPresent(environmental, "nettomaximumvermogen", primary.nettomaximumvermogen);
    addIfPresent(environmental, "brandstofverbruik_gecombineerd", primary.brandstofverbruik_gecombineerd);
    addIfPresent(environmental, "brandstofverbruik_stad", primary.brandstofverbruik_stad);
    addIfPresent(environmental, "brandstofverbruik_buiten", primary.brandstofverbruik_buiten);
    if (primary.klasse_hybride_elektrisch_voertuig) {
      environmental[label("klasse_hybride_elektrisch_voertuig")] = primary.klasse_hybride_elektrisch_voertuig;
    }
    // Add secondary fuel if present
    if (fuel.length > 1) {
      const secondary = fuel[1];
      environmental["Tweede brandstof"] = secondary.brandstof_omschrijving ?? "Onbekend";
    }
  }

  const status: Record<string, string> = {};
  addIfPresent(status, "vervaldatum_apk", formatRdwDate(vehicle.vervaldatum_apk));
  status["APK status"] = isApkExpired(vehicle.vervaldatum_apk) ? "❌ Verlopen" : "✅ Geldig";
  addIfPresent(status, "wam_verzekerd", vehicle.wam_verzekerd);
  addIfPresent(status, "export_indicator", vehicle.export_indicator);
  addIfPresent(status, "openstaande_terugroepactie_indicator", vehicle.openstaande_terugroepactie_indicator);
  addIfPresent(status, "taxi_indicator", vehicle.taxi_indicator);

  return { identification, technical, environmental, status, alerts };
}

/**
 * Convert a VehicleSummary to a markdown string.
 */
export function vehicleSummaryToMarkdown(summary: VehicleSummary): string {
  const lines: string[] = [];

  // Alerts first
  if (summary.alerts.length > 0) {
    for (const alert of summary.alerts) {
      lines.push(alert);
    }
    lines.push("");
  }

  // Headline from identification
  const brand = summary.identification[label("merk")] ?? "";
  const model = summary.identification[label("handelsbenaming")] ?? "";
  const plate = summary.identification[label("kenteken")] ?? "";
  lines.push(`## ${brand} ${model} (${plate})`);
  lines.push("");

  lines.push("### Identificatie");
  for (const [k, v] of Object.entries(summary.identification)) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");

  lines.push("### Technische specificaties");
  for (const [k, v] of Object.entries(summary.technical)) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");

  lines.push("### Milieu & brandstof");
  for (const [k, v] of Object.entries(summary.environmental)) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");

  lines.push("### Status");
  for (const [k, v] of Object.entries(summary.status)) {
    lines.push(`- **${k}**: ${v}`);
  }

  return lines.join("\n");
}

/**
 * Format a list of vehicles as a concise markdown table.
 */
export function vehicleListToMarkdown(vehicles: RdwVehicleRecord[]): string {
  if (vehicles.length === 0) return "Geen voertuigen gevonden.";

  const lines: string[] = [];
  lines.push(`Gevonden: **${vehicles.length} voertuig(en)**\n`);
  lines.push("| Kenteken | Merk | Model | Kleur | Eerste toelating | APK vervalt |");
  lines.push("|----------|------|-------|-------|-----------------|-------------|");

  for (const v of vehicles) {
    const apkDate = formatRdwDate(v.vervaldatum_apk);
    const expired = isApkExpired(v.vervaldatum_apk) ? " ❌" : "";
    lines.push(
      `| ${v.kenteken ?? ""} | ${v.merk ?? ""} | ${v.handelsbenaming ?? ""} | ${v.eerste_kleur ?? ""} | ${formatRdwDate(v.datum_eerste_toelating)} | ${apkDate}${expired} |`
    );
  }

  return lines.join("\n");
}

// Helper to add field with Dutch label if value is present
function addIfPresent(obj: Record<string, string>, field: string, value: string | undefined): void {
  if (value !== undefined && value !== null && value !== "") {
    obj[label(field)] = value;
  }
}
