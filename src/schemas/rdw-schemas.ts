/**
 * Zod input schemas for all RDW MCP tools.
 */

import { z } from "zod";

export const KentekenZoekenSchema = z.object({
  kenteken: z
    .string()
    .min(4, "Kenteken moet minimaal 4 tekens zijn")
    .max(12, "Kenteken mag maximaal 12 tekens zijn")
    .describe("Nederlands kenteken (license plate). Streepjes worden automatisch verwijderd. Voorbeelden: GJ680V, 12-AB-CD, H-123-BB"),
}).strict();

export type KentekenZoekenInput = z.infer<typeof KentekenZoekenSchema>;

export const VoertuigDetailsSchema = z.object({
  kenteken: z
    .string()
    .min(4, "Kenteken moet minimaal 4 tekens zijn")
    .max(12, "Kenteken mag maximaal 12 tekens zijn")
    .describe("Nederlands kenteken (license plate). Streepjes worden automatisch verwijderd."),
}).strict();

export type VoertuigDetailsInput = z.infer<typeof VoertuigDetailsSchema>;

export const ApkStatusSchema = z.object({
  kenteken: z
    .string()
    .min(4, "Kenteken moet minimaal 4 tekens zijn")
    .max(12, "Kenteken mag maximaal 12 tekens zijn")
    .describe("Nederlands kenteken om APK-status voor op te zoeken."),
}).strict();

export type ApkStatusInput = z.infer<typeof ApkStatusSchema>;

export const TerugroepActiesSchema = z.object({
  merk: z
    .string()
    .optional()
    .describe("Merk/fabrikant om terugroepacties voor op te zoeken (bijv. TESLA, BMW, VOLKSWAGEN). Optioneel als kenteken is opgegeven."),
  kenteken: z
    .string()
    .optional()
    .describe("Kenteken om terugroepacties voor het specifieke voertuigtype op te zoeken. Optioneel als merk is opgegeven."),
}).strict();

export type TerugroepActiesInput = z.infer<typeof TerugroepActiesSchema>;

export const MerkZoekenSchema = z.object({
  merk: z
    .string()
    .min(1, "Merk is verplicht")
    .describe("Merk/fabrikant om te zoeken (bijv. Tesla, BMW, Mercedes). Veelgebruikte afkortingen worden automatisch herkend."),
  model: z
    .string()
    .optional()
    .describe("Specifiek model om te filteren (bijv. Model 3, 3-SERIE, GOLF). Optioneel."),
  bouwjaar_vanaf: z
    .number()
    .int()
    .min(1900)
    .max(2030)
    .optional()
    .describe("Minimaal bouwjaar (jaar van eerste toelating). Optioneel."),
  bouwjaar_tot: z
    .number()
    .int()
    .min(1900)
    .max(2030)
    .optional()
    .describe("Maximaal bouwjaar (jaar van eerste toelating). Optioneel."),
  brandstof: z
    .string()
    .optional()
    .describe("Brandstoftype filter: benzine, diesel, elektrisch, hybride, lpg, cng, waterstof. Optioneel."),
  kleur: z
    .string()
    .optional()
    .describe("Kleur filter (bijv. GRIJS, ZWART, WIT, BLAUW, ROOD). Optioneel."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .default(25)
    .describe("Maximum aantal resultaten (standaard: 25, max: 200)."),
}).strict();

export type MerkZoekenInput = z.infer<typeof MerkZoekenSchema>;

export const SlimZoekenSchema = z.object({
  query: z
    .string()
    .min(3, "Zoekopdracht moet minimaal 3 tekens zijn")
    .max(500, "Zoekopdracht mag maximaal 500 tekens zijn")
    .describe("Natuurlijke-taal zoekopdracht over voertuigdata. Voorbeelden: 'alle Tesla Model 3 uit 2020', 'dieselautos ouder dan 10 jaar', 'rode Porsches', 'voertuigen met verlopen APK'."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .default(25)
    .describe("Maximum aantal resultaten (standaard: 25, max: 200)."),
}).strict();

export type SlimZoekenInput = z.infer<typeof SlimZoekenSchema>;
