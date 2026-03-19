/**
 * Tool: rdw_slim_zoeken
 * Smart/natural language search — translates Dutch/English queries into SODA API filters.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SlimZoekenSchema, type SlimZoekenInput } from "../schemas/rdw-schemas.js";
import { queryRdw, handleRdwError } from "../services/rdw-client.js";
import { DATASETS, BRAND_ALIASES, FUEL_ALIASES } from "../constants.js";
import { vehicleListToMarkdown, isApkExpired } from "../services/formatter.js";
import type { RdwVehicleRecord } from "../types.js";

interface ParsedQuery {
  conditions: string[];
  description: string[];
}

/**
 * Parse a natural language query into SODA filter conditions.
 */
function parseNaturalQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase();
  const conditions: string[] = [];
  const description: string[] = [];

  // --- Brand detection ---
  for (const [alias, official] of Object.entries(BRAND_ALIASES)) {
    if (lower.includes(alias)) {
      conditions.push(`merk='${official}'`);
      description.push(`Merk: ${official}`);
      break; // Take first match
    }
  }

  // --- Model detection ---
  const modelPatterns = [
    /model\s+(\w+)/i,
    /(\d-serie)/i,
    /(golf|polo|passat|tiguan|touran)/i,
    /(corsa|astra|mokka|insignia)/i,
    /(model\s*[3sxy])/i,
    /(c-klasse|e-klasse|s-klasse|a-klasse|gle|glc|gla)/i,
    /(308|208|508|3008|5008)/i,
    /(clio|megane|captur|scenic)/i,
  ];
  for (const pattern of modelPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const model = match[1].toUpperCase();
      conditions.push(`upper(handelsbenaming) like '%${model}%'`);
      description.push(`Model: ${model}`);
      break;
    }
  }

  // --- Year / age detection ---
  const yearMatch = lower.match(/(?:uit|van|from|bouwjaar)\s*(\d{4})/);
  if (yearMatch) {
    const year = yearMatch[1];
    conditions.push(`datum_eerste_toelating >= '${year}0101'`);
    conditions.push(`datum_eerste_toelating <= '${year}1231'`);
    description.push(`Bouwjaar: ${year}`);
  }

  const afterYearMatch = lower.match(/(?:na|after|vanaf|nieuwer dan)\s*(\d{4})/);
  if (afterYearMatch) {
    conditions.push(`datum_eerste_toelating >= '${afterYearMatch[1]}0101'`);
    description.push(`Bouwjaar vanaf: ${afterYearMatch[1]}`);
  }

  const beforeYearMatch = lower.match(/(?:voor|before|tot|ouder dan jaar)\s*(\d{4})/);
  if (beforeYearMatch) {
    conditions.push(`datum_eerste_toelating <= '${beforeYearMatch[1]}1231'`);
    description.push(`Bouwjaar tot: ${beforeYearMatch[1]}`);
  }

  // "ouder dan X jaar"
  const olderThanMatch = lower.match(/ouder\s*dan\s*(\d+)\s*jaar/);
  if (olderThanMatch) {
    const yearsAgo = parseInt(olderThanMatch[1], 10);
    const cutoffYear = new Date().getFullYear() - yearsAgo;
    conditions.push(`datum_eerste_toelating <= '${cutoffYear}1231'`);
    description.push(`Ouder dan ${yearsAgo} jaar (voor ${cutoffYear})`);
  }

  // "nieuwer dan X jaar"
  const newerThanMatch = lower.match(/nieuwer\s*dan\s*(\d+)\s*jaar/);
  if (newerThanMatch) {
    const yearsAgo = parseInt(newerThanMatch[1], 10);
    const cutoffYear = new Date().getFullYear() - yearsAgo;
    conditions.push(`datum_eerste_toelating >= '${cutoffYear}0101'`);
    description.push(`Nieuwer dan ${yearsAgo} jaar (na ${cutoffYear})`);
  }

  // --- Color detection ---
  const colors = ["grijs", "zwart", "wit", "blauw", "rood", "groen", "geel", "oranje", "bruin", "zilver", "beige"];
  for (const color of colors) {
    if (lower.includes(color)) {
      conditions.push(`eerste_kleur='${color.toUpperCase()}'`);
      description.push(`Kleur: ${color.toUpperCase()}`);
      break;
    }
  }

  // --- Fuel type detection ---
  for (const [alias, official] of Object.entries(FUEL_ALIASES)) {
    if (lower.includes(alias)) {
      // Fuel is in a separate dataset, we'll note it for post-filtering
      description.push(`Brandstof: ${official}`);
      break;
    }
  }

  // --- Vehicle type ---
  if (lower.includes("motor") || lower.includes("motorfiets")) {
    conditions.push(`voertuigsoort='Motorfiets'`);
    description.push("Voertuigsoort: Motorfiets");
  } else if (lower.includes("bus")) {
    conditions.push(`voertuigsoort='Bus'`);
    description.push("Voertuigsoort: Bus");
  } else if (lower.includes("vrachtwagen") || lower.includes("truck")) {
    conditions.push(`voertuigsoort='Bedrijfsauto'`);
    description.push("Voertuigsoort: Bedrijfsauto");
  } else if (lower.includes("aanhanger") || lower.includes("trailer")) {
    conditions.push(`voertuigsoort='Aanhangwagen'`);
    description.push("Voertuigsoort: Aanhangwagen");
  }

  // --- Export status ---
  if (lower.includes("geëxporteerd") || lower.includes("export")) {
    conditions.push(`export_indicator='Ja'`);
    description.push("Geëxporteerd: Ja");
  }

  // --- Taxi ---
  if (lower.includes("taxi")) {
    conditions.push(`taxi_indicator='Ja'`);
    description.push("Taxi: Ja");
  }

  return { conditions, description };
}

export function registerSlimZoeken(server: McpServer): void {
  server.registerTool(
    "rdw_slim_zoeken",
    {
      title: "RDW Slim Zoeken (Smart Search)",
      description: `Slimme zoekmachine die natuurlijke-taal vragen vertaalt naar RDW database queries. Begrijpt Nederlands en Engels, herkent merken, modellen, bouwjaren, kleuren, brandstoftypen en meer.

Args:
  - query (string, required): Zoekvraag in natuurlijke taal.
  - limit (number, optional): Max. resultaten (standaard: 25, max: 200).

Supported query patterns:
  - "alle Tesla Model 3 uit 2020" → merk + model + bouwjaar filter
  - "rode Porsches na 2018" → merk + kleur + bouwjaar filter
  - "dieselautos ouder dan 10 jaar" → brandstof + leeftijd filter
  - "elektrische Hyundais" → merk + brandstof filter
  - "zwarte BMW 3-serie" → merk + model + kleur filter
  - "motorfietsen van Yamaha" → voertuigsoort + merk filter
  - "geëxporteerde voertuigen" → export status filter
  - "taxi's in de database" → taxi indicator filter

Returns:
  - Geïnterpreteerde zoekfilters (wat de zoekmachine heeft begrepen)
  - Tabel met gevonden voertuigen
  - Suggesties als er geen resultaten zijn

Note: Voor een exacte kenteken-zoekopdracht, gebruik rdw_kenteken_zoeken.`,
      inputSchema: SlimZoekenSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: SlimZoekenInput) => {
      try {
        const parsed = parseNaturalQuery(params.query);

        if (parsed.conditions.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `Ik kon geen specifieke filters herkennen in "${params.query}". Probeer een zoekopdracht met een merk, model, bouwjaar, kleur of brandstoftype. Voorbeelden:\n- "Tesla Model 3 uit 2021"\n- "rode BMW na 2019"\n- "dieselautos ouder dan 15 jaar"\n- "elektrische auto's van Volkswagen"`,
            }],
          };
        }

        const whereClause = parsed.conditions.join(" AND ");

        const vehicles = await queryRdw<RdwVehicleRecord>(DATASETS.VEHICLES, {
          where: whereClause,
          order: "datum_eerste_toelating DESC",
          limit: params.limit,
        });

        // Build response
        const lines: string[] = [];
        lines.push("### Zoekopdracht geïnterpreteerd als:");
        for (const desc of parsed.description) {
          lines.push(`- ${desc}`);
        }
        lines.push(`- SODA filter: \`${whereClause}\``);
        lines.push("");

        if (vehicles.length === 0) {
          lines.push("**Geen resultaten gevonden.** Suggesties:");
          lines.push("- Controleer de spelling van het merk of model");
          lines.push("- Probeer bredere zoektermen (bijv. laat bouwjaar of kleur weg)");
          lines.push("- Gebruik rdw_merk_zoeken voor meer filteropties");
        } else {
          lines.push(vehicleListToMarkdown(vehicles));
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
          structuredContent: {
            query: params.query,
            parsed_filters: parsed.description,
            soda_where: whereClause,
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
