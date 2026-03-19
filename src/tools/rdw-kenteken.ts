/**
 * Tool: rdw_kenteken_zoeken
 * Quick license plate lookup — returns core vehicle info for a single kenteken.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KentekenZoekenSchema, type KentekenZoekenInput } from "../schemas/rdw-schemas.js";
import { queryRdw, handleRdwError } from "../services/rdw-client.js";
import { DATASETS } from "../constants.js";
import { normalizeKenteken, validateKenteken } from "../services/kenteken-utils.js";
import { buildVehicleSummary, vehicleSummaryToMarkdown } from "../services/formatter.js";
import type { RdwVehicleRecord, RdwFuelRecord } from "../types.js";

export function registerKentekenZoeken(server: McpServer): void {
  server.registerTool(
    "rdw_kenteken_zoeken",
    {
      title: "RDW Kenteken Opzoeken",
      description: `Zoek een voertuig op via het Nederlandse kenteken (license plate). Geeft uitgebreide voertuiginformatie terug inclusief merk, model, kleur, APK-status, brandstofgegevens, en eventuele waarschuwingen (verlopen APK, openstaande terugroepacties, etc.).

Args:
  - kenteken (string, required): Het kenteken om op te zoeken. Streepjes en spaties worden automatisch verwijderd.

Returns:
  Gestructureerd overzicht met:
  - Identificatie (merk, model, kleur, bouwjaar)
  - Technische specs (gewicht, vermogen, afmetingen)
  - Milieu & brandstof (brandstoftype, CO₂, verbruik)
  - Status (APK, verzekering, terugroepacties)
  - Waarschuwingen bij problemen

Examples:
  - "Zoek kenteken GJ680V" → voertuiggegevens voor dat kenteken
  - "Wat voor auto is 12-AB-CD?" → uitgebreide voertuiginfo
  - "Check kenteken H123BB" → voertuiggegevens inclusief APK-status

Error handling:
  - Ongeldig formaat: suggestie voor correct formaat
  - Niet gevonden: melding dat het kenteken niet in de RDW database staat
  - API fout: duidelijke foutmelding met suggestie om het opnieuw te proberen`,
      inputSchema: KentekenZoekenSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: KentekenZoekenInput) => {
      try {
        // Validate and normalize
        const validation = validateKenteken(params.kenteken);
        if (!validation.valid) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: validation.error! }],
          };
        }
        const kenteken = validation.normalized;

        // Fetch vehicle + fuel data in parallel
        const [vehicles, fuelRecords] = await Promise.all([
          queryRdw<RdwVehicleRecord>(DATASETS.VEHICLES, { filters: { kenteken } }),
          queryRdw<RdwFuelRecord>(DATASETS.FUEL, { filters: { kenteken } }),
        ]);

        if (!vehicles || vehicles.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `Geen voertuig gevonden voor kenteken "${params.kenteken}". Controleer of het kenteken correct is. Kentekens van geëxporteerde of gesloopte voertuigen staan mogelijk niet meer in de database.`,
            }],
          };
        }

        const vehicle = vehicles[0];
        const summary = buildVehicleSummary(vehicle, fuelRecords);
        const markdown = vehicleSummaryToMarkdown(summary);

        return {
          content: [{ type: "text" as const, text: markdown }],
          structuredContent: {
            kenteken,
            vehicle: vehicles[0],
            fuel: fuelRecords,
            summary,
          },
        };
      } catch (error: unknown) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: handleRdwError(error) }],
        };
      }
    }
  );
}
