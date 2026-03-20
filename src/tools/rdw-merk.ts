/**
 * Tool: rdw_merk_zoeken
 * Search vehicles by brand/make with optional filters for market analysis.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MerkZoekenSchema, type MerkZoekenInput } from "../schemas/rdw-schemas.js";
import { queryRdw, handleRdwError, soqlEscape } from "../services/rdw-client.js";
import { DATASETS, BRAND_ALIASES, FUEL_ALIASES } from "../constants.js";
import { vehicleListToMarkdown } from "../services/formatter.js";
import type { RdwVehicleRecord } from "../types.js";

export function registerMerkZoeken(server: McpServer): void {
  server.registerTool(
    "rdw_merk_zoeken",
    {
      title: "RDW Merk Zoeken",
      description: `Zoek voertuigen op merk (brand) met optionele filters op model, bouwjaar, brandstof en kleur. Ideaal voor marktanalyse en voertuigoverzichten.

Args:
  - merk (string, required): Merk/fabrikant (bijv. Tesla, BMW, Mercedes). Afkortingen worden herkend.
  - model (string, optional): Model filter (bijv. Model 3, GOLF, 3-SERIE).
  - bouwjaar_vanaf (number, optional): Minimaal bouwjaar.
  - bouwjaar_tot (number, optional): Maximaal bouwjaar.
  - brandstof (string, optional): Brandstoftype (benzine, diesel, elektrisch, hybride, lpg, cng, waterstof).
  - kleur (string, optional): Kleur (GRIJS, ZWART, WIT, BLAUW, ROOD, etc.).
  - limit (number, optional): Max. resultaten (standaard: 25, max: 200).

Returns:
  Tabel met gevonden voertuigen:
  - Kenteken, Merk, Model, Kleur, Eerste toelating, APK vervaldatum

Examples:
  - "Alle Tesla Model 3" → merk=Tesla, model=Model 3
  - "Rode Porsches na 2020" → merk=Porsche, kleur=ROOD, bouwjaar_vanaf=2020
  - "Elektrische auto's van Hyundai" → merk=Hyundai, brandstof=elektrisch`,
      inputSchema: MerkZoekenSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: MerkZoekenInput) => {
      try {
        // Normalize brand
        const brand = BRAND_ALIASES[params.merk.toLowerCase()] ?? params.merk.toUpperCase();

        // Build SODA $where clause
        const conditions: string[] = [];
        conditions.push(`merk='${soqlEscape(brand)}'`);

        if (params.model) {
          conditions.push(`upper(handelsbenaming) like '%${soqlEscape(params.model.toUpperCase())}%'`);
        }

        if (params.bouwjaar_vanaf) {
          const dateFrom = `${params.bouwjaar_vanaf}0101`;
          conditions.push(`datum_eerste_toelating >= '${dateFrom}'`);
        }

        if (params.bouwjaar_tot) {
          const dateTo = `${params.bouwjaar_tot}1231`;
          conditions.push(`datum_eerste_toelating <= '${dateTo}'`);
        }

        if (params.kleur) {
          conditions.push(`eerste_kleur='${soqlEscape(params.kleur.toUpperCase())}'`);
        }

        const whereClause = conditions.join(" AND ");

        // If fuel filter is specified, we need to join with the fuel dataset
        // For simplicity, first query vehicles, then filter
        let vehicles = await queryRdw<RdwVehicleRecord>(DATASETS.VEHICLES, {
          where: whereClause,
          order: "datum_eerste_toelating DESC",
          limit: params.brandstof ? params.limit * 3 : params.limit, // Over-fetch if filtering by fuel
        });

        // Filter by fuel type if specified
        if (params.brandstof && vehicles.length > 0) {
          const fuelType = FUEL_ALIASES[params.brandstof.toLowerCase()] ?? params.brandstof;
          // Look up fuel data for these vehicles
          const kentekens = vehicles.map((v) => v.kenteken);
          // Batch: query fuel for first N vehicles
          const batchSize = Math.min(kentekens.length, params.limit * 2);
          const fuelChecks = await Promise.all(
            kentekens.slice(0, batchSize).map((k) =>
              queryRdw<Record<string, string>>(DATASETS.FUEL, {
                filters: { kenteken: k },
                select: "kenteken,brandstof_omschrijving",
                limit: 1,
              }).then((f) => ({
                kenteken: k,
                fuel: f[0]?.brandstof_omschrijving ?? "",
              }))
            )
          );

          const matchingKentekens = new Set(
            fuelChecks
              .filter((f) => f.fuel.toLowerCase().includes(fuelType.toLowerCase()))
              .map((f) => f.kenteken)
          );

          vehicles = vehicles.filter((v) => matchingKentekens.has(v.kenteken));
        }

        // Trim to requested limit
        vehicles = vehicles.slice(0, params.limit);

        if (vehicles.length === 0) {
          const desc = [brand];
          if (params.model) desc.push(params.model);
          if (params.brandstof) desc.push(params.brandstof);
          if (params.kleur) desc.push(params.kleur);
          return {
            content: [{
              type: "text" as const,
              text: `Geen voertuigen gevonden voor: ${desc.join(", ")}. Probeer bredere zoektermen of controleer de spelling.`,
            }],
          };
        }

        const markdown = vehicleListToMarkdown(vehicles);

        return {
          content: [{ type: "text" as const, text: markdown }],
          structuredContent: {
            merk: brand,
            filters: {
              model: params.model,
              bouwjaar_vanaf: params.bouwjaar_vanaf,
              bouwjaar_tot: params.bouwjaar_tot,
              brandstof: params.brandstof,
              kleur: params.kleur,
            },
            total: vehicles.length,
            vehicles,
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
