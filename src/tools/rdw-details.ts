/**
 * Tool: rdw_voertuig_details
 * Full vehicle details combining multiple RDW datasets.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VoertuigDetailsSchema, type VoertuigDetailsInput } from "../schemas/rdw-schemas.js";
import { queryRdw, handleRdwError } from "../services/rdw-client.js";
import { DATASETS } from "../constants.js";
import { normalizeKenteken, validateKenteken } from "../services/kenteken-utils.js";
import { buildVehicleSummary, vehicleSummaryToMarkdown, formatRdwDate } from "../services/formatter.js";
import type { RdwVehicleRecord, RdwFuelRecord } from "../types.js";

export function registerVoertuigDetails(server: McpServer): void {
  server.registerTool(
    "rdw_voertuig_details",
    {
      title: "RDW Voertuig Details",
      description: `Haal uitgebreide voertuigdetails op door meerdere RDW-datasets te combineren: basisgegevens, brandstof/emissies, assen en carrosserie. Geeft het meest complete beeld van een voertuig.

Args:
  - kenteken (string, required): Het kenteken om op te zoeken.

Returns:
  Volledig overzicht uit meerdere datasets:
  - Basisregistratie (merk, model, kleur, bouwjaar, catalogusprijs)
  - Brandstof & milieu (brandstoftype, CO₂, verbruik, emissieklasse, vermogen)
  - Assen (aantal assen, aslast)
  - Carrosserie (type, inrichting)
  - Status & waarschuwingen

Use this tool when you need the COMPLETE picture. Use rdw_kenteken_zoeken for a quicker, lighter lookup.`,
      inputSchema: VoertuigDetailsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: VoertuigDetailsInput) => {
      try {
        const validation = validateKenteken(params.kenteken);
        if (!validation.valid) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: validation.error! }],
          };
        }
        const kenteken = validation.normalized;

        // Fetch ALL datasets in parallel for this kenteken
        const [vehicles, fuelRecords, axles, bodywork] = await Promise.all([
          queryRdw<RdwVehicleRecord>(DATASETS.VEHICLES, { filters: { kenteken } }),
          queryRdw<RdwFuelRecord>(DATASETS.FUEL, { filters: { kenteken } }),
          queryRdw<Record<string, string>>(DATASETS.AXLES, { filters: { kenteken } }),
          queryRdw<Record<string, string>>(DATASETS.BODYWORK, { filters: { kenteken } }),
        ]);

        if (!vehicles || vehicles.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `Geen voertuig gevonden voor kenteken "${params.kenteken}".`,
            }],
          };
        }

        const vehicle = vehicles[0];
        const summary = buildVehicleSummary(vehicle, fuelRecords);
        let markdown = vehicleSummaryToMarkdown(summary);

        // Append axle data
        if (axles && axles.length > 0) {
          markdown += "\n\n### Assen";
          for (const axle of axles) {
            const nr = axle["as_nummer"] ?? "?";
            const load = axle["technisch_toegestane_maximum_aslast"] ?? "?";
            markdown += `\n- **As ${nr}**: max. aslast ${load} kg`;
          }
        }

        // Append bodywork data
        if (bodywork && bodywork.length > 0) {
          markdown += "\n\n### Carrosserie";
          for (const bw of bodywork) {
            const type = bw["type_carrosserie_europese_omschrijving"] ?? bw["carrosserietype"] ?? "Onbekend";
            markdown += `\n- **Type**: ${type}`;
          }
        }

        return {
          content: [{ type: "text" as const, text: markdown }],
          structuredContent: {
            kenteken,
            vehicle: vehicles[0],
            fuel: fuelRecords,
            axles,
            bodywork,
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
