/**
 * Tool: rdw_terugroep_acties
 * Check recall actions for a vehicle (by kenteken) or brand.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TerugroepActiesSchema, type TerugroepActiesInput } from "../schemas/rdw-schemas.js";
import { queryRdw, handleRdwError, soqlEscape } from "../services/rdw-client.js";
import { DATASETS, BRAND_ALIASES } from "../constants.js";
import { normalizeKenteken, validateKenteken } from "../services/kenteken-utils.js";
import { formatRdwDate } from "../services/formatter.js";
import type { RdwVehicleRecord, RdwRecallRecord } from "../types.js";

export function registerTerugroepActies(server: McpServer): void {
  server.registerTool(
    "rdw_terugroep_acties",
    {
      title: "RDW Terugroepacties",
      description: `Zoek terugroepacties (recalls) op bij de RDW. Kan zoeken op merk of op kenteken (haalt dan eerst het merk op). Toont details over het defect, het gevaar, en de te nemen maatregel.

Args:
  - merk (string, optional): Merk om terugroepacties voor te zoeken (bijv. TESLA, BMW).
  - kenteken (string, optional): Kenteken — het merk wordt automatisch opgezocht.
  Minstens één van beide is verplicht.

Returns:
  Lijst van terugroepacties met:
  - Referentiecode
  - Omschrijving defect
  - Gevaar voor mens en milieu
  - Voorgeschreven maatregel
  - Status (open/afgehandeld)
  - Publicatiedatum

Examples:
  - "Terugroepacties voor Tesla" → alle Tesla recalls
  - "Heeft mijn auto (GJ680V) een terugroepactie?" → recalls voor dat voertuigtype
  - "Recalls BMW 3-serie" → zoekt op merk BMW`,
      inputSchema: TerugroepActiesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: TerugroepActiesInput) => {
      try {
        if (!params.merk && !params.kenteken) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: "Geef minstens een 'merk' of 'kenteken' op om terugroepacties te zoeken." }],
          };
        }

        let searchBrand = params.merk ?? "";

        // If kenteken provided, look up the brand first
        if (params.kenteken) {
          const validation = validateKenteken(params.kenteken);
          if (!validation.valid) {
            return {
              isError: true,
              content: [{ type: "text" as const, text: validation.error! }],
            };
          }

          const vehicles = await queryRdw<RdwVehicleRecord>(DATASETS.VEHICLES, {
            filters: { kenteken: validation.normalized },
            select: "kenteken,merk,handelsbenaming,type,openstaande_terugroepactie_indicator",
          });

          if (!vehicles || vehicles.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: `Geen voertuig gevonden voor kenteken "${params.kenteken}".`,
              }],
            };
          }

          const vehicle = vehicles[0];
          searchBrand = vehicle.merk ?? "";

          // Quick check: does the vehicle have an open recall?
          if (vehicle.openstaande_terugroepactie_indicator === "Ja") {
            // Will continue to fetch the actual recalls below
          }
        }

        // Normalize the brand name
        const normalizedBrand = BRAND_ALIASES[searchBrand.toLowerCase()] ?? searchBrand.toUpperCase();

        if (!normalizedBrand) {
          return {
            isError: true,
            content: [{
              type: "text" as const,
              text: "Kon geen merk bepalen. Geef een merk op of een geldig kenteken.",
            }],
          };
        }

        // Query recalls dataset
        const recalls = await queryRdw<RdwRecallRecord>(DATASETS.RECALLS, {
          where: `upper(merk)='${soqlEscape(normalizedBrand)}'`,
          order: "publicatiedatum DESC",
          limit: 50,
        });

        if (!recalls || recalls.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `Geen terugroepacties gevonden voor merk "${normalizedBrand}". Dit kan betekenen dat er geen actieve recalls zijn, of dat het merk anders is geregistreerd bij de RDW.`,
            }],
          };
        }

        // Format results
        const lines: string[] = [];
        lines.push(`## Terugroepacties ${normalizedBrand}`);
        lines.push(`Gevonden: **${recalls.length}** terugroepactie(s)\n`);

        for (const recall of recalls) {
          const defectDesc = recall.omschrijving_defect ?? "Onbekend defect";
          lines.push(`### ${recall.referentiecode_rdw ?? "?"} — ${defectDesc.length > 80 ? defectDesc.slice(0, 80) + "..." : defectDesc}`);
          lines.push(`- **Publicatiedatum**: ${formatRdwDate(recall.publicatiedatum)}`);
          lines.push(`- **Status**: ${recall.status ?? "Onbekend"}`);
          if (recall.gevaar_voor_mens_en_milieu) {
            lines.push(`- **Gevaar**: ${recall.gevaar_voor_mens_en_milieu}`);
          }
          if (recall.maatregel) {
            lines.push(`- **Maatregel**: ${recall.maatregel}`);
          }
          if (recall.producent_ov_fabrikant) {
            lines.push(`- **Fabrikant**: ${recall.producent_ov_fabrikant}`);
          }
          lines.push("");
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
          structuredContent: {
            merk: normalizedBrand,
            total: recalls.length,
            recalls: recalls.map((r) => ({
              referentiecode: r.referentiecode_rdw,
              defect: r.omschrijving_defect,
              gevaar: r.gevaar_voor_mens_en_milieu,
              maatregel: r.maatregel,
              status: r.status,
              publicatiedatum: r.publicatiedatum,
            })),
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
